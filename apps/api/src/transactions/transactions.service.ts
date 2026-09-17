import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, Transaction, TransactionType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { computeCurrentInvoicePeriod } from "../credit-cards/invoice-period.util";
import { addMonthsClamped, startOfDayUTC } from "./date.util";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { QueryTransactionsDto } from "./dto/query-transactions.dto";

type Tx = Prisma.TransactionClient;

interface ResolvedTarget {
  accountId: string | null;
  creditCardId: string | null;
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto) {
    if (dto.advanced?.recurring && dto.advanced?.installment) {
      throw new BadRequestException("Uma transação não pode ser recorrente e parcelada ao mesmo tempo");
    }

    await this.validateCategory(userId, dto.categoryId);
    const target = await this.resolvePaymentTarget(userId, dto.paymentMethodId, dto.accountId, dto.creditCardId);

    if (dto.advanced?.installment) {
      return this.createInstallments(userId, dto, target);
    }
    if (dto.advanced?.recurring) {
      return this.createRecurring(userId, dto, target);
    }

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: this.baseTransactionData(userId, dto, target, new Date(dto.date)),
      });
      const withInvoice = await this.linkInvoiceIfNeeded(tx, transaction);
      await this.applyEffect(tx, withInvoice, 1);
      return withInvoice;
    });
  }

  private async createInstallments(userId: string, dto: CreateTransactionDto, target: ResolvedTarget) {
    const count = dto.advanced!.installment!.count;
    const perInstallment = Math.floor((dto.amount / count) * 100) / 100;
    const lastInstallmentAmount = Math.round((dto.amount - perInstallment * (count - 1)) * 100) / 100;

    return this.prisma.$transaction(async (tx) => {
      const group = await tx.installmentGroup.create({
        data: {
          userId,
          description: dto.description,
          totalAmount: dto.amount,
          installmentCount: count,
          firstInstallmentDate: new Date(dto.date),
        },
      });

      const created: Transaction[] = [];
      for (let i = 0; i < count; i++) {
        const amount = i === count - 1 ? lastInstallmentAmount : perInstallment;
        const date = addMonthsClamped(new Date(dto.date), i);
        const transaction = await tx.transaction.create({
          data: {
            ...this.baseTransactionData(userId, dto, target, date),
            amount,
            description: `${dto.description} (${i + 1}/${count})`,
            installmentGroupId: group.id,
            installmentNumber: i + 1,
          },
        });
        const withInvoice = await this.linkInvoiceIfNeeded(tx, transaction);
        await this.applyEffect(tx, withInvoice, 1);
        created.push(withInvoice);
      }

      return { group, transactions: created };
    });
  }

  private async createRecurring(userId: string, dto: CreateTransactionDto, target: ResolvedTarget) {
    const { dayOfMonth, endDate } = dto.advanced!.recurring!;
    const startDate = new Date(dto.date);
    const nextRunDate = addMonthsClamped(startDate, 1);

    return this.prisma.$transaction(async (tx) => {
      const rule = await tx.recurringRule.create({
        data: {
          userId,
          description: dto.description,
          amount: dto.amount,
          type: dto.type,
          categoryId: dto.categoryId,
          paymentMethodId: dto.paymentMethodId,
          accountId: target.accountId,
          creditCardId: target.creditCardId,
          dayOfMonth,
          startDate,
          endDate: endDate ? new Date(endDate) : null,
          nextRunDate,
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          ...this.baseTransactionData(userId, dto, target, startDate),
          isRecurring: true,
          recurringRuleId: rule.id,
        },
      });
      const withInvoice = await this.linkInvoiceIfNeeded(tx, transaction);
      await this.applyEffect(tx, withInvoice, 1);

      return { rule, transaction: withInvoice };
    });
  }

  async findAll(userId: string, query: QueryTransactionsDto) {
    return this.prisma.transaction.findMany({
      where: {
        userId,
        ...(query.from || query.to
          ? { date: { ...(query.from ? { gte: new Date(query.from) } : {}), ...(query.to ? { lte: new Date(query.to) } : {}) } }
          : {}),
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query.accountId ? { accountId: query.accountId } : {}),
        ...(query.creditCardId ? { creditCardId: query.creditCardId } : {}),
        ...(query.type ? { type: query.type } : {}),
      },
      include: { category: true, paymentMethod: true },
      orderBy: { date: "desc" },
    });
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: { category: true, paymentMethod: true },
    });
    if (!transaction) {
      throw new NotFoundException("Transação não encontrada");
    }
    if (transaction.userId !== userId) {
      throw new ForbiddenException();
    }
    return transaction;
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const existing = await this.findOne(userId, id);

    const categoryId = dto.categoryId ?? existing.categoryId;
    const paymentMethodId = dto.paymentMethodId ?? existing.paymentMethodId;
    const accountId = "accountId" in dto ? dto.accountId : existing.accountId ?? undefined;
    const creditCardId = "creditCardId" in dto ? dto.creditCardId : existing.creditCardId ?? undefined;

    await this.validateCategory(userId, categoryId);
    const target = await this.resolvePaymentTarget(userId, paymentMethodId, accountId ?? undefined, creditCardId ?? undefined);

    return this.prisma.$transaction(async (tx) => {
      await this.applyEffect(tx, existing, -1);

      const merged = {
        ...existing,
        amount: dto.amount !== undefined ? new Prisma.Decimal(dto.amount) : existing.amount,
        description: dto.description ?? existing.description,
        date: dto.date ? new Date(dto.date) : existing.date,
        type: dto.type ?? existing.type,
        categoryId,
        paymentMethodId,
        accountId: target.accountId,
        creditCardId: target.creditCardId,
      };

      let updated = await tx.transaction.update({
        where: { id },
        data: {
          amount: merged.amount,
          description: merged.description,
          date: merged.date,
          type: merged.type,
          categoryId: merged.categoryId,
          paymentMethodId: merged.paymentMethodId,
          accountId: merged.accountId,
          creditCardId: merged.creditCardId,
          invoiceId: null,
        },
      });

      updated = await this.linkInvoiceIfNeeded(tx, updated);
      await this.applyEffect(tx, updated, 1);

      return updated;
    });
  }

  async remove(userId: string, id: string) {
    const existing = await this.findOne(userId, id);
    await this.prisma.$transaction(async (tx) => {
      await this.applyEffect(tx, existing, -1);
      await tx.transaction.delete({ where: { id } });
    });
  }

  async setIgnore(userId: string, id: string, ignore: boolean) {
    await this.findOne(userId, id);
    return this.prisma.transaction.update({ where: { id }, data: { ignoreInReports: ignore } });
  }

  private baseTransactionData(
    userId: string,
    dto: CreateTransactionDto,
    target: ResolvedTarget,
    date: Date,
  ): Prisma.TransactionUncheckedCreateInput {
    return {
      userId,
      accountId: target.accountId,
      creditCardId: target.creditCardId,
      categoryId: dto.categoryId,
      paymentMethodId: dto.paymentMethodId,
      type: dto.type,
      description: dto.description,
      amount: dto.amount,
      date,
      ignoreInReports: dto.advanced?.ignoreInReports ?? false,
    };
  }

  private async validateCategory(userId: string, categoryId: string) {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new BadRequestException("Categoria não encontrada");
    }
    if (!category.isSeeded && category.userId !== userId) {
      throw new ForbiddenException("Categoria não pertence ao usuário");
    }
  }

  private async resolvePaymentTarget(
    userId: string,
    paymentMethodId: string,
    accountId?: string,
    creditCardId?: string,
  ): Promise<ResolvedTarget> {
    const paymentMethod = await this.prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });
    if (!paymentMethod) {
      throw new BadRequestException("Forma de pagamento não encontrada");
    }

    if (paymentMethod.requiresCreditCard) {
      if (!creditCardId) {
        throw new BadRequestException("Esta forma de pagamento exige um cartão de crédito (creditCardId)");
      }
      const card = await this.prisma.creditCard.findUnique({ where: { id: creditCardId } });
      if (!card || card.userId !== userId) {
        throw new BadRequestException("Cartão de crédito inválido");
      }
      return { accountId: null, creditCardId };
    }

    if (!accountId) {
      throw new BadRequestException("Esta forma de pagamento exige uma conta (accountId)");
    }
    const account = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!account || account.userId !== userId) {
      throw new BadRequestException("Conta inválida");
    }
    return { accountId, creditCardId: null };
  }

  /** Se a transação é no cartão, garante/atualiza o vínculo com a fatura do ciclo correspondente à data. */
  private async linkInvoiceIfNeeded(tx: Tx, transaction: Transaction): Promise<Transaction> {
    if (!transaction.creditCardId) {
      return transaction;
    }

    const card = await tx.creditCard.findUniqueOrThrow({ where: { id: transaction.creditCardId } });
    const period = computeCurrentInvoicePeriod(card.closingDay, card.dueDay, transaction.date);

    let invoice = await tx.invoice.findUnique({
      where: {
        creditCardId_referenceMonth: { creditCardId: card.id, referenceMonth: period.referenceMonth },
      },
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

    return tx.transaction.update({ where: { id: transaction.id }, data: { invoiceId: invoice.id } });
  }

  /** Aplica (sign=1) ou reverte (sign=-1) o efeito financeiro da transação no saldo da conta ou no total da fatura. */
  private async applyEffect(tx: Tx, transaction: Transaction, sign: 1 | -1) {
    const signedAmount = (transaction.type === TransactionType.EXPENSE ? -1 : 1) * Number(transaction.amount) * sign;

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

    if (transaction.invoiceId) {
      const invoiceDelta = (transaction.type === TransactionType.EXPENSE ? 1 : -1) * Number(transaction.amount) * sign;
      const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: transaction.invoiceId } });
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { totalAmount: Number(invoice.totalAmount) + invoiceDelta },
      });
    }
  }
}
