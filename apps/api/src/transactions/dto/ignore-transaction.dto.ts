import { IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class IgnoreTransactionDto {
  @ApiProperty()
  @IsBoolean()
  ignore: boolean;
}
