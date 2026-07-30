import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id: listingId,
        status: 'PUBLISHED',
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!listing) {
      throw new NotFoundException(
        'Cette annonce est introuvable ou indisponible.',
      );
    }

    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingFavorite) {
      throw new ConflictException('Cette annonce est déjà dans vos favoris.');
    }

    await this.prisma.favorite.create({
      data: {
        userId,
        listingId,
      },
    });

    const favoriteCount = await this.prisma.favorite.count({
      where: {
        listingId,
      },
    });

    return {
      message: 'Annonce ajoutée aux favoris.',
      isFavorite: true,
      favoriteCount,
    };
  }

  async remove(userId: string, listingId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!favorite) {
      throw new NotFoundException(
        'Cette annonce ne se trouve pas dans vos favoris.',
      );
    }

    await this.prisma.favorite.delete({
      where: {
        id: favorite.id,
      },
    });

    const favoriteCount = await this.prisma.favorite.count({
      where: {
        listingId,
      },
    });

    return {
      message: 'Annonce retirée des favoris.',
      isFavorite: false,
      favoriteCount,
    };
  }

  async getStatus(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id: listingId,
        status: 'PUBLISHED',
        deletedAt: null,
      },
      select: {
        id: true,
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException(
        'Cette annonce est introuvable ou indisponible.',
      );
    }

    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
      select: {
        id: true,
      },
    });

    return {
      isFavorite: Boolean(favorite),
      favoriteCount: listing._count.favorites,
    };
  }

  async findMine(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: {
        userId,

        listing: {
          status: 'PUBLISHED',
          deletedAt: null,

          user: {
            deletedAt: null,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },

      include: {
        listing: {
          include: {
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
            },

            user: {
              select: {
                profile: {
                  select: {
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                    isVerified: true,
                  },
                },
              },
            },

            _count: {
              select: {
                favorites: true,
              },
            },
          },
        },
      },
    });

    return favorites.map((favorite) => ({
      id: favorite.id,
      createdAt: favorite.createdAt,

      listing: {
        ...favorite.listing,

        favoriteCount: favorite.listing._count.favorites,

        profile: favorite.listing.user.profile,
      },
    }));
  }
}
