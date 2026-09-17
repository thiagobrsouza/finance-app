import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { ReportsService } from "./reports.service";
import { ByCategoryQueryDto } from "./dto/by-category-query.dto";
import { ComparisonQueryDto } from "./dto/comparison-query.dto";
import { EvolutionQueryDto } from "./dto/evolution-query.dto";

type SafeUser = Omit<User, "passwordHash">;

@ApiTags("reports")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: "Totais agrupados por categoria em um período (padrão: despesas)" })
  @Get("by-category")
  byCategory(@CurrentUser() user: SafeUser, @Query() query: ByCategoryQueryDto) {
    return this.reportsService.byCategory(user.id, query);
  }

  @ApiOperation({ summary: "Compara o mês de referência com o mês anterior" })
  @Get("comparison")
  comparison(@CurrentUser() user: SafeUser, @Query() query: ComparisonQueryDto) {
    return this.reportsService.comparison(user.id, query);
  }

  @ApiOperation({ summary: "Série mensal de receitas/despesas dos últimos N meses" })
  @Get("evolution")
  evolution(@CurrentUser() user: SafeUser, @Query() query: EvolutionQueryDto) {
    return this.reportsService.evolution(user.id, query);
  }
}
