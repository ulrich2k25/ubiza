import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type PaymentPlatformPaymentStatus =
  'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';

export interface PaymentPlatformPayment {
  id: string;
  merchantId?: string;
  amount: number | string;
  currency: string;
  method: string;
  provider: string | null;
  reference?: string | null;
  providerReference: string | null;
  checkoutUrl: string | null;
  status: PaymentPlatformPaymentStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePaymentPlatformPaymentInput {
  amount: number;
  reference: string;
  idempotencyKey: string;
  provider?: 'FAPSHI' | 'SASPAY';
}

@Injectable()
export class PaymentPlatformService {
  private readonly logger = new Logger(PaymentPlatformService.name);

  constructor(private readonly configService: ConfigService) {}

  async createPayment(
    input: CreatePaymentPlatformPaymentInput,
  ): Promise<PaymentPlatformPayment> {
    const payment = await this.request<PaymentPlatformPayment>('/payments', {
      method: 'POST',
      headers: {
        'Idempotency-Key': input.idempotencyKey,
      },
      body: JSON.stringify({
        amount: input.amount,
        currency: 'XAF',
        method: 'MOBILE_MONEY',
        provider: input.provider ?? 'FAPSHI',
        reference: input.reference,
      }),
    });

    if (!payment.id) {
      throw new BadGatewayException(
        "La plateforme de paiement n'a retourné aucun identifiant de paiement.",
      );
    }

    if (!payment.checkoutUrl) {
      throw new BadGatewayException(
        "La plateforme de paiement n'a retourné aucune URL de paiement.",
      );
    }

    this.validateCheckoutUrl(payment.checkoutUrl);

    return payment;
  }

  async getPayment(paymentId: string): Promise<PaymentPlatformPayment> {
    return this.request<PaymentPlatformPayment>(
      `/payments/${encodeURIComponent(paymentId)}`,
      {
        method: 'GET',
      },
    );
  }

  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const baseUrl = this.getRequiredConfig('PAYMENT_PLATFORM_BASE_URL');
    const apiKey = this.getRequiredConfig('PAYMENT_PLATFORM_API_KEY');

    const url = `${baseUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

    let response: Response;

    try {
      response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options.headers ?? {}),
        },
      });
    } catch (error) {
      this.logger.error(
        `Payment Platform est inaccessible : ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      throw new BadGatewayException(
        'Le service de paiement est momentanément inaccessible.',
      );
    }

    const rawBody = await response.text();

    let responseBody: unknown = null;

    if (rawBody) {
      try {
        responseBody = JSON.parse(rawBody);
      } catch {
        responseBody = {
          message: rawBody,
        };
      }
    }

    if (!response.ok) {
      this.logger.error(
        `Erreur Payment Platform ${response.status} sur ${endpoint}: ${rawBody}`,
      );

      throw new BadGatewayException(
        this.extractErrorMessage(responseBody) ??
          "La plateforme de paiement n'a pas pu traiter la demande.",
      );
    }

    return responseBody as T;
  }

  private validateCheckoutUrl(checkoutUrl: string) {
    let url: URL;

    try {
      url = new URL(checkoutUrl);
    } catch {
      throw new BadGatewayException(
        "L'URL de paiement retournée est invalide.",
      );
    }

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new BadGatewayException(
        "L'URL de paiement retournée est invalide.",
      );
    }
  }

  private extractErrorMessage(responseBody: unknown): string | null {
    if (
      !responseBody ||
      typeof responseBody !== 'object' ||
      Array.isArray(responseBody)
    ) {
      return null;
    }

    const body = responseBody as Record<string, unknown>;

    const possibleMessage =
      body.message ?? body.detail ?? body.error ?? body.code;

    return typeof possibleMessage === 'string' ? possibleMessage : null;
  }

  private getRequiredConfig(name: string): string {
    const value = this.configService.get<string>(name)?.trim();

    if (!value) {
      throw new InternalServerErrorException(
        `La variable ${name} n'est pas configurée.`,
      );
    }

    return value;
  }
}
