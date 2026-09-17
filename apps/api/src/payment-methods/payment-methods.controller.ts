import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PaymentMethodsService } from "./payment-methods.service";

@ApiTags("payment-methods")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("payment-methods")
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @ApiOperation({ summary: "Lista fixa de formas de pagamento (somente leitura)" })
  @Get()
  findAll() {
    return this.paymentMethodsService.findAll();
  }
}
