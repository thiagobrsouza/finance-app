import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { CategoriesService } from "./categories.service";

type SafeUser = Omit<User, "passwordHash">;

@ApiTags("categories")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({ summary: "Lista categorias pré-cadastradas + custom do usuário, com subcategorias aninhadas" })
  @Get()
  findAll(@CurrentUser() user: SafeUser) {
    return this.categoriesService.findAll(user.id);
  }
}
