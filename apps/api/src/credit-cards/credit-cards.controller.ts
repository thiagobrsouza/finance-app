import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { CreditCardsService } from "./credit-cards.service";
import { CreateCreditCardDto } from "./dto/create-credit-card.dto";
import { UpdateCreditCardDto } from "./dto/update-credit-card.dto";
import { PayInvoiceDto } from "./dto/pay-invoice.dto";

type SafeUser = Omit<User, "passwordHash">;

@ApiTags("credit-cards")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CreditCardsController {
  constructor(private readonly creditCardsService: CreditCardsService) {}

  @ApiOperation({ summary: "Lista os cartões do usuário" })
  @Get("credit-cards")
  findAll(@CurrentUser() user: SafeUser) {
    return this.creditCardsService.findAll(user.id);
  }

  @ApiOperation({ summary: "Cria um cartão de crédito" })
  @Post("credit-cards")
  create(@CurrentUser() user: SafeUser, @Body() dto: CreateCreditCardDto) {
    return this.creditCardsService.create(user.id, dto);
  }

  @ApiOperation({ summary: "Detalha um cartão" })
  @Get("credit-cards/:id")
  findOne(@CurrentUser() user: SafeUser, @Param("id") id: string) {
    return this.creditCardsService.findOne(user.id, id);
  }

  @ApiOperation({ summary: "Edita um cartão" })
  @Patch("credit-cards/:id")
  update(@CurrentUser() user: SafeUser, @Param("id") id: string, @Body() dto: UpdateCreditCardDto) {
    return this.creditCardsService.update(user.id, id, dto);
  }

  @ApiOperation({ summary: "Arquiva o cartão (soft delete)" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete("credit-cards/:id")
  async archive(@CurrentUser() user: SafeUser, @Param("id") id: string) {
    await this.creditCardsService.archive(user.id, id);
  }

  @ApiOperation({ summary: "Lista as faturas do cartão (histórico), criando a atual se ainda não existir" })
  @Get("credit-cards/:id/invoices")
  listInvoices(@CurrentUser() user: SafeUser, @Param("id") id: string) {
    return this.creditCardsService.listInvoices(user.id, id);
  }

  @ApiOperation({ summary: "Fatura em aberto do ciclo atual (cria se ainda não existir)" })
  @Get("credit-cards/:id/invoices/current")
  getCurrentInvoice(@CurrentUser() user: SafeUser, @Param("id") id: string) {
    return this.creditCardsService.getCurrentInvoice(user.id, id);
  }

  @ApiOperation({ summary: "Liquida a fatura usando saldo de uma conta do usuário" })
  @Post("invoices/:id/pay")
  payInvoice(@CurrentUser() user: SafeUser, @Param("id") id: string, @Body() dto: PayInvoiceDto) {
    return this.creditCardsService.payInvoice(user.id, id, dto);
  }
}
