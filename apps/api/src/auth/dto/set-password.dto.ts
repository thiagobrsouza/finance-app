import { IsNotEmpty, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Match } from "../../common/match.decorator";

/** Usado tanto para concluir o cadastro quanto para redefinir a senha (mesmo processo, conforme o escopo). */
export class SetPasswordDto {
  @ApiProperty({ description: "Token recebido por e-mail" })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: "SenhaForte123", minLength: 8 })
  @IsString()
  @MinLength(8, { message: "A senha deve ter no mínimo 8 caracteres" })
  password: string;

  @ApiProperty({ example: "SenhaForte123" })
  @IsString()
  @Match("password", { message: "As senhas não conferem" })
  passwordConfirmation: string;
}
