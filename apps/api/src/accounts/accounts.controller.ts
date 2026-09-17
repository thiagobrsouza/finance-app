import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AccountsService } from "./accounts.service";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";
import { CreateTransferDto } from "./dto/create-transfer.dto";

type SafeUser = Omit<User, "passwordHash">;

@ApiTags("accounts")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @ApiOperation({ summary: "Lista as contas do usuário" })
  @Get("accounts")
  findAll(@CurrentUser() user: SafeUser) {
    return this.accountsService.findAll(user.id);
  }

  @ApiOperation({ summary: "Cria uma nova conta bancária" })
  @Post("accounts")
  create(@CurrentUser() user: SafeUser, @Body() dto: CreateAccountDto) {
    return this.accountsService.create(user.id, dto);
  }

  @ApiOperation({ summary: "Detalha uma conta" })
  @Get("accounts/:id")
  findOne(@CurrentUser() user: SafeUser, @Param("id") id: string) {
    return this.accountsService.findOne(user.id, id);
  }

  @ApiOperation({ summary: "Edita nome, instituição ou tipo da conta" })
  @Patch("accounts/:id")
  update(@CurrentUser() user: SafeUser, @Param("id") id: string, @Body() dto: UpdateAccountDto) {
    return this.accountsService.update(user.id, id, dto);
  }

  @ApiOperation({ summary: "Arquiva a conta (soft delete, preserva histórico)" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete("accounts/:id")
  async archive(@CurrentUser() user: SafeUser, @Param("id") id: string) {
    await this.accountsService.archive(user.id, id);
  }

  @ApiOperation({ summary: "Histórico diário de saldo da conta" })
  @Get("accounts/:id/balance-history")
  balanceHistory(@CurrentUser() user: SafeUser, @Param("id") id: string) {
    return this.accountsService.balanceHistory(user.id, id);
  }

  @ApiOperation({ summary: "Transfere valor entre duas contas do usuário" })
  @Post("transfers")
  createTransfer(@CurrentUser() user: SafeUser, @Body() dto: CreateTransferDto) {
    return this.accountsService.createTransfer(user.id, dto);
  }

  @ApiOperation({ summary: "Lista as transferências do usuário" })
  @Get("transfers")
  listTransfers(@CurrentUser() user: SafeUser) {
    return this.accountsService.listTransfers(user.id);
  }
}
