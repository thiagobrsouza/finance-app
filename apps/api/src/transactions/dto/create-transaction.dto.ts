import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TransactionType } from "@prisma/client";

export class RecurringOptionsDto {
  @ApiProperty({ minimum: 1, maximum: 31, description: "Dia do mês em que a transação se repete" })
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth: number;

  @ApiPropertyOptional({ description: "Data final da recorrência (indefinida se omitida)" })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class InstallmentOptionsDto {
  @ApiProperty({ minimum: 2, maximum: 60, description: "Quantidade de parcelas" })
  @IsInt()
  @Min(2)
  @Max(60)
  count: number;
}

export class AdvancedOptionsDto {
  @ApiPropertyOptional({ type: RecurringOptionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecurringOptionsDto)
  recurring?: RecurringOptionsDto;

  @ApiPropertyOptional({ type: InstallmentOptionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => InstallmentOptionsDto)
  installment?: InstallmentOptionsDto;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  ignoreInReports?: boolean;
}

export class CreateTransactionDto {
  @ApiProperty({ example: 150.0 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: "Supermercado" })
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @ApiProperty({ example: "2026-09-17" })
  @IsDateString()
  date: string;

  @ApiProperty()
  @IsUUID()
  categoryId: string;

  @ApiProperty()
  @IsUUID()
  paymentMethodId: string;

  @ApiPropertyOptional({ description: "Obrigatório quando a forma de pagamento não exige cartão" })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ description: "Obrigatório quando a forma de pagamento exige cartão (ex: Crédito)" })
  @IsOptional()
  @IsUUID()
  creditCardId?: string;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiPropertyOptional({ type: AdvancedOptionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdvancedOptionsDto)
  advanced?: AdvancedOptionsDto;
}
