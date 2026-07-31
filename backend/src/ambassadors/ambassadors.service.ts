import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AmbassadorStatus,
  CommissionStatus,
  ListingStatus,
  PayoutStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApplyAmbassadorDto } from './dto/apply-ambassador.dto';

@Injectable()
export class AmbassadorsService {
  constructor(private readonly prisma: PrismaService) {}

  async apply(userId: string, dto: ApplyAmbassadorDto) {
    if (!dto.acceptTerms) {
      throw new BadRequestException(
        'Vous devez accepter les conditions du programme ambassadeur.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        emailVerifiedAt: true,
        referralCode: true,
        listings: {
          where: {
            status: ListingStatus.PUBLISHED,
          },
          take: 1,
          select: {
            id: true,
          },
        },
        ambassador: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException(
        'Vous devez vérifier votre adresse e-mail avant de postuler.',
      );
    }

    if (user.listings.length === 0) {
      throw new ForbiddenException(
        'Vous devez avoir au moins une annonce publiée avant de postuler.',
      );
    }

    if (user.ambassador) {
      if (user.ambassador.status === AmbassadorStatus.REJECTED) {
        return this.prisma.ambassador.update({
          where: {
            id: user.ambassador.id,
          },
          data: {
            fullName: dto.fullName.trim(),
            mobileMoneyNumber: dto.mobileMoneyNumber.trim(),
            identityNumber: dto.identityNumber.trim(),
            country: dto.country.trim(),
            termsAcceptedAt: new Date(),
            status: AmbassadorStatus.PENDING,
            rejectedAt: null,
            rejectionReason: null,
            approvedAt: null,
            suspendedAt: null,
          },
        });
      }

      throw new ConflictException(
        'Vous avez déjà une candidature ou un compte ambassadeur.',
      );
    }

    if (!user.referralCode) {
      throw new BadRequestException(
        'Votre code de parrainage est introuvable.',
      );
    }

    return this.prisma.ambassador.create({
      data: {
        userId,
        referralCode: user.referralCode,
        fullName: dto.fullName.trim(),
        mobileMoneyNumber: dto.mobileMoneyNumber.trim(),
        identityNumber: dto.identityNumber.trim(),
        country: dto.country.trim(),
        termsAcceptedAt: new Date(),
        status: AmbassadorStatus.PENDING,
      },
    });
  }

  async getMine(userId: string) {
    const ambassador = await this.prisma.ambassador.findUnique({
      where: {
        userId,
      },
      include: {
        _count: {
          select: {
            referrals: true,
            commissions: true,
          },
        },
        commissions: {
          select: {
            amount: true,
            status: true,
          },
        },
      },
    });

    if (!ambassador) {
      return {
        hasApplied: false,
        ambassador: null,
      };
    }

    const pendingBalance = ambassador.commissions
      .filter((c) => c.status === CommissionStatus.PENDING)
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const availableBalance = ambassador.commissions
      .filter((c) => c.status === CommissionStatus.APPROVED)
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const paidBalance = ambassador.commissions
      .filter((c) => c.status === CommissionStatus.PAID)
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const totalEarnings = pendingBalance + availableBalance + paidBalance;

    return {
      hasApplied: true,
      ambassador: {
        ...ambassador,
        pendingBalance,
        availableBalance,
        paidBalance,
        totalEarnings,
      },
    };
  }

  async findAllForAdmin(status?: AmbassadorStatus) {
    const ambassadors = await this.prisma.ambassador.findMany({
      where: status
        ? {
            status,
          }
        : undefined,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            createdAt: true,
            profile: {
              select: {
                username: true,
                displayName: true,
              },
            },
          },
        },

        commissions: {
          select: {
            amount: true,
            status: true,
          },
        },

        _count: {
          select: {
            referrals: true,
            commissions: true,
            payouts: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return ambassadors.map((ambassador) => {
      const pendingBalance = ambassador.commissions
        .filter((commission) => commission.status === CommissionStatus.PENDING)
        .reduce((sum, commission) => sum + Number(commission.amount), 0);

      const availableBalance = ambassador.commissions
        .filter((commission) => commission.status === CommissionStatus.APPROVED)
        .reduce((sum, commission) => sum + Number(commission.amount), 0);

      const paidBalance = ambassador.commissions
        .filter((commission) => commission.status === CommissionStatus.PAID)
        .reduce((sum, commission) => sum + Number(commission.amount), 0);

      const totalEarnings = pendingBalance + availableBalance + paidBalance;

      return {
        ...ambassador,

        pendingBalance,
        availableBalance,
        paidBalance,
        totalEarnings,
      };
    });
  }

  async findOneForAdmin(id: string) {
    const ambassador = await this.prisma.ambassador.findUnique({
      where: {
        id,
      },

      include: {
        user: {
          select: {
            id: true,
            email: true,
            emailVerifiedAt: true,
            phoneVerifiedAt: true,
            status: true,
            createdAt: true,

            profile: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                phone: true,
                whatsapp: true,
                telegram: true,
                instagram: true,
                city: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },

            listings: {
              select: {
                id: true,
                title: true,
                status: true,
                publishedAt: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },

        referrals: {
          include: {
            referredUser: {
              select: {
                id: true,
                email: true,
                status: true,
                createdAt: true,

                profile: {
                  select: {
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },

                listings: {
                  select: {
                    id: true,
                    title: true,
                    status: true,
                    publishedAt: true,
                  },
                  orderBy: {
                    createdAt: 'desc',
                  },
                },

                payments: {
                  select: {
                    id: true,
                    amount: true,
                    purpose: true,
                    status: true,
                    paidAt: true,
                    createdAt: true,
                  },
                  orderBy: {
                    createdAt: 'asc',
                  },
                },
              },
            },

            commissions: {
              include: {
                currency: {
                  select: {
                    id: true,
                    code: true,
                    symbol: true,
                  },
                },

                payment: {
                  select: {
                    id: true,
                    amount: true,
                    purpose: true,
                    status: true,
                    paidAt: true,
                    createdAt: true,
                  },
                },
              },

              orderBy: {
                createdAt: 'desc',
              },
            },
          },

          orderBy: {
            createdAt: 'desc',
          },
        },

        commissions: {
          include: {
            currency: {
              select: {
                id: true,
                code: true,
                symbol: true,
              },
            },

            payment: {
              select: {
                id: true,
                amount: true,
                purpose: true,
                status: true,
                paidAt: true,
                createdAt: true,
              },
            },

            referral: {
              include: {
                referredUser: {
                  select: {
                    id: true,
                    email: true,

                    profile: {
                      select: {
                        username: true,
                        displayName: true,
                      },
                    },
                  },
                },
              },
            },
          },

          orderBy: {
            createdAt: 'desc',
          },
        },

        payouts: {
          include: {
            currency: {
              select: {
                id: true,
                code: true,
                symbol: true,
              },
            },

            items: {
              include: {
                commission: {
                  include: {
                    currency: {
                      select: {
                        id: true,
                        code: true,
                        symbol: true,
                      },
                    },

                    referral: {
                      include: {
                        referredUser: {
                          select: {
                            id: true,
                            email: true,

                            profile: {
                              select: {
                                username: true,
                                displayName: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },

          orderBy: {
            requestedAt: 'desc',
          },
        },
      },
    });

    if (!ambassador) {
      throw new NotFoundException('Ambassadeur introuvable.');
    }

    const pendingBalance = ambassador.commissions
      .filter((commission) => commission.status === CommissionStatus.PENDING)
      .reduce((sum, commission) => sum + Number(commission.amount), 0);

    const availableBalance = ambassador.commissions
      .filter((commission) => commission.status === CommissionStatus.APPROVED)
      .reduce((sum, commission) => sum + Number(commission.amount), 0);

    const paidBalance = ambassador.commissions
      .filter((commission) => commission.status === CommissionStatus.PAID)
      .reduce((sum, commission) => sum + Number(commission.amount), 0);

    const totalEarnings = pendingBalance + availableBalance + paidBalance;

    const totalReferrals = ambassador.referrals.length;

    const publishedListings = ambassador.referrals.filter((referral) =>
      referral.referredUser.listings.some(
        (listing) => listing.status === ListingStatus.PUBLISHED,
      ),
    ).length;

    const firstPurchases = ambassador.referrals.filter(
      (referral) => referral.firstPurchaseRewardGranted,
    ).length;

    const pendingCommissions = ambassador.commissions.filter(
      (commission) => commission.status === CommissionStatus.PENDING,
    ).length;

    const approvedCommissions = ambassador.commissions.filter(
      (commission) => commission.status === CommissionStatus.APPROVED,
    ).length;

    const paidCommissions = ambassador.commissions.filter(
      (commission) => commission.status === CommissionStatus.PAID,
    ).length;

    const conversionRate =
      totalReferrals === 0
        ? 0
        : Math.round((firstPurchases / totalReferrals) * 100);

    return {
      ...ambassador,

      stats: {
        totalReferrals,
        publishedListings,
        firstPurchases,

        pendingCommissions,
        approvedCommissions,
        paidCommissions,

        conversionRate,

        totalEarnings,
        pendingBalance,
        availableBalance,
        paidBalance,
      },
    };
  }

  async approve(id: string) {
    const ambassador = await this.getAmbassadorOrThrow(id);

    if (ambassador.status === AmbassadorStatus.ACTIVE) {
      throw new ConflictException('Cet ambassadeur est déjà actif.');
    }

    return this.prisma.ambassador.update({
      where: {
        id,
      },
      data: {
        status: AmbassadorStatus.ACTIVE,
        approvedAt: new Date(),
        rejectedAt: null,
        rejectionReason: null,
        suspendedAt: null,
      },
    });
  }

  async reject(id: string, reason: string) {
    const ambassador = await this.getAmbassadorOrThrow(id);

    if (ambassador.status === AmbassadorStatus.REJECTED) {
      throw new ConflictException('Cette candidature est déjà refusée.');
    }

    return this.prisma.ambassador.update({
      where: {
        id,
      },
      data: {
        status: AmbassadorStatus.REJECTED,
        rejectionReason: reason.trim(),
        rejectedAt: new Date(),
        approvedAt: null,
        suspendedAt: null,
      },
    });
  }

  async suspend(id: string) {
    const ambassador = await this.getAmbassadorOrThrow(id);

    if (ambassador.status !== AmbassadorStatus.ACTIVE) {
      throw new BadRequestException(
        'Seul un ambassadeur actif peut être suspendu.',
      );
    }

    return this.prisma.ambassador.update({
      where: {
        id,
      },
      data: {
        status: AmbassadorStatus.SUSPENDED,
        suspendedAt: new Date(),
      },
    });
  }

  async reactivate(id: string) {
    const ambassador = await this.getAmbassadorOrThrow(id);

    if (ambassador.status !== AmbassadorStatus.SUSPENDED) {
      throw new BadRequestException(
        'Seul un ambassadeur suspendu peut être réactivé.',
      );
    }

    return this.prisma.ambassador.update({
      where: {
        id,
      },
      data: {
        status: AmbassadorStatus.ACTIVE,
        suspendedAt: null,
        approvedAt: ambassador.approvedAt ?? new Date(),
      },
    });
  }

  async verifyIdentity(id: string) {
    const ambassador = await this.getAmbassadorOrThrow(id);

    if (ambassador.status !== AmbassadorStatus.ACTIVE) {
      throw new BadRequestException(
        'Seul un ambassadeur actif peut être vérifié.',
      );
    }

    const existingAmbassador = await this.prisma.ambassador.findUnique({
      where: {
        id,
      },
      select: {
        identityVerifiedAt: true,
      },
    });

    if (existingAmbassador?.identityVerifiedAt) {
      throw new ConflictException(
        'L’identité de cet ambassadeur est déjà vérifiée.',
      );
    }

    return this.prisma.ambassador.update({
      where: {
        id,
      },
      data: {
        identityVerifiedAt: new Date(),
        identityVerificationRequestedAt: null,
      },
    });
  }

  async requestIdentityVerification(userId: string) {
    const ambassador = await this.prisma.ambassador.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        status: true,
        identityVerifiedAt: true,
        identityVerificationRequestedAt: true,
      },
    });

    if (!ambassador) {
      throw new NotFoundException('Ambassadeur introuvable.');
    }

    if (ambassador.status !== AmbassadorStatus.ACTIVE) {
      throw new BadRequestException(
        "Votre compte ambassadeur n'est pas actif.",
      );
    }

    if (ambassador.identityVerifiedAt) {
      throw new ConflictException('Votre identité est déjà vérifiée.');
    }

    if (ambassador.identityVerificationRequestedAt) {
      throw new ConflictException(
        'Une demande de vérification est déjà en cours.',
      );
    }

    return this.prisma.ambassador.update({
      where: {
        id: ambassador.id,
      },
      data: {
        identityVerificationRequestedAt: new Date(),
      },
    });
  }

  async requestPayout(userId: string) {
    const ambassador = await this.prisma.ambassador.findUnique({
      where: {
        userId,
      },
      include: {
        commissions: true,
      },
    });

    if (!ambassador) {
      throw new NotFoundException('Ambassadeur introuvable.');
    }

    if (ambassador.status !== AmbassadorStatus.ACTIVE) {
      throw new BadRequestException(
        "Votre compte ambassadeur n'est pas actif.",
      );
    }

    if (!ambassador.identityVerifiedAt) {
      throw new BadRequestException(
        'Votre identité doit être vérifiée avant un paiement.',
      );
    }
    const existingPayout = await this.prisma.payout.findFirst({
      where: {
        ambassadorId: ambassador.id,
        status: {
          in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING],
        },
      },
    });

    if (existingPayout) {
      throw new BadRequestException(
        'Une demande de paiement est déjà en cours de traitement.',
      );
    }

    const commissions = ambassador.commissions.filter(
      (commission) => commission.status === CommissionStatus.APPROVED,
    );

    const total = commissions.reduce(
      (sum, commission) => sum + Number(commission.amount),
      0,
    );

    if (total < Number(ambassador.minimumPayout)) {
      throw new BadRequestException(
        "Le montant minimum de paiement n'est pas atteint.",
      );
    }
    return this.prisma.$transaction(async (tx) => {
      const currency = await tx.currency.findFirst();

      if (!currency) {
        throw new BadRequestException('Aucune devise configurée.');
      }

      const payout = await tx.payout.create({
        data: {
          ambassadorId: ambassador.id,
          currencyId: currency.id,
          amount: total,
          status: PayoutStatus.PENDING,
        },
      });

      for (const commission of commissions) {
        await tx.payoutItem.create({
          data: {
            payoutId: payout.id,
            commissionId: commission.id,
          },
        });

        await tx.commission.update({
          where: {
            id: commission.id,
          },
          data: {
            status: CommissionStatus.PAID,
            paidAt: new Date(),
          },
        });
      }

      return payout;
    });
  }
  private async getAmbassadorOrThrow(id: string) {
    const ambassador = await this.prisma.ambassador.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        status: true,
        approvedAt: true,
      },
    });

    if (!ambassador) {
      throw new NotFoundException('Ambassadeur introuvable.');
    }

    return ambassador;
  }

  async findAllPayoutsForAdmin(status?: PayoutStatus) {
    return this.prisma.payout.findMany({
      where: status
        ? {
            status,
          }
        : undefined,
      include: {
        ambassador: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
        currency: true,
        items: {
          include: {
            commission: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });
  }

  async startPayout(id: string) {
    const payout = await this.prisma.payout.findUnique({
      where: {
        id,
      },
      include: {
        ambassador: {
          select: {
            identityVerifiedAt: true,
          },
        },
      },
    });

    if (!payout) {
      throw new NotFoundException('Paiement introuvable.');
    }

    if (!payout.ambassador.identityVerifiedAt) {
      throw new BadRequestException(
        "L'identité de l'ambassadeur doit être vérifiée avant le paiement.",
      );
    }
    if (payout.status !== PayoutStatus.PENDING) {
      throw new BadRequestException('Ce paiement ne peut plus être traité.');
    }

    return this.prisma.payout.update({
      where: {
        id,
      },
      data: {
        status: PayoutStatus.PROCESSING,
        processedAt: new Date(),
      },
    });
  }

  async markPayoutAsPaid(id: string, paymentReference?: string) {
    const payout = await this.prisma.payout.findUnique({
      where: {
        id,
      },
      include: {
        ambassador: {
          select: {
            identityVerifiedAt: true,
          },
        },
      },
    });

    if (!payout) {
      throw new NotFoundException('Paiement introuvable.');
    }

    if (!payout.ambassador.identityVerifiedAt) {
      throw new BadRequestException(
        "L'identité de l'ambassadeur doit être vérifiée avant le paiement.",
      );
    }

    if (!payout) {
      throw new NotFoundException('Paiement introuvable.');
    }

    if (payout.status !== PayoutStatus.PROCESSING) {
      throw new BadRequestException(
        'Seul un paiement en cours peut être validé.',
      );
    }

    return this.prisma.payout.update({
      where: {
        id,
      },
      data: {
        status: PayoutStatus.PAID,
        paidAt: new Date(),
        paymentReference,
      },
    });
  }

  async getMyPayouts(userId: string) {
    const ambassador = await this.prisma.ambassador.findUnique({
      where: {
        userId,
      },
    });

    if (!ambassador) {
      return [];
    }

    return this.prisma.payout.findMany({
      where: {
        ambassadorId: ambassador.id,
      },
      include: {
        currency: true,
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });
  }
}
