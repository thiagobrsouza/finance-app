import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.fromEmail = process.env.RESEND_FROM_EMAIL ?? "FinanceApp <no-reply@localhost>";
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.resend) {
      // Sem RESEND_API_KEY configurada (ex: ambiente local): loga em vez de falhar,
      // para permitir testar o fluxo sem depender do serviço externo.
      this.logger.warn(`RESEND_API_KEY ausente — e-mail para ${to} não enviado. Assunto: ${subject}`);
      this.logger.debug(html);
      return;
    }

    await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject,
      html,
    });
  }

  async sendSignupEmail(to: string, firstName: string, completeSignupUrl: string) {
    await this.send(
      to,
      "Confirme seu cadastro — FinanceApp",
      `<p>Olá, ${firstName}!</p>
       <p>Falta pouco para concluir seu cadastro no FinanceApp. Clique no link abaixo para definir sua senha:</p>
       <p><a href="${completeSignupUrl}">${completeSignupUrl}</a></p>
       <p>Este link é válido por 30 minutos.</p>`,
    );
  }

  async sendMfaCodeEmail(to: string, code: string) {
    await this.send(
      to,
      "Seu código de verificação — FinanceApp",
      `<p>Use o código abaixo para concluir seu login:</p>
       <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
       <p>Este código é válido por 5 minutos. Se não foi você quem tentou entrar, ignore este e-mail.</p>`,
    );
  }

  async sendPasswordResetEmail(to: string, resetUrl: string) {
    await this.send(
      to,
      "Redefinição de senha — FinanceApp",
      `<p>Recebemos uma solicitação para redefinir sua senha.</p>
       <p><a href="${resetUrl}">${resetUrl}</a></p>
       <p>Este link é válido por 5 minutos. Se não foi você, ignore este e-mail — sua senha atual continua válida.</p>`,
    );
  }
}
