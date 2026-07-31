import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

const BOOST_DURATION_MINUTES = 60;
const BOOST_CREDIT_COST = 1;

@Injectable()
export class BoostsService {
  constructor(private readonly prisma: PrismaService) {}

  async activate(userId: string) {
    const now = new Date();

    const boostActiveUntil = new Date(
      now.getTime() + BOOST_DURATION_MINUTES * 60 * 1000,
    );

    const result = await this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
          deletedAt: true,
          boostCredits: true,

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

      const listing = user.listings[0] ?? null;

      if (!listing) {
        throw new BadRequestException(
          "Vous devez publier une annonce avant d'utiliser un Boost.",
        );
      }

      if (listing.status !== 'PUBLISHED') {
        throw new BadRequestException(
          'Votre annonce doit être en ligne avant de pouvoir être boostée.',
        );
      }

      if (
        listing.boostActiveUntil &&
        listing.boostActiveUntil.getTime() > now.getTime()
      ) {
        throw new BadRequestException(
          "Votre annonce bénéficie déjà d'un Boost actif.",
        );
      }

      /*
       * Réserve et retire le crédit de manière atomique.
       *
       * Cette condition empêche deux requêtes simultanées
       * d'utiliser le même crédit.
       */
      const creditReservation = await transaction.user.updateMany({
        where: {
          id: user.id,
          deletedAt: null,
          boostCredits: {
            gte: BOOST_CREDIT_COST,
          },
        },

        data: {
          boostCredits: {
            decrement: BOOST_CREDIT_COST,
          },
        },
      });

      if (creditReservation.count === 0) {
        throw new BadRequestException('Vous ne possédez aucun crédit Boost.');
      }

      /*
       * Réserve l’annonce pour éviter deux Boosts actifs
       * créés simultanément sur la même annonce.
       */
      const listingActivation = await transaction.listing.updateMany({
        where: {
          id: listing.id,
          userId,
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
          boostActiveUntil,
        },
      });

      if (listingActivation.count === 0) {
        throw new ConflictException(
          "Votre annonce bénéficie déjà d'un Boost actif.",
        );
      }

      const boost = await transaction.boost.create({
        data: {
          listingId: listing.id,
          source: 'REFERRAL_CREDIT',
          status: 'ACTIVE',

          durationMinutes: BOOST_DURATION_MINUTES,
          creditCost: BOOST_CREDIT_COST,

          amount: null,
          currencyId: null,
          paymentId: null,

          startsAt: now,
          endsAt: boostActiveUntil,
        },

        select: {
          id: true,
          source: true,
          status: true,
          durationMinutes: true,
          creditCost: true,
          startsAt: true,
          endsAt: true,
        },
      });

      const updatedUser = await transaction.user.findUnique({
        where: {
          id: user.id,
        },

        select: {
          boostCredits: true,
        },
      });

      if (!updatedUser) {
        throw new NotFoundException('Utilisateur introuvable.');
      }

      return {
        boost,
        remainingCredits: updatedUser.boostCredits,
      };
    });

    return {
      message: 'Boost activé avec succès.',
      boostActiveUntil,
      remainingCredits: result.remainingCredits,
      boost: result.boost,
    };
  }

  async getStatus(userId: string) {
    const now = new Date();

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        deletedAt: true,
        boostCredits: true,

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
            boostActiveUntil: true,

            boosts: {
              orderBy: {
                createdAt: 'desc',
              },

              take: 1,

              select: {
                id: true,
                source: true,
                status: true,
                durationMinutes: true,
                creditCost: true,
                startsAt: true,
                endsAt: true,
              },
            },
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    const listing = user.listings[0] ?? null;
    const latestBoost = listing?.boosts[0] ?? null;
    const boostActiveUntil = listing?.boostActiveUntil ?? null;

    const isBoostActive = Boolean(
      boostActiveUntil && boostActiveUntil.getTime() > now.getTime(),
    );

    return {
      boostCredits: user.boostCredits,
      boostActiveUntil,
      isBoostActive,
      latestBoost,
      durationMinutes: BOOST_DURATION_MINUTES,
    };
  }
}
