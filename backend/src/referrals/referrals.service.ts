import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';

import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const AMBASSADOR_COMMISSION_RATE = 0.25;

@Injectable()
export class ReferralsService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateUniqueReferralCode(username: string): Promise<string> {
    const usernamePart =
      username
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 12) || 'UBIZA';

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const randomPart = randomBytes(3).toString('hex').toUpperCase();
      const referralCode = `${usernamePart}-${randomPart}`;

      const existingUser = await this.prisma.user.findUnique({
        where: {
          referralCode,
        },
        select: {
          id: true,
        },
      });

      if (!existingUser) {
        return referralCode;
      }
    }

    throw new InternalServerErrorException(
      'Impossible de générer un code de parrainage.',
    );
  }

  async getMine(userId: string) {
    const referredUserSelect = {
      id: true,
      createdAt: true,
      referralRewardGrantedAt: true,

      profile: {
        select: {
          username: true,
          displayName: true,
        },
      },

      listings: {
        where: {
          deletedAt: null,
        },
        select: {
          status: true,
          publishedAt: true,
        },
        orderBy: {
          createdAt: 'desc' as const,
        },
        take: 1,
      },
    };

    let user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        referralCode: true,
        boostCredits: true,

        profile: {
          select: {
            username: true,
          },
        },

        referredUsers: {
          select: referredUserSelect,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    if (!user.referralCode) {
      const referralCode = await this.generateUniqueReferralCode(
        user.profile?.username ?? 'UBIZA',
      );

      user = await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          referralCode,
        },
        select: {
          id: true,
          referralCode: true,
          boostCredits: true,

          profile: {
            select: {
              username: true,
            },
          },

          referredUsers: {
            select: referredUserSelect,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
    }

    const referrals = user.referredUsers.map((referral) => {
      const latestListing = referral.listings[0] ?? null;
      const rewardGranted = referral.referralRewardGrantedAt !== null;

      return {
        id: referral.id,
        username: referral.profile?.username ?? null,
        displayName: referral.profile?.displayName ?? null,
        createdAt: referral.createdAt,

        listingStatus: latestListing?.status ?? null,
        publishedAt: latestListing?.publishedAt ?? null,

        rewardGranted,
        rewardGrantedAt: referral.referralRewardGrantedAt,

        status: rewardGranted ? 'REWARDED' : 'REGISTERED',
      };
    });

    return {
      referralCode: user.referralCode,
      boostCredits: user.boostCredits,

      totalReferrals: referrals.length,

      rewardedReferrals: referrals.filter((referral) => referral.rewardGranted)
        .length,

      pendingReferrals: referrals.filter((referral) => !referral.rewardGranted)
        .length,

      referrals,
    };
  }

  async handleFirstSuccessfulPurchase(
    transaction: Prisma.TransactionClient,
    payment: {
      id: string;
      userId: string;
      currencyId: string;
      amount: Prisma.Decimal;
    },
  ) {
    const referredUser = await transaction.user.findUnique({
      where: {
        id: payment.userId,
      },
      select: {
        id: true,
        referredById: true,
      },
    });

    /*
     * L’acheteur n’a pas été parrainé.
     * Aucune commission ne doit être créée.
     */
    if (!referredUser?.referredById) {
      return null;
    }

    /*
     * Le parrain doit être un ambassadeur actif.
     * Un simple utilisateur qui partage son code reçoit uniquement
     * le crédit Boost prévu par le parrainage classique.
     */
    const ambassador = await transaction.ambassador.findFirst({
      where: {
        userId: referredUser.referredById,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!ambassador) {
      return null;
    }

    /*
     * On crée la relation Ambassador → filleul si elle n’existe pas encore.
     * Cela permet de conserver les anciens filleuls enregistrés uniquement
     * grâce à User.referredById.
     */
    const referral = await transaction.referral.upsert({
      where: {
        referredUserId: referredUser.id,
      },
      update: {},
      create: {
        ambassadorId: ambassador.id,
        referredUserId: referredUser.id,
        status: 'PENDING',
      },
      select: {
        id: true,
        ambassadorId: true,
        firstPurchaseRewardGranted: true,
      },
    });

    /*
     * Sécurité supplémentaire :
     * le filleul doit bien appartenir à cet ambassadeur.
     */
    if (referral.ambassadorId !== ambassador.id) {
      return null;
    }

    /*
     * Une commission existe déjà pour ce filleul.
     */
    if (referral.firstPurchaseRewardGranted) {
      return null;
    }

    /*
     * Réservation atomique du premier achat.
     *
     * Deux confirmations simultanées ne peuvent pas générer
     * deux commissions, car une seule mise à jour pourra passer
     * de false à true.
     */
    const reservation = await transaction.referral.updateMany({
      where: {
        id: referral.id,
        ambassadorId: ambassador.id,
        firstPurchaseRewardGranted: false,
      },
      data: {
        firstPurchaseRewardGranted: true,
        firstPurchaseRewardGrantedAt: new Date(),
        status: 'VALIDATED',
        validatedAt: new Date(),
      },
    });

    if (reservation.count === 0) {
      return null;
    }

    const commissionAmount = payment.amount.mul(AMBASSADOR_COMMISSION_RATE);

    const commission = await transaction.commission.create({
      data: {
        ambassadorId: ambassador.id,
        referralId: referral.id,
        paymentId: payment.id,
        currencyId: payment.currencyId,
        amount: commissionAmount,
        status: 'PENDING',
        description:
          'Commission de 25 % sur le premier achat confirmé du filleul.',
      },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      ...commission,
      amount: commission.amount.toString(),
    };
  }
}
