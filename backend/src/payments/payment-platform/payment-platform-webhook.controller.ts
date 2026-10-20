import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import type { Request } from 'express';

import { PaymentsService } from '../payments.service';

interface PaymentCompletedPayload {
  event: 'payment.completed';
  data: {
    id: string;
    amount: number;
    currency: string;
    reference: string;
  };
}

@Controller('webhooks/payment-platform')
export class PaymentPlatformWebhookController {
  private static readonly MAX_TIMESTAMP_AGE_SECONDS = 300;

  constructor(
    private readonly configService: ConfigService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
  async handle(
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-webhook-id') webhookId?: string,
    @Headers('x-webhook-timestamp') timestamp?: string,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    const rawBody = request.rawBody;

    if (!rawBody) {
      throw new BadRequestException('Le corps brut du webhook est absent.');
    }

    if (!webhookId?.trim() || !timestamp?.trim() || !signature?.trim()) {
      throw new UnauthorizedException(
        'Les informations de signature du webhook sont absentes.',
      );
    }

    this.verifyTimestamp(timestamp);
    this.verifySignature(rawBody, timestamp, signature);

    const payload = request.body as PaymentCompletedPayload;

    if (payload.event !== 'payment.completed') {
      return {
        received: true,
        ignored: true,
      };
    }

    if (
      !payload.data?.id ||
      !payload.data.reference ||
      !payload.data.currency ||
      typeof payload.data.amount !== 'number'
    ) {
      throw new BadRequestException('Le webhook de paiement est invalide.');
    }

    return this.paymentsService.handlePaymentPlatformCompleted({
      webhookId,
      paymentPlatformId: payload.data.id,
      reference: payload.data.reference,
      amount: payload.data.amount,
      currency: payload.data.currency,
    });
  }

  private verifyTimestamp(timestamp: string) {
    const parsedTimestamp = Number(timestamp);

    if (!Number.isInteger(parsedTimestamp)) {
      throw new UnauthorizedException('Timestamp webhook invalide.');
    }

    const now = Math.floor(Date.now() / 1000);

    if (
      Math.abs(now - parsedTimestamp) >
      PaymentPlatformWebhookController.MAX_TIMESTAMP_AGE_SECONDS
    ) {
      throw new UnauthorizedException('Webhook expiré.');
    }
  }

  private verifySignature(
    rawBody: Buffer,
    timestamp: string,
    signature: string,
  ) {
    const prefix = 'sha256=';

    if (!signature.startsWith(prefix)) {
      throw new UnauthorizedException('Signature webhook invalide.');
    }

    const receivedHex = signature.slice(prefix.length);

    if (!/^[a-f0-9]{64}$/i.test(receivedHex)) {
      throw new UnauthorizedException('Signature webhook invalide.');
    }

    const fapshiSecret = this.configService
      .get<string>('PAYMENT_PLATFORM_WEBHOOK_SECRET')
      ?.trim();

    const saspaySecret = this.configService
      .get<string>('PAYMENT_PLATFORM_SASPAY_WEBHOOK_SECRET')
      ?.trim();

    const secrets = [fapshiSecret, saspaySecret].filter(
      (secret): secret is string => Boolean(secret),
    );

    if (secrets.length === 0) {
      throw new UnauthorizedException(
        'Aucun secret webhook Payment Platform configuré.',
      );
    }

    const signedPayload = `${timestamp}.${rawBody.toString('utf8')}`;
    const received = Buffer.from(receivedHex, 'hex');

    let validSignature = false;

    for (const secret of secrets) {
      const expected = createHmac('sha256', secret)
        .update(signedPayload)
        .digest();

      if (
        received.length === expected.length &&
        timingSafeEqual(received, expected)
      ) {
        validSignature = true;
      }
    }

    if (!validSignature) {
      throw new UnauthorizedException('Signature webhook invalide.');
    }
  }
}