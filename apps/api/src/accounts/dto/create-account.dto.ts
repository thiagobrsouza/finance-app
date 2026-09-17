import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AccountType } from "@prisma/client";

export class CreateAccountDto {
  @ApiProperty({ example: "Conta Corrente" })
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: "id de uma instituição financeira (pré-cadastrada ou custom)" })
  @IsUUID()
  institutionId: string;

  @ApiProperty({ enum: AccountType })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  initialBalance?: number;
}
