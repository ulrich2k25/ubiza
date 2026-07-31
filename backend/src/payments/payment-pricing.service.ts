import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  InitiatePaymentDto,
  InitiatePaymentPurpose,
  PurchasableBoostDuration,
  PurchasablePremiumPlan,
} from './dto/initiate-payment.dto';

export interface PaymentPrice {
  amount: number;
  currencyCode: string;
  description: string;
  durationMinutes?: number;
  premiumPlan?: PurchasablePremiumPlan;
}

@Injectable()
export class PaymentPricingService {
  constructor(private readonly configService: ConfigService) {}

  getPrice(dto: InitiatePaymentDto): PaymentPrice {
    if (dto.purpose === InitiatePaymentPurpose.PREMIUM) {
      return this.getPremiumPrice(dto.premiumPlan);
    }

    if (dto.purpose === InitiatePaymentPurpose.BOOST) {
      return this.getBoostPrice(dto.boostDuration);
    }

    throw new BadRequestException('Type de paiement invalide.');
  }

  private getPremiumPrice(plan?: PurchasablePremiumPlan): PaymentPrice {
    if (!plan) {
      throw new BadRequestException(
        'Vous devez sélectionner un forfait Premium.',
      );
    }

    const priceByPlan: Record<PurchasablePremiumPlan, string> = {
      [PurchasablePremiumPlan.DAY_1]: 'PREMIUM_PRICE_DAY_1_XAF',
      [PurchasablePremiumPlan.DAYS_7]: 'PREMIUM_PRICE_DAYS_7_XAF',
      [PurchasablePremiumPlan.DAYS_30]: 'PREMIUM_PRICE_DAYS_30_XAF',
    };

    const descriptionByPlan: Record<PurchasablePremiumPlan, string> = {
      [PurchasablePremiumPlan.DAY_1]: 'Abonnement Premium pendant 1 jour',
      [PurchasablePremiumPlan.DAYS_7]: 'Abonnement Premium pendant 7 jours',
      [PurchasablePremiumPlan.DAYS_30]: 'Abonnement Premium pendant 30 jours',
    };

    return {
      amount: this.readPositivePrice(priceByPlan[plan]),
      currencyCode: 'XAF',
      description: descriptionByPlan[plan],
      premiumPlan: plan,
    };
  }

  private getBoostPrice(duration?: PurchasableBoostDuration): PaymentPrice {
    if (!duration) {
      throw new BadRequestException(
        'Vous devez sélectionner une durée de Boost.',
      );
    }

    if (duration !== PurchasableBoostDuration.MINUTES_60) {
      throw new BadRequestException('Cette durée de Boost est indisponible.');
    }

    return {
      amount: this.readPositivePrice('BOOST_PRICE_60_MINUTES_XAF'),
      currencyCode: 'XAF',
      description: "Boost d'annonce pendant 60 minutes",
      durationMinutes: 60,
    };
  }

  private readPositivePrice(environmentVariable: string): number {
    const rawValue = this.configService.get<string>(environmentVariable);

    const amount = Number(rawValue);

    if (!rawValue || !Number.isInteger(amount) || amount <= 0) {
      throw new InternalServerErrorException(
        `Le prix ${environmentVariable} n'est pas correctement configuré.`,
      );
    }

    return amount;
  }
}
