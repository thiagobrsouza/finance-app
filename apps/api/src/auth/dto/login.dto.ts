import { IsEmail, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({ example: "thiago@email.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "SenhaForte123" })
  @IsString()
  @MinLength(1)
  password: string;
}
