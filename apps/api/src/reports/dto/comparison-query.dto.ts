import { IsOptional, Matches } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class ComparisonQueryDto {
  @ApiPropertyOptional({ example: "2026-09", description: "Mês de referência (padrão: mês atual)" })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/, { message: "month deve estar no formato YYYY-MM" })
  month?: string;
}
