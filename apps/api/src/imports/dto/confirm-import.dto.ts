import { ArrayMinSize, IsArray, IsInt, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ConfirmImportDto {
  @ApiProperty({ type: [Number], description: "Índices (do preview) das transações a importar" })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  selectedIndexes: number[];

  @ApiProperty({ description: "Conta que receberá as transações importadas" })
  @IsUUID()
  accountId: string;

  @ApiProperty({ description: "Categoria aplicada a todas as transações importadas" })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ description: "Forma de pagamento aplicada a todas as transações importadas" })
  @IsUUID()
  paymentMethodId: string;
}
