import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

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

  async create(userId: string, dto: CreateCategoryDto) {
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent || (!parent.isSeeded && parent.userId !== userId)) {
        throw new BadRequestException("Categoria pai não encontrada");
      }
      if (parent.parentId) {
        throw new BadRequestException("Não é possível criar uma subcategoria dentro de outra subcategoria");
      }
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        icon: dto.icon,
        color: dto.color,
        parentId: dto.parentId,
        userId,
        isSeeded: false,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.findOwnedCustom(userId, id);
    return this.prisma.category.update({
      where: { id: category.id },
      data: { name: dto.name, icon: dto.icon, color: dto.color },
    });
  }

  async remove(userId: string, id: string) {
    const category = await this.findOwnedCustom(userId, id);

    const [childrenCount, transactionsCount, recurringRulesCount] = await Promise.all([
      this.prisma.category.count({ where: { parentId: category.id } }),
      this.prisma.transaction.count({ where: { categoryId: category.id } }),
      this.prisma.recurringRule.count({ where: { categoryId: category.id } }),
    ]);

    if (childrenCount > 0) {
      throw new BadRequestException("Remova as subcategorias antes de excluir esta categoria");
    }
    if (transactionsCount > 0 || recurringRulesCount > 0) {
      throw new BadRequestException("Esta categoria tem transações vinculadas e não pode ser removida");
    }

    await this.prisma.category.delete({ where: { id: category.id } });
  }

  private async findOwnedCustom(userId: string, id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException("Categoria não encontrada");
    }
    if (category.isSeeded) {
      throw new ForbiddenException("Categorias pré-cadastradas não podem ser editadas ou removidas");
    }
    if (category.userId !== userId) {
      throw new ForbiddenException();
    }
    return category;
  }
}
