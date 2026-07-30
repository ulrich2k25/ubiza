import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BoostsService {
  constructor(private readonly prisma: PrismaService) {}

  async activate(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      include: {
        listings: {
          where: {
            deletedAt: null,
          },

          orderBy: {
            createdAt: 'desc',
          },

          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    if (user.boostCredits < 1) {
      throw new BadRequestException('Vous ne possédez aucun crédit Boost.');
    }

    const listing = user.listings[0];

    if (!listing) {
      throw new BadRequestException(
        "Vous devez publier une annonce avant d'utiliser un Boost.",
      );
    }

    if (listing.boostActiveUntil && listing.boostActiveUntil > new Date()) {
      throw new BadRequestException(
        "Votre annonce bénéficie déjà d'un Boost actif.",
      );
    }

    const boostActiveUntil = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id: user.id,
        },

        data: {
          boostCredits: {
            decrement: 1,
          },
        },
      }),

      this.prisma.listing.update({
        where: {
          id: listing.id,
        },

        data: {
          boostActiveUntil,
        },
      }),
    ]);

    return {
      message: 'Boost activé avec succès.',
      boostActiveUntil,
      remainingCredits: user.boostCredits - 1,
    };
  }

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
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
            boostActiveUntil: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    const listing = user.listings[0] ?? null;
    const boostActiveUntil = listing?.boostActiveUntil ?? null;

    const isBoostActive = Boolean(
      boostActiveUntil && boostActiveUntil > new Date(),
    );

    return {
      boostCredits: user.boostCredits,
      boostActiveUntil,
      isBoostActive,
    };
  }
}
