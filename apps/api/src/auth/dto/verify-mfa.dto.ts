import { IsNotEmpty, IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class VerifyMfaDto {
  @ApiProperty({ description: "Retornado por POST /auth/login" })
  @IsString()
  @IsNotEmpty()
  mfaSessionId: string;

  @ApiProperty({ example: "327953", description: "Código de 6 dígitos enviado por e-mail" })
  @IsString()
  @Length(6, 6)
  code: string;
}
