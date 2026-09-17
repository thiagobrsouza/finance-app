import { IsEmail, IsNotEmpty, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SignupDto {
  @ApiProperty({ example: "Thiago" })
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: "Souza" })
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: "thiago@email.com" })
  @IsEmail()
  email: string;
}
