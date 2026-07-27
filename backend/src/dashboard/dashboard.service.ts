import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        trustScore: true,
        trustLevel: true,
        createdAt: true,

        profile: {
          select: {
            displayName: true,
            avatarUrl: true,
            description: true,
            profileQualityScore: true,

            phone: true,
            whatsapp: true,
            telegram: true,

            city: {
              select: {
                id: true,
                name: true,
              },
            },

            language: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },

        listings: {
          where: {
            status: {
              not: 'DELETED',
            },
          },

          orderBy: {
            createdAt: 'desc',
          },

          take: 1,

          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            availableNow: true,
            viewCount: true,
            publishedAt: true,
            pausedAt: true,
            createdAt: true,

            city: {
              select: {
                id: true,
                name: true,
              },
            },

            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },

            images: {
              orderBy: {
                position: 'asc',
              },

              select: {
                id: true,
                url: true,
                position: true,
                isPrimary: true,
                faceBlurRequested: true,
                faceBlurApplied: true,
              },
            },

            _count: {
              select: {
                favorites: true,
                reviews: true,
                contactClicks: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    const listing = user.listings[0] ?? null;

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        trustScore: user.trustScore,
        trustLevel: user.trustLevel,
        createdAt: user.createdAt,
      },

      profile: user.profile,

      listing: listing
        ? {
            id: listing.id,
            title: listing.title,
            description: listing.description,
            status: listing.status,
            availableNow: listing.availableNow,
            viewCount: listing.viewCount,
            publishedAt: listing.publishedAt,
            pausedAt: listing.pausedAt,
            createdAt: listing.createdAt,
            city: listing.city,
            category: listing.category,
            images: listing.images,
          }
        : null,

      stats: {
        views: listing?.viewCount ?? 0,
        favorites: listing?._count.favorites ?? 0,
        reviews: listing?._count.reviews ?? 0,
        contactClicks: listing?._count.contactClicks ?? 0,
      },
    };
  }
}
