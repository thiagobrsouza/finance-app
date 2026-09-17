import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InstitutionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.financialInstitution.findMany({
      where: { OR: [{ isSeeded: true }, { createdByUserId: userId }] },
      orderBy: { name: "asc" },
    });
  }
}
