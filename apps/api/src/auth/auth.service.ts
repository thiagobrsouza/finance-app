import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { AuthTokenType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { generateOpaqueToken, generateOtpCode, hashToken } from "../common/token.util";
import { SignupDto } from "./dto/signup.dto";
import { SetPasswordDto } from "./dto/set-password.dto";
import { LoginDto } from "./dto/login.dto";
import { VerifyMfaDto } from "./dto/verify-mfa.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";

const SIGNUP_TOKEN_TTL_MIN = 30;
const RESET_TOKEN_TTL_MIN = 5;
const MFA_CODE_TTL_MIN = 5;
const MAX_TOKEN_ATTEMPTS = 5;
const REFRESH_TOKEN_TTL_DAYS = 30;

const GENERIC_INVALID_CREDENTIALS = "E-mail ou senha inválidos";
const GENERIC_INVALID_TOKEN = "Token inválido ou expirado";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
  ) {}

  private buildFrontendUrl(path: string, token: string) {
    const base = process.env.FRONTEND_URL ?? "http://localhost:3000";
    return `${base}${path}?token=${token}`;
  }

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (existing?.activatedAt) {
      throw new ConflictException("E-mail já cadastrado");
    }

    const user = existing
      ? await this.prisma.user.update({
          where: { id: existing.id },
          data: { firstName: dto.firstName, lastName: dto.lastName },
        })
      : await this.prisma.user.create({
          data: { firstName: dto.firstName, lastName: dto.lastName, email: dto.email },
        });

    const rawToken = generateOpaqueToken();
    await this.prisma.authToken.create({
      data: {
        userId: user.id,
        type: AuthTokenType.SIGNUP,
        codeHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + SIGNUP_TOKEN_TTL_MIN * 60_000),
      },
    });

    await this.mail.sendSignupEmail(
      user.email,
      user.firstName,
      this.buildFrontendUrl("/cadastro/definir-senha", rawToken),
    );

    return { message: "Enviamos um e-mail de confirmação para concluir seu cadastro." };
  }

  async completeSignup(dto: SetPasswordDto) {
    const token = await this.prisma.authToken.findFirst({
      where: {
        codeHash: hashToken(dto.token),
        type: AuthTokenType.SIGNUP,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!token) {
      throw new BadRequestException(GENERIC_INVALID_TOKEN);
    }

    const passwordHash = await argon2.hash(dto.password);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: token.userId },
        data: { passwordHash, activatedAt: new Date() },
      }),
      this.prisma.authToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: "Cadastro concluído. Você já pode fazer login." };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user?.activatedAt || !user.passwordHash) {
      throw new UnauthorizedException(GENERIC_INVALID_CREDENTIALS);
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException(GENERIC_INVALID_CREDENTIALS);
    }

    const code = generateOtpCode();
    const mfaToken = await this.prisma.authToken.create({
      data: {
        userId: user.id,
        type: AuthTokenType.LOGIN_MFA,
        codeHash: hashToken(code),
        expiresAt: new Date(Date.now() + MFA_CODE_TTL_MIN * 60_000),
      },
    });

    await this.mail.sendMfaCodeEmail(user.email, code);

    return { mfaRequired: true, mfaSessionId: mfaToken.id };
  }

  async verifyMfa(dto: VerifyMfaDto) {
    const token = await this.prisma.authToken.findUnique({ where: { id: dto.mfaSessionId } });

    if (
      !token ||
      token.type !== AuthTokenType.LOGIN_MFA ||
      token.usedAt ||
      token.expiresAt < new Date()
    ) {
      throw new UnauthorizedException(GENERIC_INVALID_TOKEN);
    }

    if (token.attempts >= MAX_TOKEN_ATTEMPTS) {
      throw new UnauthorizedException("Muitas tentativas. Solicite um novo código fazendo login novamente.");
    }

    if (token.codeHash !== hashToken(dto.code)) {
      await this.prisma.authToken.update({
        where: { id: token.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException("Código inválido");
    }

    await this.prisma.authToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    });

    return this.issueTokenPair(token.userId);
  }

  async refresh(rawRefreshToken: string) {
    const tokenHash = hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    if (!stored) {
      throw new UnauthorizedException("Sessão expirada, faça login novamente");
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair(stored.userId);
  }

  async logout(rawRefreshToken: string) {
    const tokenHash = hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (user?.activatedAt) {
      await this.sendPasswordResetToken(user.id, user.email);
    }

    // Resposta genérica sempre, para não revelar se o e-mail existe na base.
    return { message: "Se o e-mail existir em nossa base, enviaremos um link para redefinição de senha." };
  }

  async requestChangePassword(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await this.sendPasswordResetToken(user.id, user.email);
    return { message: "Enviamos um e-mail para você definir sua nova senha." };
  }

  async resetPassword(dto: SetPasswordDto) {
    const token = await this.prisma.authToken.findFirst({
      where: {
        codeHash: hashToken(dto.token),
        type: AuthTokenType.PASSWORD_RESET,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!token) {
      throw new BadRequestException(GENERIC_INVALID_TOKEN);
    }

    const passwordHash = await argon2.hash(dto.password);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: token.userId }, data: { passwordHash } }),
      this.prisma.authToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
      // Ao final da troca de senha, o usuário é deslogado de todas as sessões (conforme escopo).
      this.prisma.refreshToken.updateMany({
        where: { userId: token.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: "Senha alterada com sucesso. Faça login novamente." };
  }

  private async sendPasswordResetToken(userId: string, email: string) {
    const rawToken = generateOpaqueToken();
    await this.prisma.authToken.create({
      data: {
        userId,
        type: AuthTokenType.PASSWORD_RESET,
        codeHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MIN * 60_000),
      },
    });

    await this.mail.sendPasswordResetEmail(
      email,
      this.buildFrontendUrl("/redefinir-senha", rawToken),
    );
  }

  private async issueTokenPair(userId: string) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId },
      {
        secret: process.env.JWT_ACCESS_SECRET ?? "change-me",
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
      },
    );

    const rawRefreshToken = generateOpaqueToken();
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(rawRefreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60_000),
      },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }
}
