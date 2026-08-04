import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ManualPaymentNotificationInput {
  userLabel: string;
  purpose: 'PREMIUM' | 'BOOST';
  description: string;
  amount: string;
  currencyCode: string;
  operator: 'MTN' | 'ORANGE';
  payerPhone: string;
  transactionReference: string;
  paymentId: string;
  submittedAt: string;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendManualPaymentNotification(
    input: ManualPaymentNotificationInput,
  ): Promise<void> {
    const botToken = this.configService
      .get<string>('TELEGRAM_BOT_TOKEN')
      ?.trim();

    const chatId = this.configService
      .get<string>('TELEGRAM_ADMIN_CHAT_ID')
      ?.trim();

    if (!botToken || !chatId) {
      this.logger.warn(
        'Notification Telegram ignorée : configuration absente.',
      );
      return;
    }

    const submittedAt = new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'Africa/Douala',
    }).format(new Date(input.submittedAt));

    const message = [
      '💳 Nouveau paiement manuel Ubiza',
      '',
      `Utilisateur : ${input.userLabel}`,
      `Type : ${input.purpose}`,
      `Offre : ${input.description}`,
      `Montant : ${input.amount} ${input.currencyCode}`,
      `Opérateur : ${input.operator}`,
      `Numéro payeur : ${input.payerPhone}`,
      `Référence : ${input.transactionReference}`,
      `Date : ${submittedAt}`,
      `Payment ID : ${input.paymentId}`,
    ].join('\n');

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          disable_web_page_preview: true,
        }),
      },
    );

    if (!response.ok) {
      const responseBody = await response.text();

      throw new Error(
        `Telegram a refusé la notification (${response.status}) : ${responseBody}`,
      );
    }
  }
}
