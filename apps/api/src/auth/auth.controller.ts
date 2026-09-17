import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { SignupDto } from "./dto/signup.dto";
import { SetPasswordDto } from "./dto/set-password.dto";
import { LoginDto } from "./dto/login.dto";
import { VerifyMfaDto } from "./dto/verify-mfa.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser } from "./current-user.decorator";
import type { User } from "@prisma/client";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: "Inicia o cadastro: cria o usuário (inativo) e envia o e-mail de confirmação" })
  @Post("signup")
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @ApiOperation({ summary: "Conclui o cadastro definindo a senha a partir do token recebido por e-mail" })
  @Post("signup/complete")
  completeSignup(@Body() dto: SetPasswordDto) {
    return this.authService.completeSignup(dto);
  }

  @ApiOperation({ summary: "Valida e-mail/senha e dispara o código de MFA por e-mail" })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: "Valida o código de MFA e emite o par de tokens (access + refresh)" })
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("login/verify-mfa")
  verifyMfa(@Body() dto: VerifyMfaDto) {
    return this.authService.verifyMfa(dto);
  }

  @ApiOperation({ summary: "Troca um refresh token válido por um novo par de tokens (rotação)" })
  @Post("refresh")
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @ApiOperation({ summary: "Revoga o refresh token informado" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("logout")
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken);
  }

  @ApiOperation({ summary: "Dispara e-mail de redefinição de senha (resposta genérica, não revela se o e-mail existe)" })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("forgot-password")
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @ApiOperation({ summary: "Define uma nova senha a partir do token de reset e revoga todas as sessões ativas" })
  @Post("reset-password")
  resetPassword(@Body() dto: SetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @ApiOperation({ summary: "Dispara, para o usuário autenticado, o mesmo fluxo de e-mail do 'esqueci a senha'" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  requestChangePassword(@CurrentUser() user: Omit<User, "passwordHash">) {
    return this.authService.requestChangePassword(user.id);
  }

  @ApiOperation({ summary: "Retorna o perfil do usuário autenticado" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: Omit<User, "passwordHash">) {
    return user;
  }
}
