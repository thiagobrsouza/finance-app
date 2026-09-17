import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";
import { CreateTransferDto } from "./dto/create-transfer.dto";

function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAccountDto) {
    const institution = await this.prisma.financialInstitution.findUnique({
      where: { id: dto.institutionId },
    });
    if (!institution) {
      throw new BadRequestException("Instituição financeira não encontrada");
    }

    const initialBalance = dto.initialBalance ?? 0;

    const account = await this.prisma.account.create({
      data: {
        userId,
        name: dto.name,
        institutionId: dto.institutionId,
        type: dto.type,
        initialBalance,
        currentBalance: initialBalance,
      },
      include: { institution: true },
    });

    await this.upsertSnapshot(account.id, initialBalance);

    return account;
  }

  async findAll(userId: string) {
    return this.prisma.account.findMany({
      where: { userId, archivedAt: null },
      include: { institution: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async findOne(userId: string, id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: { institution: true },
    });

    if (!account) {
      throw new NotFoundException("Conta não encontrada");
    }
    if (account.userId !== userId) {
      throw new ForbiddenException();
    }

    return account;
  }

  async update(userId: string, id: string, dto: UpdateAccountDto) {
    await this.findOne(userId, id);

    if (dto.institutionId) {
      const institution = await this.prisma.financialInstitution.findUnique({
        where: { id: dto.institutionId },
      });
      if (!institution) {
        throw new BadRequestException("Instituição financeira não encontrada");
      }
    }

    return this.prisma.account.update({
      where: { id },
      data: {
        name: dto.name,
        institutionId: dto.institutionId,
        type: dto.type,
      },
      include: { institution: true },
    });
  }

  async archive(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.account.update({ where: { id }, data: { archivedAt: new Date() } });
  }

  async balanceHistory(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.accountBalanceSnapshot.findMany({
      where: { accountId: id },
      orderBy: { snapshotDate: "asc" },
    });
  }

  async createTransfer(userId: string, dto: CreateTransferDto) {
    if (dto.fromAccountId === dto.toAccountId) {
      throw new BadRequestException("As contas de origem e destino devem ser diferentes");
    }

    const [fromAccount, toAccount] = await Promise.all([
      this.findOne(userId, dto.fromAccountId),
      this.findOne(userId, dto.toAccountId),
    ]);

    const newFromBalance = Number(fromAccount.currentBalance) - dto.amount;
    const newToBalance = Number(toAccount.currentBalance) + dto.amount;

    const transfer = await this.prisma.$transaction(async (tx) => {
      await tx.account.update({ where: { id: fromAccount.id }, data: { currentBalance: newFromBalance } });
      await tx.account.update({ where: { id: toAccount.id }, data: { currentBalance: newToBalance } });

      return tx.transfer.create({
        data: {
          userId,
          fromAccountId: dto.fromAccountId,
          toAccountId: dto.toAccountId,
          amount: dto.amount,
          date: new Date(dto.date),
          description: dto.description,
        },
      });
    });

    await Promise.all([
      this.upsertSnapshot(fromAccount.id, newFromBalance),
      this.upsertSnapshot(toAccount.id, newToBalance),
    ]);

    return transfer;
  }

  async listTransfers(userId: string) {
    return this.prisma.transfer.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
  }

  private async upsertSnapshot(accountId: string, balance: number) {
    const snapshotDate = startOfToday();
    await this.prisma.accountBalanceSnapshot.upsert({
      where: { accountId_snapshotDate: { accountId, snapshotDate } },
      update: { balance },
      create: { accountId, snapshotDate, balance },
    });
  }
}
