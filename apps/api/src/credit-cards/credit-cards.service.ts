import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Invoice, InvoiceStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCreditCardDto } from "./dto/create-credit-card.dto";
import { UpdateCreditCardDto } from "./dto/update-credit-card.dto";
import { PayInvoiceDto } from "./dto/pay-invoice.dto";
import { computeCurrentInvoicePeriod } from "./invoice-period.util";

function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Deriva o status de exibição a partir das datas — não depende de um job agendado. */
function withDerivedStatus<T extends Invoice>(invoice: T): T {
  if (invoice.paidAt) {
    return { ...invoice, status: InvoiceStatus.PAID };
  }
  const today = startOfToday();
  if (today > invoice.dueDate) {
    return { ...invoice, status: InvoiceStatus.OVERDUE };
  }
  if (today > invoice.closingDate) {
    return { ...invoice, status: InvoiceStatus.CLOSED };
  }
  return { ...invoice, status: InvoiceStatus.OPEN };
}

@Injectable()
export class CreditCardsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCreditCardDto) {
    const institution = await this.prisma.financialInstitution.findUnique({
      where: { id: dto.institutionId },
    });
    if (!institution) {
      throw new BadRequestException("Instituição financeira não encontrada");
    }

    return this.prisma.creditCard.create({
      data: { userId, ...dto },
      include: { institution: true },
    });
  }

  async findAll(userId: string) {
    return this.prisma.creditCard.findMany({
      where: { userId, archivedAt: null },
      include: { institution: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async findOne(userId: string, id: string) {
    const card = await this.prisma.creditCard.findUnique({
      where: { id },
      include: { institution: true },
    });
    if (!card) {
      throw new NotFoundException("Cartão não encontrado");
    }
    if (card.userId !== userId) {
      throw new ForbiddenException();
    }
    return card;
  }

  async update(userId: string, id: string, dto: UpdateCreditCardDto) {
    await this.findOne(userId, id);

    if (dto.institutionId) {
      const institution = await this.prisma.financialInstitution.findUnique({
        where: { id: dto.institutionId },
      });
      if (!institution) {
        throw new BadRequestException("Instituição financeira não encontrada");
      }
    }

    return this.prisma.creditCard.update({
      where: { id },
      data: dto,
      include: { institution: true },
    });
  }

  async archive(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.creditCard.update({ where: { id }, data: { archivedAt: new Date() } });
  }

  async listInvoices(userId: string, cardId: string) {
    await this.findOne(userId, cardId);
    await this.getOrCreateCurrentInvoice(cardId);

    const invoices = await this.prisma.invoice.findMany({
      where: { creditCardId: cardId },
      orderBy: { referenceMonth: "desc" },
    });

    return invoices.map(withDerivedStatus);
  }

  async getCurrentInvoice(userId: string, cardId: string) {
    await this.findOne(userId, cardId);
    const invoice = await this.getOrCreateCurrentInvoice(cardId);
    return withDerivedStatus(invoice);
  }

  async payInvoice(userId: string, invoiceId: string, dto: PayInvoiceDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { creditCard: true },
    });

    if (!invoice) {
      throw new NotFoundException("Fatura não encontrada");
    }
    if (invoice.creditCard.userId !== userId) {
      throw new ForbiddenException();
    }
    if (invoice.paidAt) {
      throw new BadRequestException("Fatura já está paga");
    }

    const account = await this.prisma.account.findUnique({ where: { id: dto.accountId } });
    if (!account || account.userId !== userId) {
      throw new BadRequestException("Conta inválida");
    }

    const amount = Number(invoice.totalAmount);
    const newBalance = Number(account.currentBalance) - amount;

    const [, updatedInvoice] = await this.prisma.$transaction([
      this.prisma.account.update({ where: { id: account.id }, data: { currentBalance: newBalance } }),
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.PAID,
          paidAmount: amount,
          paidAt: new Date(),
          paidFromAccountId: account.id,
        },
      }),
    ]);

    await this.prisma.accountBalanceSnapshot.upsert({
      where: { accountId_snapshotDate: { accountId: account.id, snapshotDate: startOfToday() } },
      update: { balance: newBalance },
      create: { accountId: account.id, snapshotDate: startOfToday(), balance: newBalance },
    });

    return withDerivedStatus(updatedInvoice);
  }

  private async getOrCreateCurrentInvoice(cardId: string) {
    const card = await this.prisma.creditCard.findUniqueOrThrow({ where: { id: cardId } });
    const period = computeCurrentInvoicePeriod(card.closingDay, card.dueDay);

    const existing = await this.prisma.invoice.findUnique({
      where: {
        creditCardId_referenceMonth: { creditCardId: cardId, referenceMonth: period.referenceMonth },
      },
    });
    if (existing) {
      return existing;
    }

    return this.prisma.invoice.create({
      data: {
        creditCardId: cardId,
        referenceMonth: period.referenceMonth,
        closingDate: period.closingDate,
        dueDate: period.dueDate,
      },
    });
  }
}
