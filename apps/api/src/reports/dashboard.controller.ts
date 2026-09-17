import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { ReportsService } from "./reports.service";

type SafeUser = Omit<User, "passwordHash">;

@ApiTags("dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: "Resumo do painel: saldo total, gastos/entradas do mês, alertas de fatura" })
  @Get("summary")
  summary(@CurrentUser() user: SafeUser) {
    return this.reportsService.dashboardSummary(user.id);
  }
}
