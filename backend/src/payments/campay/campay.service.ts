import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify } from 'jsonwebtoken';

import type { JwtPayload } from 'jsonwebtoken';

import {
  CamPayCollectRequest,
  CamPayCollectResponse,
  CamPayTransactionStatusResponse,
} from './campay.types';

@Injectable()
export class CamPayService {
  private readonly logger = new Logger(CamPayService.name);

  constructor(private readonly configService: ConfigService) {}

  async collect(input: {
    amount: number;
    phoneNumber: string;
    description: string;
    externalReference: string;
  }): Promise<CamPayCollectResponse> {
    const payload: CamPayCollectRequest = {
      amount: input.amount.toString(),
      currency: 'XAF',
      from: this.normalizeCameroonPhoneNumber(input.phoneNumber),
      description: input.description,
      external_reference: input.externalReference,
    };

    return this.request<CamPayCollectResponse>('/collect/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getTransactionStatus(
    reference: string,
  ): Promise<CamPayTransactionStatusResponse> {
    return this.request<CamPayTransactionStatusResponse>(
      `/transaction/${encodeURIComponent(reference)}/`,
      {
        method: 'GET',
      },
    );
  }

  verifyWebhookSignature(signature?: string): JwtPayload | string {
    if (!signature?.trim()) {
      throw new UnauthorizedException(
        'La signature du webhook CamPay est absente.',
      );
    }

    const webhookSecret = this.getRequiredConfig('CAMPAY_WEBHOOK_SECRET');

    try {
      return verify(signature.trim(), webhookSecret, {
        algorithms: ['HS256'],
      });
    } catch (error) {
      this.logger.warn(
        `Signature webhook CamPay invalide : ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      throw new UnauthorizedException(
        'La signature du webhook CamPay est invalide.',
      );
    }
  }

  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const baseUrl = this.getRequiredConfig('CAMPAY_BASE_URL');
    const accessToken = this.getRequiredConfig('CAMPAY_ACCESS_TOKEN');

    const url = `${baseUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

    let response: Response;

    try {
      response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Token ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options.headers ?? {}),
        },
      });
    } catch (error) {
      this.logger.error(
        `CamPay est inaccessible : ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      throw new BadGatewayException(
        'Le service de paiement Mobile Money est momentanément inaccessible.',
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
        `Erreur CamPay ${response.status} sur ${endpoint}: ${rawBody}`,
      );

      throw new BadGatewayException(
        this.extractErrorMessage(responseBody) ??
          "CamPay n'a pas pu traiter la demande de paiement.",
      );
    }

    return responseBody as T;
  }

  private normalizeCameroonPhoneNumber(phoneNumber: string): string {
    const normalized = phoneNumber.replace(/[^\d+]/g, '');

    if (normalized.startsWith('+237')) {
      return normalized.slice(1);
    }

    if (normalized.startsWith('237')) {
      return normalized;
    }

    if (normalized.startsWith('6') && normalized.length === 9) {
      return `237${normalized}`;
    }

    return normalized;
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
