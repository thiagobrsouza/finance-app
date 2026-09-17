import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsUUID, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateTransferDto {
  @ApiProperty()
  @IsUUID()
  fromAccountId: string;

  @ApiProperty()
  @IsUUID()
  toAccountId: string;

  @ApiProperty({ example: 100.5 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: "2026-09-17" })
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(255)
  description?: string;
}
