import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

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

  @ApiOperation({ summary: "Cria uma categoria ou subcategoria custom" })
  @Post()
  create(@CurrentUser() user: SafeUser, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(user.id, dto);
  }

  @ApiOperation({ summary: "Edita uma categoria custom (não pré-cadastrada)" })
  @Patch(":id")
  update(@CurrentUser() user: SafeUser, @Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(user.id, id, dto);
  }

  @ApiOperation({ summary: "Remove uma categoria custom sem subcategorias/transações vinculadas" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  async remove(@CurrentUser() user: SafeUser, @Param("id") id: string) {
    await this.categoriesService.remove(user.id, id);
  }
}
