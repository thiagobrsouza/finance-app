import { Injectable } from "@nestjs/common";
import { TransactionType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreditCardsService } from "../credit-cards/credit-cards.service";
import { withDerivedStatus } from "../credit-cards/invoice-status.util";
import { monthRange, previousMonth } from "./month-range.util";
import { ByCategoryQueryDto } from "./dto/by-category-query.dto";
import { ComparisonQueryDto } from "./dto/comparison-query.dto";
import { EvolutionQueryDto } from "./dto/evolution-query.dto";

interface PeriodTotals {
  month: string;
  income: number;
  expense: number;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly creditCardsService: CreditCardsService,
  ) {}

  async byCategory(userId: string, query: ByCategoryQueryDto) {
    const type = query.type ?? TransactionType.EXPENSE;

    const grouped = await this.prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        ignoreInReports: false,
        type,
        ...(query.from || query.to
          ? { date: { ...(query.from ? { gte: new Date(query.from) } : {}), ...(query.to ? { lte: new Date(query.to) } : {}) } }
          : {}),
      },
      _sum: { amount: true },
    });

    const categories = await this.prisma.category.findMany({
      where: { id: { in: grouped.map((g) => g.categoryId) } },
    });
    const categoryById = new Map(categories.map((c) => [c.id, c]));

    return grouped
      .map((g) => ({
        categoryId: g.categoryId,
        categoryName: categoryById.get(g.categoryId)?.name ?? "Categoria removida",
        total: Number(g._sum.amount ?? 0),
      }))
      .sort((a, b) => b.total - a.total);
  }

  async comparison(userId: string, query: ComparisonQueryDto) {
    const current = monthRange(query.month);
    const previous = monthRange(previousMonth(current.month));

    const [currentTotals, previousTotals] = await Promise.all([
      this.periodTotals(userId, current.month, current.start, current.end),
      this.periodTotals(userId, previous.month, previous.start, previous.end),
    ]);

    return { current: currentTotals, previous: previousTotals };
  }

  async evolution(userId: string, query: EvolutionQueryDto) {
    const months = query.months ?? 6;
    const now = new Date();
    const results: PeriodTotals[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const monthStr = `${targetDate.getUTCFullYear()}-${String(targetDate.getUTCMonth() + 1).padStart(2, "0")}`;
      const { start, end } = monthRange(monthStr);
      results.push(await this.periodTotals(userId, monthStr, start, end));
    }

    return results;
  }

  async dashboardSummary(userId: string) {
    const [balanceAgg, current, invoiceAlerts] = await Promise.all([
      this.prisma.account.aggregate({
        where: { userId, archivedAt: null },
        _sum: { currentBalance: true },
      }),
      (async () => {
        const { month, start, end } = monthRange();
        return this.periodTotals(userId, month, start, end);
      })(),
      this.invoiceAlerts(userId),
    ]);

    return {
      totalBalance: Number(balanceAgg._sum.currentBalance ?? 0),
      monthIncome: current.income,
      monthExpense: current.expense,
      invoicesOverdue: invoiceAlerts.overdue,
      invoicesDueSoon: invoiceAlerts.dueSoon,
    };
  }

  private async periodTotals(userId: string, month: string, start: Date, end: Date): Promise<PeriodTotals> {
    const grouped = await this.prisma.transaction.groupBy({
      by: ["type"],
      where: { userId, ignoreInReports: false, date: { gte: start, lte: end } },
      _sum: { amount: true },
    });

    const income = Number(grouped.find((g) => g.type === TransactionType.INCOME)?._sum.amount ?? 0);
    const expense = Number(grouped.find((g) => g.type === TransactionType.EXPENSE)?._sum.amount ?? 0);

    return { month, income, expense };
  }

  private async invoiceAlerts(userId: string) {
    const cards = await this.creditCardsService.findAll(userId);
    await Promise.all(cards.map((card) => this.creditCardsService.getCurrentInvoice(userId, card.id)));

    const invoices = await this.prisma.invoice.findMany({
      where: { creditCard: { userId }, paidAt: null },
    });

    const today = new Date();
    const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    let overdue = 0;
    let dueSoon = 0;
    for (const invoice of invoices.map(withDerivedStatus)) {
      if (invoice.status === "OVERDUE") {
        overdue++;
      } else if (invoice.dueDate <= in7Days) {
        dueSoon++;
      }
    }

    return { overdue, dueSoon };
  }
}
