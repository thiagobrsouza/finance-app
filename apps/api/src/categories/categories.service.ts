import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.category.findMany({
      where: { parentId: null, OR: [{ isSeeded: true }, { userId }] },
      include: { children: { orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    });
  }
}
