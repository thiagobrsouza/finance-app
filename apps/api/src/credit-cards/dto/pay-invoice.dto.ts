import { IsIn, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PayInvoiceDto {
  @ApiProperty({ enum: ["ACCOUNT_BALANCE"], description: "Única forma suportada por enquanto" })
  @IsIn(["ACCOUNT_BALANCE"])
  method: "ACCOUNT_BALANCE";

  @ApiProperty({ description: "Conta de onde o valor da fatura será debitado" })
  @IsUUID()
  accountId: string;
}
