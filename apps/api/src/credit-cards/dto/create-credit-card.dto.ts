import { IsInt, IsNotEmpty, IsNumber, IsPositive, IsUUID, Max, MaxLength, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCreditCardDto {
  @ApiProperty({ example: "Nubank Ultravioleta" })
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty()
  @IsUUID()
  institutionId: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @IsPositive()
  limit: number;

  @ApiProperty({ example: 20, minimum: 1, maximum: 31, description: "Dia do fechamento da fatura" })
  @IsInt()
  @Min(1)
  @Max(31)
  closingDay: number;

  @ApiProperty({ example: 27, minimum: 1, maximum: 31, description: "Dia do vencimento da fatura" })
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay: number;
}
