import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.paymentMethod.findMany({ orderBy: { name: "asc" } });
  }
}
