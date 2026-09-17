import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { computeCurrentInvoicePeriod } from "../credit-cards/invoice-period.util";
import { addMonthsClamped, startOfDayUTC } from "./date.util";

/**
 * Gera as ocorrências de transações recorrentes cujo `nextRunDate` já chegou.
 * Roda 1x por dia; cada ocorrência já nasce aplicada (afeta saldo/fatura), igual a uma
 * transação criada manualmente.
 */
@Injectable()
export class RecurringTransactionsJob {
  private readonly logger = new Logger(RecurringTransactionsJob.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async run() {
    const today = startOfDayUTC();
    const dueRules = await this.prisma.recurringRule.findMany({
      where: { active: true, nextRunDate: { lte: today } },
    });

    for (const rule of dueRules) {
      if (rule.endDate && rule.nextRunDate > rule.endDate) {
        await this.prisma.recurringRule.update({ where: { id: rule.id }, data: { active: false } });
        continue;
      }

      await this.prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
          data: {
            userId: rule.userId,
            accountId: rule.accountId,
            creditCardId: rule.creditCardId,
            categoryId: rule.categoryId,
            paymentMethodId: rule.paymentMethodId,
            type: rule.type,
            description: rule.description,
            amount: rule.amount,
            date: rule.nextRunDate,
            isRecurring: true,
            recurringRuleId: rule.id,
          },
        });

        await this.applyEffect(tx, transaction);

        await tx.recurringRule.update({
          where: { id: rule.id },
          data: { nextRunDate: addMonthsClamped(rule.nextRunDate, 1) },
        });
      });

      this.logger.log(`Transação recorrente gerada: regra ${rule.id} (${rule.description})`);
    }
  }

  private async applyEffect(tx: Prisma.TransactionClient, transaction: { id: string; accountId: string | null; creditCardId: string | null; type: string; amount: Prisma.Decimal; date: Date }) {
    const signedAmount = (transaction.type === "EXPENSE" ? -1 : 1) * Number(transaction.amount);

    if (transaction.accountId) {
      const account = await tx.account.findUniqueOrThrow({ where: { id: transaction.accountId } });
      const newBalance = Number(account.currentBalance) + signedAmount;
      await tx.account.update({ where: { id: account.id }, data: { currentBalance: newBalance } });
      await tx.accountBalanceSnapshot.upsert({
        where: { accountId_snapshotDate: { accountId: account.id, snapshotDate: startOfDayUTC() } },
        update: { balance: newBalance },
        create: { accountId: account.id, snapshotDate: startOfDayUTC(), balance: newBalance },
      });
    }

    if (transaction.creditCardId) {
      const card = await tx.creditCard.findUniqueOrThrow({ where: { id: transaction.creditCardId } });
      const period = computeCurrentInvoicePeriod(card.closingDay, card.dueDay, transaction.date);

      let invoice = await tx.invoice.findUnique({
        where: { creditCardId_referenceMonth: { creditCardId: card.id, referenceMonth: period.referenceMonth } },
      });
      if (!invoice) {
        invoice = await tx.invoice.create({
          data: {
            creditCardId: card.id,
            referenceMonth: period.referenceMonth,
            closingDate: period.closingDate,
            dueDate: period.dueDate,
          },
        });
      }

      await tx.transaction.update({ where: { id: transaction.id }, data: { invoiceId: invoice.id } });

      const invoiceDelta = (transaction.type === "EXPENSE" ? 1 : -1) * Number(transaction.amount);
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { totalAmount: Number(invoice.totalAmount) + invoiceDelta },
      });
    }
  }
}
