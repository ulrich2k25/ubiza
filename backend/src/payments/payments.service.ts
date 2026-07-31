import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import {
  InitiatePaymentDto,
  InitiatePaymentPurpose,
} from './dto/initiate-payment.dto';
import { PaymentPricingService } from './payment-pricing.service';
import { ReferralsService } from '../referrals/referrals.service';

const PAYMENT_EXPIRATION_MINUTES = 30;

type PaidPremiumPlan = 'DAY_1' | 'DAYS_7' | 'DAYS_30';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentPricingService: PaymentPricingService,
    private readonly configService: ConfigService,
    private readonly referralsService: ReferralsService,
  ) {}

  async initiate(userId: string, dto: InitiatePaymentDto) {
    this.validatePurchaseSelection(dto);

    const price = this.paymentPricingService.getPrice(dto);

    const expiresAt = new Date(
      Date.now() + PAYMENT_EXPIRATION_MINUTES * 60 * 1000,
    );

    const payment = await this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          deletedAt: true,
          listings: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
            select: {
              id: true,
              status: true,
              boostActiveUntil: true,
            },
          },
        },
      });

      if (!user || user.deletedAt) {
        throw new NotFoundException('Utilisateur introuvable.');
      }

      if (dto.purpose === InitiatePaymentPurpose.BOOST) {
        const listing = user.listings[0] ?? null;

        if (!listing) {
          throw new BadRequestException(
            "Vous devez créer une annonce avant d'acheter un Boost.",
          );
        }

        if (listing.status !== 'PUBLISHED') {
          throw new BadRequestException(
            "Votre annonce doit être publiée avant d'acheter un Boost.",
          );
        }

        if (
          listing.boostActiveUntil &&
          listing.boostActiveUntil.getTime() > Date.now()
        ) {
          throw new BadRequestException(
            "Votre annonce bénéficie déjà d'un Boost actif.",
          );
        }
      }

      const currency = await transaction.currency.findUnique({
        where: {
          code: price.currencyCode,
        },
        select: {
          id: true,
          code: true,
          symbol: true,
          isActive: true,
        },
      });

      if (!currency || !currency.isActive) {
        throw new BadRequestException(
          `La devise ${price.currencyCode} est indisponible.`,
        );
      }

      const externalReference = `UBIZA-${randomUUID()}`;

      return transaction.payment.create({
        data: {
          userId,
          currencyId: currency.id,
          provider: 'MANUAL',
          purpose: dto.purpose,
          status: 'PENDING',
          amount: price.amount,
          externalReference,
          customerPhone: dto.customerPhone?.trim() || null,
          providerData: {
            description: price.description,
            premiumPlan: price.premiumPlan ?? null,
            boostDurationMinutes: price.durationMinutes ?? null,
          },
          expiresAt,
        },
        select: {
          id: true,
          provider: true,
          purpose: true,
          status: true,
          amount: true,
          externalReference: true,
          customerPhone: true,
          expiresAt: true,
          initiatedAt: true,
          currency: {
            select: {
              code: true,
              symbol: true,
            },
          },
        },
      });
    });

    return {
      message: 'Paiement initialisé.',
      payment: {
        ...payment,
        amount: payment.amount.toString(),
      },
    };
  }

  async confirmManualPayment(
    userId: string,
    paymentId: string,
    providedSecret?: string,
  ) {
    this.validateManualPaymentSecret(providedSecret);

    const now = new Date();

    const result = await this.prisma.$transaction(async (transaction) => {
      const payment = await transaction.payment.findFirst({
        where: {
          id: paymentId,
          userId,
        },
        select: {
          id: true,
          userId: true,
          currencyId: true,
          provider: true,
          purpose: true,
          status: true,
          amount: true,
          providerData: true,
          expiresAt: true,
          paidAt: true,
          providerTransactionId: true,

          user: {
            select: {
              id: true,
              deletedAt: true,
              listings: {
                where: {
                  deletedAt: null,
                },
                orderBy: {
                  createdAt: 'desc',
                },
                take: 1,
                select: {
                  id: true,
                  status: true,
                  boostActiveUntil: true,
                },
              },
            },
          },

          premiumSubscription: {
            select: {
              id: true,
              plan: true,
              source: true,
              status: true,
              amount: true,
              startsAt: true,
              endsAt: true,
            },
          },

          boost: {
            select: {
              id: true,
              source: true,
              status: true,
              durationMinutes: true,
              amount: true,
              startsAt: true,
              endsAt: true,
            },
          },
        },
      });

      if (!payment) {
        throw new NotFoundException('Paiement introuvable.');
      }

      if (!payment.user || payment.user.deletedAt) {
        throw new NotFoundException('Utilisateur introuvable.');
      }

      if (payment.provider !== 'MANUAL') {
        throw new BadRequestException(
          'Ce paiement ne peut pas être confirmé manuellement.',
        );
      }

      if (payment.status === 'SUCCESS') {
        return {
          alreadyConfirmed: true,

          payment: {
            id: payment.id,
            status: payment.status,
            paidAt: payment.paidAt,
            providerTransactionId: payment.providerTransactionId,
          },

          premiumSubscription: payment.premiumSubscription
            ? {
                ...payment.premiumSubscription,
                amount: payment.premiumSubscription.amount?.toString() ?? null,
              }
            : null,

          boost: payment.boost
            ? {
                ...payment.boost,
                amount: payment.boost.amount?.toString() ?? null,
              }
            : null,
        };
      }

      if (
        payment.status === 'FAILED' ||
        payment.status === 'CANCELLED' ||
        payment.status === 'EXPIRED'
      ) {
        throw new BadRequestException(
          `Ce paiement ne peut plus être confirmé car son statut est ${payment.status}.`,
        );
      }

      if (payment.expiresAt && payment.expiresAt.getTime() <= now.getTime()) {
        await transaction.payment.updateMany({
          where: {
            id: payment.id,
            status: {
              in: ['PENDING', 'PROCESSING'],
            },
          },
          data: {
            status: 'EXPIRED',
          },
        });

        throw new BadRequestException('Ce paiement a expiré.');
      }

      const paymentReservation = await transaction.payment.updateMany({
        where: {
          id: payment.id,
          userId,
          provider: 'MANUAL',
          status: {
            in: ['PENDING', 'PROCESSING'],
          },
          OR: [
            {
              expiresAt: null,
            },
            {
              expiresAt: {
                gt: now,
              },
            },
          ],
        },
        data: {
          status: 'SUCCESS',
          paidAt: now,
          failureReason: null,
          providerTransactionId: `MANUAL-${payment.id}`,
        },
      });

      if (paymentReservation.count === 0) {
        throw new BadRequestException(
          'Ce paiement est déjà traité ou a expiré.',
        );
      }

      if (payment.purpose === 'PREMIUM') {
        const premiumSubscription = await this.activatePremiumPurchase(
          transaction,
          {
            id: payment.id,
            userId: payment.userId,
            currencyId: payment.currencyId,
            amount: payment.amount,
            providerData: payment.providerData,
          },
          now,
        );

        await this.referralsService.handleFirstSuccessfulPurchase(transaction, {
          id: payment.id,
          userId: payment.userId,
          currencyId: payment.currencyId,
          amount: payment.amount,
        });

        return {
          alreadyConfirmed: false,

          payment: {
            id: payment.id,
            status: 'SUCCESS' as const,
            paidAt: now,
            providerTransactionId: `MANUAL-${payment.id}`,
          },

          premiumSubscription,
          boost: null,
        };
      }

      if (payment.purpose === 'BOOST') {
        const boost = await this.activateBoostPurchase(
          transaction,
          {
            id: payment.id,
            userId: payment.userId,
            currencyId: payment.currencyId,
            amount: payment.amount,
            providerData: payment.providerData,
            user: {
              listings: payment.user.listings,
            },
          },
          now,
        );
        await this.referralsService.handleFirstSuccessfulPurchase(transaction, {
          id: payment.id,
          userId: payment.userId,
          currencyId: payment.currencyId,
          amount: payment.amount,
        });
        return {
          alreadyConfirmed: false,

          payment: {
            id: payment.id,
            status: 'SUCCESS' as const,
            paidAt: now,
            providerTransactionId: `MANUAL-${payment.id}`,
          },

          premiumSubscription: null,
          boost,
        };
      }

      throw new BadRequestException(
        'La destination de ce paiement est invalide.',
      );
    });

    return {
      message: result.alreadyConfirmed
        ? 'Ce paiement avait déjà été confirmé.'
        : result.premiumSubscription
          ? 'Paiement confirmé et Premium activé.'
          : 'Paiement confirmé et Boost activé.',

      ...result,
    };
  }

  getPricing() {
    return {
      premium: [
        {
          plan: 'DAY_1',
          amount: this.paymentPricingService.getPrice({
            purpose: InitiatePaymentPurpose.PREMIUM,
            premiumPlan: 'DAY_1' as any,
          }).amount,
        },
        {
          plan: 'DAYS_7',
          amount: this.paymentPricingService.getPrice({
            purpose: InitiatePaymentPurpose.PREMIUM,
            premiumPlan: 'DAYS_7' as any,
          }).amount,
        },
        {
          plan: 'DAYS_30',
          amount: this.paymentPricingService.getPrice({
            purpose: InitiatePaymentPurpose.PREMIUM,
            premiumPlan: 'DAYS_30' as any,
          }).amount,
        },
      ],

      boost: [
        {
          duration: 'MINUTES_60',
          amount: this.paymentPricingService.getPrice({
            purpose: InitiatePaymentPurpose.BOOST,
            boostDuration: 'MINUTES_60' as any,
          }).amount,
        },
      ],
    };
  }

  async getMine(userId: string) {
    const payments = await this.prisma.payment.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        provider: true,
        purpose: true,
        status: true,
        amount: true,
        externalReference: true,
        providerTransactionId: true,
        customerPhone: true,
        failureReason: true,
        initiatedAt: true,
        paidAt: true,
        failedAt: true,
        cancelledAt: true,
        expiresAt: true,
        createdAt: true,
        currency: {
          select: {
            code: true,
            symbol: true,
          },
        },
      },
    });

    return payments.map((payment) => ({
      ...payment,
      amount: payment.amount.toString(),
    }));
  }

  async getOne(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId,
      },
      select: {
        id: true,
        provider: true,
        purpose: true,
        status: true,
        amount: true,
        externalReference: true,
        providerTransactionId: true,
        customerPhone: true,
        providerData: true,
        failureReason: true,
        initiatedAt: true,
        paidAt: true,
        failedAt: true,
        cancelledAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,

        currency: {
          select: {
            code: true,
            symbol: true,
          },
        },

        premiumSubscription: {
          select: {
            id: true,
            plan: true,
            source: true,
            status: true,
            amount: true,
            startsAt: true,
            endsAt: true,
          },
        },

        boost: {
          select: {
            id: true,
            source: true,
            status: true,
            durationMinutes: true,
            amount: true,
            startsAt: true,
            endsAt: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Paiement introuvable.');
    }

    return {
      ...payment,
      amount: payment.amount.toString(),

      premiumSubscription: payment.premiumSubscription
        ? {
            ...payment.premiumSubscription,
            amount: payment.premiumSubscription.amount?.toString() ?? null,
          }
        : null,

      boost: payment.boost
        ? {
            ...payment.boost,
            amount: payment.boost.amount?.toString() ?? null,
          }
        : null,
    };
  }

  private async activatePremiumPurchase(
    transaction: any,
    payment: {
      id: string;
      userId: string;
      currencyId: string;
      amount: any;
      providerData: unknown;
    },
    now: Date,
  ) {
    const premiumPlan = this.extractPremiumPlan(payment.providerData);

    const durationDays = this.getPremiumDurationDays(premiumPlan);

    const latestActiveSubscription =
      await transaction.premiumSubscription.findFirst({
        where: {
          userId: payment.userId,
          status: 'ACTIVE',
          endsAt: {
            gt: now,
          },
        },
        orderBy: {
          endsAt: 'desc',
        },
        select: {
          endsAt: true,
        },
      });

    const extensionBase = latestActiveSubscription?.endsAt ?? now;

    const endsAt = new Date(
      extensionBase.getTime() + durationDays * 24 * 60 * 60 * 1000,
    );

    const subscription = await transaction.premiumSubscription.create({
      data: {
        userId: payment.userId,
        plan: premiumPlan,
        source: 'PURCHASE',
        status: 'ACTIVE',
        startsAt: now,
        endsAt,
        amount: payment.amount,
        currencyId: payment.currencyId,
        paymentId: payment.id,
      },
      select: {
        id: true,
        plan: true,
        source: true,
        status: true,
        amount: true,
        startsAt: true,
        endsAt: true,
      },
    });

    return {
      ...subscription,
      amount: subscription.amount?.toString() ?? null,
    };
  }

  private async activateBoostPurchase(
    transaction: any,
    payment: {
      id: string;
      userId: string;
      currencyId: string;
      amount: any;
      providerData: unknown;
      user: {
        listings: Array<{
          id: string;
          status: string;
          boostActiveUntil: Date | null;
        }>;
      };
    },
    now: Date,
  ) {
    const listing = payment.user.listings[0] ?? null;

    if (!listing) {
      throw new BadRequestException(
        "Aucune annonce n'est disponible pour ce Boost.",
      );
    }

    if (listing.status !== 'PUBLISHED') {
      throw new BadRequestException(
        "L'annonce doit être publiée pour activer le Boost.",
      );
    }

    if (
      listing.boostActiveUntil &&
      listing.boostActiveUntil.getTime() > now.getTime()
    ) {
      throw new BadRequestException(
        "L'annonce bénéficie déjà d'un Boost actif.",
      );
    }

    const durationMinutes = this.extractBoostDurationMinutes(
      payment.providerData,
    );

    const endsAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

    const listingActivation = await transaction.listing.updateMany({
      where: {
        id: listing.id,
        userId: payment.userId,
        deletedAt: null,
        status: 'PUBLISHED',
        OR: [
          {
            boostActiveUntil: null,
          },
          {
            boostActiveUntil: {
              lte: now,
            },
          },
        ],
      },
      data: {
        boostActiveUntil: endsAt,
      },
    });

    if (listingActivation.count === 0) {
      throw new BadRequestException(
        "L'annonce bénéficie déjà d'un Boost actif.",
      );
    }

    const boost = await transaction.boost.create({
      data: {
        listingId: listing.id,
        source: 'PURCHASE',
        status: 'ACTIVE',
        durationMinutes,
        creditCost: 0,
        amount: payment.amount,
        currencyId: payment.currencyId,
        paymentId: payment.id,
        startsAt: now,
        endsAt,
      },
      select: {
        id: true,
        source: true,
        status: true,
        durationMinutes: true,
        amount: true,
        startsAt: true,
        endsAt: true,
      },
    });

    return {
      ...boost,
      amount: boost.amount?.toString() ?? null,
    };
  }

  private validateManualPaymentSecret(providedSecret?: string) {
    const configuredSecret = this.configService.get<string>(
      'MANUAL_PAYMENT_SECRET',
    );

    if (
      !configuredSecret ||
      !providedSecret ||
      providedSecret !== configuredSecret
    ) {
      throw new UnauthorizedException('Secret de confirmation invalide.');
    }
  }

  private extractPremiumPlan(providerData: unknown): PaidPremiumPlan {
    if (
      !providerData ||
      typeof providerData !== 'object' ||
      Array.isArray(providerData)
    ) {
      throw new BadRequestException(
        'Les informations du forfait Premium sont absentes.',
      );
    }

    const premiumPlan = (providerData as Record<string, unknown>).premiumPlan;

    if (
      premiumPlan !== 'DAY_1' &&
      premiumPlan !== 'DAYS_7' &&
      premiumPlan !== 'DAYS_30'
    ) {
      throw new BadRequestException(
        'Le forfait Premium du paiement est invalide.',
      );
    }

    return premiumPlan;
  }

  private extractBoostDurationMinutes(providerData: unknown): number {
    if (
      !providerData ||
      typeof providerData !== 'object' ||
      Array.isArray(providerData)
    ) {
      throw new BadRequestException('Les informations du Boost sont absentes.');
    }

    const duration = (providerData as Record<string, unknown>)
      .boostDurationMinutes;

    if (
      typeof duration !== 'number' ||
      !Number.isInteger(duration) ||
      duration <= 0
    ) {
      throw new BadRequestException('La durée du Boost est invalide.');
    }

    return duration;
  }

  private getPremiumDurationDays(plan: PaidPremiumPlan): number {
    const durations: Record<PaidPremiumPlan, number> = {
      DAY_1: 1,
      DAYS_7: 7,
      DAYS_30: 30,
    };

    return durations[plan];
  }

  private validatePurchaseSelection(dto: InitiatePaymentDto) {
    if (dto.purpose === InitiatePaymentPurpose.PREMIUM && !dto.premiumPlan) {
      throw new BadRequestException('Le forfait Premium est obligatoire.');
    }

    if (dto.purpose === InitiatePaymentPurpose.PREMIUM && dto.boostDuration) {
      throw new BadRequestException(
        'Une durée de Boost ne peut pas accompagner un achat Premium.',
      );
    }

    if (dto.purpose === InitiatePaymentPurpose.BOOST && !dto.boostDuration) {
      throw new BadRequestException('La durée du Boost est obligatoire.');
    }

    if (dto.purpose === InitiatePaymentPurpose.BOOST && dto.premiumPlan) {
      throw new BadRequestException(
        'Un forfait Premium ne peut pas accompagner un achat de Boost.',
      );
    }
  }
}
