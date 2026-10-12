import { Injectable, NotFoundException } from '@nestjs/common';

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
}
