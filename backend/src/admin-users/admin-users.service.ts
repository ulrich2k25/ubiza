import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, UserRole, UserStatus } from '../../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';

const adminUserSelect = {
  id: true,
  email: true,
  role: true,
  status: true,

  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  lastLoginAt: true,
  deletedAt: true,

  premiumActiveUntil: true,

  trustScore: true,
  trustLevel: true,

  createdAt: true,
  updatedAt: true,

  profile: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  },

  ambassador: {
    select: {
      id: true,
      status: true,
    },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // Liste des utilisateurs
  // ==========================================

  async findAll(
    page = 1,
    limit = 20,
    search?: string,
    status?: UserStatus,
    role?: UserRole,
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);

    const skip = (safePage - 1) * safeLimit;

    const normalizedSearch =
      typeof search === 'string' ? search.trim().slice(0, 100) : '';

    const where: Prisma.UserWhereInput = {
      ...(status ? { status } : {}),
      ...(role ? { role } : {}),

      ...(normalizedSearch
        ? {
            OR: [
              {
                email: {
                  contains: normalizedSearch,
                  mode: 'insensitive' as const,
                },
              },
              {
                profile: {
                  is: {
                    OR: [
                      {
                        username: {
                          contains: normalizedSearch,
                          mode: 'insensitive' as const,
                        },
                      },
                      {
                        displayName: {
                          contains: normalizedSearch,
                          mode: 'insensitive' as const,
                        },
                      },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: adminUserSelect,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: safeLimit,
      }),

      this.prisma.user.count({
        where,
      }),
    ]);

    return {
      value: users,
      Count: total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  // ==========================================
  // Statistiques
  // ==========================================

  async getStatistics() {
    const now = new Date();

    const [
      total,
      active,
      suspended,
      pendingVerification,
      deleted,
      premiumActive,
      ambassadors,
    ] = await Promise.all([
      this.prisma.user.count(),

      this.prisma.user.count({
        where: {
          status: UserStatus.ACTIVE,
        },
      }),

      this.prisma.user.count({
        where: {
          status: UserStatus.SUSPENDED,
        },
      }),

      this.prisma.user.count({
        where: {
          status: UserStatus.PENDING_VERIFICATION,
        },
      }),

      this.prisma.user.count({
        where: {
          status: UserStatus.DELETED,
        },
      }),

      this.prisma.user.count({
        where: {
          status: UserStatus.ACTIVE,
          premiumActiveUntil: {
            gt: now,
          },
        },
      }),

      this.prisma.user.count({
        where: {
          ambassador: {
            isNot: null,
          },
        },
      }),
    ]);

    return {
      total,
      active,
      suspended,
      pendingVerification,
      deleted,
      premiumActive,
      ambassadors,
    };
  }

  // ==========================================
  // Détails utilisateur
  // ==========================================

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: adminUserSelect,
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    return user;
  }

  // ==========================================
  // Suspension utilisateur
  // ==========================================

  async suspend(id: string, adminId: string) {
    if (id === adminId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas suspendre votre propre compte.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        role: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException(
        'La suspension d’un administrateur est interdite.',
      );
    }

    if (user.deletedAt || user.status === UserStatus.DELETED) {
      throw new ConflictException(
        'Un compte supprimé ne peut pas être suspendu.',
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ConflictException('Seul un compte actif peut être suspendu.');
    }

    const result = await this.prisma.user.updateMany({
      where: {
        id,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
      data: {
        status: UserStatus.SUSPENDED,
      },
    });

    if (result.count !== 1) {
      throw new ConflictException(
        'Le statut de cet utilisateur a changé. Veuillez réessayer.',
      );
    }

    return this.findOne(id);
  }

  // ==========================================
  // Réactivation utilisateur
  // ==========================================

  async reactivate(id: string, adminId: string) {
    if (id === adminId) {
      throw new ForbiddenException(
        'Vous ne pouvez pas modifier votre propre statut.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        deletedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException(
        'La réactivation administrative de ce compte est interdite.',
      );
    }

    if (user.deletedAt || user.status === UserStatus.DELETED) {
      throw new ConflictException(
        'Un compte supprimé ne peut pas être réactivé.',
      );
    }

    if (user.status !== UserStatus.SUSPENDED) {
      throw new ConflictException(
        'Seul un compte suspendu peut être réactivé.',
      );
    }

    const nextStatus = user.emailVerifiedAt
      ? UserStatus.ACTIVE
      : UserStatus.PENDING_VERIFICATION;

    const result = await this.prisma.user.updateMany({
      where: {
        id,
        role: UserRole.USER,
        status: UserStatus.SUSPENDED,
        deletedAt: null,
        emailVerifiedAt: user.emailVerifiedAt,
      },
      data: {
        status: nextStatus,
      },
    });

    if (result.count !== 1) {
      throw new ConflictException(
        'Le statut de cet utilisateur a changé. Veuillez réessayer.',
      );
    }

    return this.findOne(id);
  }
}
