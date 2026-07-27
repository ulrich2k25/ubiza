import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileContactDto } from './dto/update-profile-contact.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Homepage publique Ubiza
   */
  async findPublicProfiles() {
    const profiles = await this.prisma.profile.findMany({
      where: {
        user: {
          deletedAt: null,

          listings: {
            some: {
              status: 'PUBLISHED',
              deletedAt: null,
            },
          },
        },
      },

      include: {
        city: {
          select: {
            id: true,
            name: true,
          },
        },

        user: {
          select: {
            listings: {
              where: {
                status: 'PUBLISHED',
                deletedAt: null,
              },

              orderBy: {
                createdAt: 'desc',
              },

              take: 1,

              include: {
                images: {
                  orderBy: [
                    {
                      isPrimary: 'desc',
                    },
                    {
                      position: 'asc',
                    },
                  ],

                  take: 1,
                },
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },

      take: 20,
    });

    return profiles.map((profile) => {
      const listing = profile.user.listings[0];

      return {
        username: profile.username,

        displayName: profile.displayName,

        avatarUrl: profile.avatarUrl,

        city: profile.city,

        description: profile.description,

        listing: listing
          ? {
              id: listing.id,

              title: listing.title,

              age: listing.age,

              availableNow: listing.availableNow,

              viewCount: listing.viewCount,

              primaryImage: listing.images[0]?.url ?? null,
            }
          : null,
      };
    });
  }

  /**
   * Page publique détaillée d'une créatrice.
   *
   * Important :
   * les coordonnées ne sont jamais retournées par cette méthode.
   */
  async findPublicProfile(username: string) {
    const profile = await this.prisma.profile.findFirst({
      where: {
        username,

        user: {
          deletedAt: null,
        },
      },

      include: {
        city: {
          select: {
            id: true,
            name: true,
          },
        },

        user: {
          select: {
            id: true,

            role: true,

            status: true,

            listings: {
              where: {
                status: 'PUBLISHED',
                deletedAt: null,
              },

              include: {
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
              },
            },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Profil introuvable.');
    }

    return {
      username: profile.username,

      displayName: profile.displayName,

      avatarUrl: profile.avatarUrl,

      description: profile.description,

      city: profile.city,

      listings: profile.user.listings,
    };
  }

  /**
   * Suggestions de profils similaires.
   *
   * Retourne jusqu'à 4 créatrices en excluant
   * le profil actuellement consulté.
   */
  async findSuggestions(username: string) {
    const profiles = await this.prisma.profile.findMany({
      where: {
        username: {
          not: username,
        },

        user: {
          deletedAt: null,

          listings: {
            some: {
              status: 'PUBLISHED',
              deletedAt: null,
            },
          },
        },
      },

      include: {
        city: {
          select: {
            id: true,
            name: true,
          },
        },

        user: {
          select: {
            listings: {
              where: {
                status: 'PUBLISHED',
                deletedAt: null,
              },

              orderBy: {
                createdAt: 'desc',
              },

              take: 1,

              include: {
                images: {
                  orderBy: [
                    {
                      isPrimary: 'desc',
                    },
                    {
                      position: 'asc',
                    },
                  ],

                  take: 1,
                },
              },
            },
          },
        },
      },

      take: 4,
    });

    return profiles.map((profile) => {
      const listing = profile.user.listings[0];

      return {
        username: profile.username,

        displayName: profile.displayName,

        avatarUrl: profile.avatarUrl,

        city: profile.city,

        listing: listing
          ? {
              id: listing.id,

              title: listing.title,

              age: listing.age,

              availableNow: listing.availableNow,

              primaryImage: listing.images[0]?.url ?? null,
            }
          : null,
      };
    });
  }

  /**
   * Coordonnées protégées d'une créatrice.
   *
   * Cette méthode sera appelée uniquement par une route
   * protégée avec le guard JWT.
   */
  async findProfileContact(username: string) {
    const profile = await this.prisma.profile.findFirst({
      where: {
        username,

        user: {
          deletedAt: null,

          listings: {
            some: {
              status: 'PUBLISHED',
              deletedAt: null,
            },
          },
        },
      },

      select: {
        phone: true,

        whatsapp: true,

        telegram: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profil introuvable.');
    }

    return {
      phone: profile.phone,

      whatsapp: profile.whatsapp,

      telegram: profile.telegram,
    };
  }

  /**
   * Recherche publique visiteur
   *
   * Exemple :
   * /profiles/search?q=douala
   */
  async searchProfiles(query: string) {
    const search = query?.trim();

    if (!search) {
      return [];
    }

    const profiles = await this.prisma.profile.findMany({
      where: {
        user: {
          deletedAt: null,

          listings: {
            some: {
              status: 'PUBLISHED',
              deletedAt: null,
            },
          },
        },

        OR: [
          {
            username: {
              contains: search,
              mode: 'insensitive',
            },
          },

          {
            displayName: {
              contains: search,
              mode: 'insensitive',
            },
          },

          {
            city: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        ],
      },

      include: {
        city: {
          select: {
            id: true,
            name: true,
          },
        },

        user: {
          select: {
            listings: {
              where: {
                status: 'PUBLISHED',
                deletedAt: null,
              },

              orderBy: {
                createdAt: 'desc',
              },

              take: 1,

              include: {
                images: {
                  orderBy: [
                    {
                      isPrimary: 'desc',
                    },
                    {
                      position: 'asc',
                    },
                  ],

                  take: 1,
                },
              },
            },
          },
        },
      },

      take: 20,
    });

    return profiles.map((profile) => {
      const listing = profile.user.listings[0];

      return {
        username: profile.username,

        displayName: profile.displayName,

        avatarUrl: profile.avatarUrl,

        city: profile.city,

        listing: listing
          ? {
              id: listing.id,

              title: listing.title,

              age: listing.age,

              availableNow: listing.availableNow,

              viewCount: listing.viewCount,

              primaryImage: listing.images[0]?.url ?? null,
            }
          : null,
      };
    });
  }

  /**
   * Met à jour les coordonnées du profil de l'utilisateur connecté.
   */
  async updateMyContact(
    userId: string,
    updateProfileContactDto: UpdateProfileContactDto,
  ) {
    const profile = await this.prisma.profile.findFirst({
      where: {
        userId,

        user: {
          deletedAt: null,
        },
      },

      select: {
        id: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profil introuvable.');
    }

    const normalizeContact = (value: string | null | undefined) => {
      if (value === undefined) {
        return undefined;
      }

      const normalizedValue = value?.trim();

      return normalizedValue ? normalizedValue : null;
    };

    return this.prisma.profile.update({
      where: {
        id: profile.id,
      },

      data: {
        phone: normalizeContact(updateProfileContactDto.phone),

        whatsapp: normalizeContact(updateProfileContactDto.whatsapp),

        telegram: normalizeContact(updateProfileContactDto.telegram),
      },

      select: {
        phone: true,

        whatsapp: true,

        telegram: true,
      },
    });
  }
}
