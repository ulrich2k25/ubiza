import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';

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
          select: {
            id: true,
            createdAt: true,

            profile: {
              select: {
                username: true,
                displayName: true,
              },
            },
          },

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
            select: {
              id: true,
              createdAt: true,

              profile: {
                select: {
                  username: true,
                  displayName: true,
                },
              },
            },

            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
    }

    return {
      referralCode: user.referralCode,
      boostCredits: user.boostCredits,
      totalReferrals: user.referredUsers.length,

      referrals: user.referredUsers.map((referral) => ({
        id: referral.id,
        username: referral.profile?.username ?? null,
        displayName: referral.profile?.displayName ?? null,
        createdAt: referral.createdAt,
      })),
    };
  }
}
