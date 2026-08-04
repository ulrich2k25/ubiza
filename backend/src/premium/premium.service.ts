import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

const PREMIUM_TRIAL_DURATION_DAYS = 3;

@Injectable()
export class PremiumService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retourne le statut Premium de l’utilisateur connecté.
   */
  async getMyPremium(userId: string) {
    const user = await this.findPremiumUser(userId);

    return this.buildPremiumStatus(user);
  }

  /**
   * Active l’essai Premium gratuit de 3 jours.
   *
   * L’essai ne peut être utilisé qu’une seule fois.
   * Il ne peut pas être activé si un Premium est déjà actif.
   */
  async startFreeTrial(userId: string) {
    const now = new Date();

    const trialEndsAt = new Date(now);
    trialEndsAt.setDate(trialEndsAt.getDate() + PREMIUM_TRIAL_DURATION_DAYS);

    const currentUser = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        deletedAt: true,
        premiumTrialUsed: true,
        premiumActiveUntil: true,
      },
    });

    if (!currentUser || currentUser.deletedAt) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    if (
      currentUser.premiumActiveUntil &&
      currentUser.premiumActiveUntil > now
    ) {
      throw new BadRequestException('Votre compte Premium est déjà actif.');
    }

    if (currentUser.premiumTrialUsed) {
      throw new ConflictException(
        'Votre essai gratuit Premium a déjà été utilisé.',
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      /*
       * updateMany empêche deux activations simultanées
       * du même essai gratuit.
       */
      const activation = await transaction.user.updateMany({
        where: {
          id: userId,
          deletedAt: null,
          premiumTrialUsed: false,

          OR: [
            {
              premiumActiveUntil: null,
            },
            {
              premiumActiveUntil: {
                lte: now,
              },
            },
          ],
        },

        data: {
          premiumTrialUsed: true,
          premiumTrialStartedAt: now,
          premiumActiveUntil: trialEndsAt,
        },
      });

      if (activation.count === 0) {
        throw new ConflictException(
          'L’essai gratuit Premium ne peut pas être activé.',
        );
      }

      await transaction.premiumSubscription.create({
        data: {
          userId,
          plan: 'TRIAL_3_DAYS',
          source: 'TRIAL',
          status: 'ACTIVE',
          startsAt: now,
          endsAt: trialEndsAt,
        },
      });
    });

    return this.getMyPremium(userId);
  }

  /**
   * Recherche les informations Premium d’un utilisateur.
   */
  private async findPremiumUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        deletedAt: true,
        premiumTrialUsed: true,
        premiumTrialStartedAt: true,
        premiumActiveUntil: true,

        premiumSubscriptions: {
          orderBy: {
            createdAt: 'desc',
          },

          take: 1,

          select: {
            id: true,
            plan: true,
            source: true,
            status: true,
            startsAt: true,
            endsAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    return user;
  }

  /**
   * Construit la réponse utilisée par le frontend.
   */
  private buildPremiumStatus(
    user: Awaited<ReturnType<PremiumService['findPremiumUser']>>,
  ) {
    const now = new Date();
    const latestSubscription = user.premiumSubscriptions[0] ?? null;

    const isPremium = Boolean(
      user.premiumActiveUntil &&
      user.premiumActiveUntil.getTime() > now.getTime(),
    );

    const isTrial = Boolean(
      isPremium &&
      latestSubscription?.source === 'TRIAL' &&
      latestSubscription.status === 'ACTIVE',
    );

    const daysRemaining =
      isPremium && user.premiumActiveUntil
        ? Math.max(
            0,
            Math.ceil(
              (user.premiumActiveUntil.getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          )
        : 0;

    const canStartTrial = !user.premiumTrialUsed && !isPremium;

    return {
      id: user.id,
      premiumTrialUsed: user.premiumTrialUsed,
      premiumTrialStartedAt: user.premiumTrialStartedAt,
      premiumActiveUntil: user.premiumActiveUntil,
      premiumSubscriptions: user.premiumSubscriptions,

      isPremium,
      isTrial,
      daysRemaining,
      canStartTrial,
      trialDurationDays: PREMIUM_TRIAL_DURATION_DAYS,
    };
  }
}
