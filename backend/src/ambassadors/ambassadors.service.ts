import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}
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
            whatsappNumber: dto.whatsappNumber.trim(),
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
        whatsappNumber: dto.whatsappNumber.trim(),
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

        payouts: {
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
      .filter((commission) => commission.status === CommissionStatus.PENDING)
      .reduce((sum, commission) => sum + Number(commission.amount), 0);

    const totalApprovedBalance = ambassador.commissions
      .filter((commission) => commission.status === CommissionStatus.APPROVED)
      .reduce((sum, commission) => sum + Number(commission.amount), 0);

    const processingBalance = ambassador.payouts
      .filter(
        (payout) =>
          payout.status === PayoutStatus.PENDING ||
          payout.status === PayoutStatus.PROCESSING,
      )
      .reduce((sum, payout) => sum + Number(payout.amount), 0);

    const availableBalance = Math.max(
      totalApprovedBalance - processingBalance,
      0,
    );

    const paidBalance = ambassador.commissions
      .filter((commission) => commission.status === CommissionStatus.PAID)
      .reduce((sum, commission) => sum + Number(commission.amount), 0);

    const totalEarnings =
      pendingBalance + availableBalance + processingBalance + paidBalance;

    return {
      hasApplied: true,
      ambassador: {
        ...ambassador,
        pendingBalance,
        availableBalance,
        processingBalance,
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

        payouts: {
          where: {
            status: {
              in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING],
            },
          },
          orderBy: {
            requestedAt: 'desc',
          },
          take: 1,
          select: {
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

        activePayoutStatus: ambassador.payouts[0]?.status ?? null,
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

  async approveEligibleCommissions() {
    const rawDelayDays = this.configService.get<string>(
      'AMBASSADOR_COMMISSION_APPROVAL_DELAY_DAYS',
    );

    const approvalDelayDays = Number(rawDelayDays ?? '7');

    if (!Number.isInteger(approvalDelayDays) || approvalDelayDays < 0) {
      throw new BadRequestException(
        'Le délai d’approbation des commissions est invalide.',
      );
    }

    const eligibleBefore = new Date(
      Date.now() - approvalDelayDays * 24 * 60 * 60 * 1000,
    );

    const eligibleCommissions = await this.prisma.commission.findMany({
      where: {
        status: CommissionStatus.PENDING,
        createdAt: {
          lte: eligibleBefore,
        },
        payment: {
          status: 'SUCCESS',
        },
        ambassador: {
          status: AmbassadorStatus.ACTIVE,
        },
      },
      select: {
        id: true,
        amount: true,
      },
    });

    if (eligibleCommissions.length === 0) {
      return {
        message: 'Aucune commission éligible à approuver.',
        approvedCount: 0,
        approvedAmount: 0,
        approvalDelayDays,
      };
    }

    const result = await this.prisma.commission.updateMany({
      where: {
        id: {
          in: eligibleCommissions.map((commission) => commission.id),
        },
        status: CommissionStatus.PENDING,
      },
      data: {
        status: CommissionStatus.APPROVED,
        approvedAt: new Date(),
      },
    });

    const approvedAmount = eligibleCommissions.reduce(
      (sum, commission) => sum + Number(commission.amount),
      0,
    );

    return {
      message: `${result.count} commission(s) approuvée(s).`,
      approvedCount: result.count,
      approvedAmount,
      approvalDelayDays,
    };
  }
  async approveCommission(commissionId: string) {
    const rawDelayDays = this.configService.get<string>(
      'AMBASSADOR_COMMISSION_APPROVAL_DELAY_DAYS',
    );

    const approvalDelayDays = Number(rawDelayDays ?? '7');

    if (!Number.isInteger(approvalDelayDays) || approvalDelayDays < 0) {
      throw new BadRequestException(
        'Le délai d’approbation des commissions est invalide.',
      );
    }

    const commission = await this.prisma.commission.findUnique({
      where: {
        id: commissionId,
      },
      include: {
        payment: {
          select: {
            id: true,
            status: true,
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

    if (!commission) {
      throw new NotFoundException('Commission introuvable.');
    }

    if (commission.status !== CommissionStatus.PENDING) {
      throw new BadRequestException(
        'Seule une commission en attente peut être approuvée.',
      );
    }

    if (!commission.payment) {
      throw new BadRequestException(
        "Aucun paiement n'est associé à cette commission.",
      );
    }

    if (commission.payment.status !== 'SUCCESS') {
      throw new BadRequestException(
        "Le paiement associé à cette commission n'est pas confirmé.",
      );
    }

    if (commission.ambassador.status !== AmbassadorStatus.ACTIVE) {
      throw new BadRequestException(
        "Le compte ambassadeur associé n'est pas actif.",
      );
    }

    const eligibleAt = new Date(
      commission.createdAt.getTime() + approvalDelayDays * 24 * 60 * 60 * 1000,
    );

    if (eligibleAt.getTime() > Date.now()) {
      throw new BadRequestException(
        `Cette commission ne pourra être approuvée qu'à partir du ${eligibleAt.toLocaleDateString(
          'fr-FR',
        )}.`,
      );
    }

    const result = await this.prisma.commission.updateMany({
      where: {
        id: commissionId,
        status: CommissionStatus.PENDING,
      },
      data: {
        status: CommissionStatus.APPROVED,
        approvedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new BadRequestException('Cette commission a déjà été modifiée.');
    }

    return this.prisma.commission.findUnique({
      where: {
        id: commissionId,
      },
      include: {
        ambassador: {
          select: {
            id: true,
            fullName: true,
            referralCode: true,
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
        payment: {
          select: {
            id: true,
            amount: true,
            purpose: true,
            status: true,
            paidAt: true,
          },
        },
        currency: {
          select: {
            id: true,
            code: true,
            symbol: true,
          },
        },
      },
    });
  }

  async cancelCommission(
    commissionId: string,
    reason: string,
    adminUserId: string,
  ) {
    const normalizedReason = reason.trim();

    if (normalizedReason.length < 3) {
      throw new BadRequestException(
        "La raison de l'annulation est obligatoire.",
      );
    }

    const commission = await this.prisma.commission.findUnique({
      where: {
        id: commissionId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!commission) {
      throw new NotFoundException('Commission introuvable.');
    }

    if (commission.status === CommissionStatus.PAID) {
      throw new BadRequestException(
        'Une commission déjà payée ne peut pas être annulée directement.',
      );
    }

    if (commission.status === CommissionStatus.CANCELLED) {
      throw new BadRequestException('Cette commission est déjà annulée.');
    }

    if (
      commission.status !== CommissionStatus.PENDING &&
      commission.status !== CommissionStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Cette commission ne peut pas être annulée.',
      );
    }

    const result = await this.prisma.commission.updateMany({
      where: {
        id: commissionId,
        status: {
          in: [CommissionStatus.PENDING, CommissionStatus.APPROVED],
        },
      },
      data: {
        status: CommissionStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: normalizedReason,
        cancelledByAdminId: adminUserId,
      },
    });

    if (result.count === 0) {
      throw new BadRequestException('Cette commission a déjà été modifiée.');
    }

    return this.prisma.commission.findUnique({
      where: {
        id: commissionId,
      },
      include: {
        ambassador: {
          select: {
            id: true,
            fullName: true,
            referralCode: true,
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
        payment: {
          select: {
            id: true,
            amount: true,
            purpose: true,
            status: true,
            paidAt: true,
          },
        },
        currency: {
          select: {
            id: true,
            code: true,
            symbol: true,
          },
        },
      },
    });
  }

  async requestPayout(userId: string) {
    const ambassador = await this.prisma.ambassador.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        status: true,
        identityVerifiedAt: true,
        minimumPayout: true,
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

    const commissions = await this.prisma.commission.findMany({
      where: {
        ambassadorId: ambassador.id,
        status: CommissionStatus.APPROVED,
        payoutItems: {
          none: {
            payout: {
              status: {
                in: [
                  PayoutStatus.PENDING,
                  PayoutStatus.PROCESSING,
                  PayoutStatus.PAID,
                ],
              },
            },
          },
        },
      },
      select: {
        id: true,
        amount: true,
      },
    });

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

      await tx.payoutItem.createMany({
        data: commissions.map((commission) => ({
          payoutId: payout.id,
          commissionId: commission.id,
        })),
      });

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

  async findAllCommissionsForAdmin() {
    return this.prisma.commission.findMany({
      include: {
        ambassador: {
          select: {
            id: true,
            fullName: true,
            referralCode: true,
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

        payment: {
          select: {
            id: true,
            amount: true,
            purpose: true,
            status: true,
            paidAt: true,
          },
        },

        currency: {
          select: {
            id: true,
            code: true,
            symbol: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
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
        items: {
          select: {
            commissionId: true,
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

    if (payout.status !== PayoutStatus.PROCESSING) {
      throw new BadRequestException(
        'Seul un paiement en cours peut être validé.',
      );
    }

    if (payout.items.length === 0) {
      throw new BadRequestException(
        "Aucune commission n'est associée à ce paiement.",
      );
    }

    const commissionIds = payout.items.map((item) => item.commissionId);

    const paidAt = new Date();
    const normalizedReference = paymentReference?.trim() || undefined;

    return this.prisma.$transaction(async (tx) => {
      const updatedPayout = await tx.payout.updateMany({
        where: {
          id,
          status: PayoutStatus.PROCESSING,
        },
        data: {
          status: PayoutStatus.PAID,
          paidAt,
          paymentReference: normalizedReference,
        },
      });

      if (updatedPayout.count === 0) {
        throw new BadRequestException('Ce paiement a déjà été modifié.');
      }

      const updatedCommissions = await tx.commission.updateMany({
        where: {
          id: {
            in: commissionIds,
          },
          status: CommissionStatus.APPROVED,
        },
        data: {
          status: CommissionStatus.PAID,
          paidAt,
        },
      });

      if (updatedCommissions.count !== commissionIds.length) {
        throw new BadRequestException(
          'Certaines commissions associées ne sont plus disponibles.',
        );
      }

      return tx.payout.findUniqueOrThrow({
        where: {
          id,
        },
      });
    });
  }

  async rejectPayout(id: string, reason: string, adminUserId: string) {
    const normalizedReason = reason.trim();

    if (normalizedReason.length < 3) {
      throw new BadRequestException('La raison du refus est obligatoire.');
    }

    const payout = await this.prisma.payout.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        status: true,

        items: {
          select: {
            commissionId: true,
          },
        },
      },
    });

    if (!payout) {
      throw new NotFoundException('Paiement introuvable.');
    }

    if (
      payout.status !== PayoutStatus.PENDING &&
      payout.status !== PayoutStatus.PROCESSING
    ) {
      throw new BadRequestException(
        'Seul un retrait en attente ou en traitement peut être refusé.',
      );
    }

    if (payout.items.length === 0) {
      throw new BadRequestException(
        "Aucune commission n'est associée à ce retrait.",
      );
    }

    const commissionIds = payout.items.map((item) => item.commissionId);

    const cancelledAt = new Date();

    return this.prisma.$transaction(async (tx) => {
      const updatedPayout = await tx.payout.updateMany({
        where: {
          id,
          status: {
            in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING],
          },
        },

        data: {
          status: PayoutStatus.CANCELLED,
          processedAt: cancelledAt,
          paidAt: null,
          failureReason: normalizedReason,
        },
      });

      if (updatedPayout.count === 0) {
        throw new BadRequestException('Ce retrait a déjà été modifié.');
      }

      const updatedCommissions = await tx.commission.updateMany({
        where: {
          id: {
            in: commissionIds,
          },

          status: CommissionStatus.APPROVED,
        },

        data: {
          status: CommissionStatus.CANCELLED,
          cancelledAt,
          cancellationReason: normalizedReason,
          cancelledByAdminId: adminUserId,
        },
      });

      if (updatedCommissions.count !== commissionIds.length) {
        throw new BadRequestException(
          'Certaines commissions associées ne peuvent plus être annulées.',
        );
      }

      return tx.payout.findUniqueOrThrow({
        where: {
          id,
        },

        include: {
          items: true,
        },
      });
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
