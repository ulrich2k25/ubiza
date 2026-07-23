import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrustLevel } from '../../generated/prisma/client';

type TrustScoreResult = {
  score: number;
  level: TrustLevel;
  contactAccessEnabled: boolean;
};

@Injectable()
export class TrustService {
  constructor(private readonly prisma: PrismaService) {}

  async recalculateUserTrust(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        acceptedRulesAt: true,
        lastLoginAt: true,
        createdAt: true,
        trustLevel: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const result = this.calculateTrustScore(user);

    /*
     * RESTRICTED est un niveau de sanction manuelle.
     * Un simple recalcul ne doit pas supprimer cette restriction.
     */
    const finalLevel =
      user.trustLevel === TrustLevel.RESTRICTED
        ? TrustLevel.RESTRICTED
        : result.level;

    const contactAccessEnabled =
      finalLevel !== TrustLevel.RESTRICTED && result.contactAccessEnabled;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        trustScore: result.score,
        trustLevel: finalLevel,
        contactAccessEnabled,
        trustUpdatedAt: new Date(),
      },
      select: {
        id: true,
        trustScore: true,
        trustLevel: true,
        contactAccessEnabled: true,
        trustUpdatedAt: true,
      },
    });
  }

  private calculateTrustScore(user: {
    emailVerifiedAt: Date | null;
    phoneVerifiedAt: Date | null;
    acceptedRulesAt: Date | null;
    lastLoginAt: Date | null;
    createdAt: Date;
  }): TrustScoreResult {
    let score = 0;
    const now = new Date();

    if (user.emailVerifiedAt) {
      score += 30;
    }

    if (user.phoneVerifiedAt) {
      score += 30;
    }

    if (user.acceptedRulesAt) {
      score += 10;
    }

    const accountAgeInDays = this.getDifferenceInDays(now, user.createdAt);

    if (accountAgeInDays >= 7) {
      score += 10;
    }

    if (accountAgeInDays >= 30) {
      score += 10;
    }

    if (user.lastLoginAt) {
      const daysSinceLastLogin = this.getDifferenceInDays(
        now,
        user.lastLoginAt,
      );

      if (daysSinceLastLogin <= 30) {
        score += 10;
      }
    }

    score = Math.min(Math.max(score, 0), 100);

    const level = this.determineTrustLevel(score);

    return {
      score,
      level,
      contactAccessEnabled: level === TrustLevel.TRUSTED,
    };
  }

  private determineTrustLevel(score: number): TrustLevel {
    if (score >= 60) {
      return TrustLevel.TRUSTED;
    }

    if (score >= 30) {
      return TrustLevel.BASIC;
    }

    return TrustLevel.NEW;
  }

  private getDifferenceInDays(laterDate: Date, earlierDate: Date): number {
    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    return Math.floor(
      (laterDate.getTime() - earlierDate.getTime()) / millisecondsPerDay,
    );
  }

  canAccessContact(user: { contactAccessEnabled: boolean }): boolean {
    return user.contactAccessEnabled;
  }
}
