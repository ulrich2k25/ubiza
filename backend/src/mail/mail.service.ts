import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await this.resend.emails.send({
      from: process.env.MAIL_FROM!,
      to: email,
      subject: 'Vérifiez votre adresse e-mail',
      html: `
        <h2>Bienvenue sur Ubiza 👋</h2>

        <p>
          Cliquez sur le bouton ci-dessous pour vérifier votre adresse e-mail.
        </p>

        <p>
          <a
            href="${verificationUrl}"
            style="
              display:inline-block;
              padding:12px 20px;
              background:#d946ef;
              color:white;
              text-decoration:none;
              border-radius:8px;
            "
          >
            Vérifier mon e-mail
          </a>
        </p>

        <p>
          Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet e-mail.
        </p>
      `,
    });
  }
}
