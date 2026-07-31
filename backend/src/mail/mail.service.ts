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
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await this.resend.emails.send({
      from: process.env.MAIL_FROM!,
      to: email,
      subject: 'Réinitialisation de votre mot de passe Ubiza',
      html: `
      <h2>Réinitialisation du mot de passe 🔐</h2>

      <p>
        Nous avons reçu une demande de réinitialisation de votre mot de passe.
      </p>

      <p>
        Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
      </p>

      <p>
        <a
          href="${resetUrl}"
          style="
            display:inline-block;
            padding:12px 20px;
            background:#d946ef;
            color:white;
            text-decoration:none;
            border-radius:8px;
          "
        >
          Réinitialiser mon mot de passe
        </a>
      </p>

      <p>
        Ce lien est valable pendant <strong>30 minutes</strong>.
      </p>

      <p>
        Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.
      </p>
    `,
    });
  }
}
