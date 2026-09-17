import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { TransactionsService } from "./transactions.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { QueryTransactionsDto } from "./dto/query-transactions.dto";
import { IgnoreTransactionDto } from "./dto/ignore-transaction.dto";

type SafeUser = Omit<User, "passwordHash">;

@ApiTags("transactions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @ApiOperation({ summary: "Lista transações do usuário, com filtros opcionais" })
  @Get()
  findAll(@CurrentUser() user: SafeUser, @Query() query: QueryTransactionsDto) {
    return this.transactionsService.findAll(user.id, query);
  }

  @ApiOperation({ summary: "Cria uma transação simples, parcelada ou recorrente" })
  @Post()
  create(@CurrentUser() user: SafeUser, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(user.id, dto);
  }

  @ApiOperation({ summary: "Detalha uma transação" })
  @Get(":id")
  findOne(@CurrentUser() user: SafeUser, @Param("id") id: string) {
    return this.transactionsService.findOne(user.id, id);
  }

  @ApiOperation({ summary: "Edita os dados de uma ocorrência (não reestrutura parcelamento/recorrência)" })
  @Patch(":id")
  update(@CurrentUser() user: SafeUser, @Param("id") id: string, @Body() dto: UpdateTransactionDto) {
    return this.transactionsService.update(user.id, id, dto);
  }

  @ApiOperation({ summary: "Remove uma ocorrência, revertendo seu efeito no saldo/fatura" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  async remove(@CurrentUser() user: SafeUser, @Param("id") id: string) {
    await this.transactionsService.remove(user.id, id);
  }

  @ApiOperation({ summary: "Marca/desmarca a transação para ser ignorada nos relatórios" })
  @Patch(":id/ignore")
  setIgnore(@CurrentUser() user: SafeUser, @Param("id") id: string, @Body() dto: IgnoreTransactionDto) {
    return this.transactionsService.setIgnore(user.id, id, dto.ignore);
  }
}
