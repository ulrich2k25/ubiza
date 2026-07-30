import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { VisibilityService } from '../visibility/visibility.service';
import { UpdateProfileContactDto } from './dto/update-profile-contact.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibilityService: VisibilityService,
  ) {}

  /**
   * Recalcule le badge Vérifié d’un profil.
   *
   * Conditions :
   * - adresse e-mail vérifiée ;
   * - au moins un moyen de contact renseigné ;
   * - au moins une annonce publiée.
   */
  async refreshVerificationStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        emailVerifiedAt: true,

        profile: {
          select: {
            id: true,
            phone: true,
            whatsapp: true,
            telegram: true,
          },
        },

        listings: {
          where: {
            status: 'PUBLISHED',
            deletedAt: null,
          },

          select: {
            id: true,
          },

          take: 1,
        },
      },
    });

    if (!user?.profile) {
      return;
    }

    const hasVerifiedEmail = Boolean(user.emailVerifiedAt);

    const hasContact = Boolean(
      user.profile.phone?.trim() ||
      user.profile.whatsapp?.trim() ||
      user.profile.telegram?.trim(),
    );

    const hasPublishedListing = user.listings.length > 0;

    const isVerified = hasVerifiedEmail && hasContact && hasPublishedListing;

    await this.prisma.profile.update({
      where: {
        id: user.profile.id,
      },

      data: {
        isVerified,
        verifiedAt: isVerified ? new Date() : null,
      },
    });
  }

  /**
   * Homepage publique Ubiza.
   *
   * Ordre :
   * 1. Boost actif
   * 2. Premium actif
   * 3. Profil vérifié
   * 4. Disponible maintenant
   * 5. Publication récente
   * 6. Nombre de vues
   */
  async findPublicProfiles() {
    const now = new Date();

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
        user: {
          select: {
            premiumActiveUntil: true,

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
                city: {
                  select: {
                    id: true,
                    name: true,
                  },
                },

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
    });

    const sortedProfiles = this.visibilityService.sortByVisibility(
      profiles,
      (profile) => {
        const listing = profile.user.listings[0];

        return {
          boostActiveUntil: listing?.boostActiveUntil,
          premiumActiveUntil: profile.user.premiumActiveUntil,
          isVerified: profile.isVerified,
          availableNow: listing?.availableNow,
          publishedAt: listing?.publishedAt,
          viewCount: listing?.viewCount,
        };
      },
    );

    return sortedProfiles.slice(0, 20).map((profile) => {
      const listing = profile.user.listings[0];

      const visibility = this.visibilityService.getVisibilityStatus(
        {
          boostActiveUntil: listing?.boostActiveUntil,
          premiumActiveUntil: profile.user.premiumActiveUntil,
          isVerified: profile.isVerified,
          availableNow: listing?.availableNow,
          publishedAt: listing?.publishedAt,
          viewCount: listing?.viewCount,
        },
        now,
      );

      return {
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        city: listing?.city ?? null,
        description: profile.description,

        isVerified: visibility.isVerified,
        isPremium: visibility.isPremium,
        isBoosted: visibility.isBoosted,
        visibilityPriority: visibility.visibilityPriority,

        createdAt: profile.createdAt,

        listing: listing
          ? {
              id: listing.id,
              title: listing.title,
              age: listing.age,
              availableNow: listing.availableNow,
              viewCount: listing.viewCount,
              publishedAt: listing.publishedAt,
              boostActiveUntil: listing.boostActiveUntil,
              isBoosted: visibility.isBoosted,
              primaryImage: listing.images[0]?.url ?? null,
            }
          : null,
      };
    });
  }

  /**
   * Page publique détaillée d’une créatrice.
   *
   * Les coordonnées ne sont jamais retournées par cette méthode.
   */
  async findPublicProfile(username: string, visitorKey: string) {
    const now = new Date();

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
            premiumActiveUntil: true,

            listings: {
              where: {
                status: 'PUBLISHED',
                deletedAt: null,
              },

              orderBy: {
                createdAt: 'desc',
              },

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

                _count: {
                  select: {
                    favorites: true,
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

    const listing = profile.user.listings[0];

    if (listing) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      const previousView = await this.prisma.listingView.findFirst({
        where: {
          listingId: listing.id,
          visitorKey,
        },

        orderBy: {
          viewedAt: 'desc',
        },
      });

      const canCountView =
        !previousView || previousView.viewedAt < tenMinutesAgo;

      if (canCountView) {
        await this.prisma.$transaction([
          previousView
            ? this.prisma.listingView.update({
                where: {
                  id: previousView.id,
                },

                data: {
                  viewedAt: new Date(),
                },
              })
            : this.prisma.listingView.create({
                data: {
                  listingId: listing.id,
                  visitorKey,
                },
              }),

          this.prisma.listing.update({
            where: {
              id: listing.id,
            },

            data: {
              viewCount: {
                increment: 1,
              },
            },
          }),
        ]);

        listing.viewCount += 1;
      }
    }

    const visibility = this.visibilityService.getVisibilityStatus(
      {
        boostActiveUntil: listing?.boostActiveUntil,
        premiumActiveUntil: profile.user.premiumActiveUntil,
        isVerified: profile.isVerified,
        availableNow: listing?.availableNow,
        publishedAt: listing?.publishedAt,
        viewCount: listing?.viewCount,
      },
      now,
    );

    return {
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      description: profile.description,
      createdAt: profile.createdAt,

      isVerified: visibility.isVerified,
      isPremium: visibility.isPremium,
      isBoosted: visibility.isBoosted,
      visibilityPriority: visibility.visibilityPriority,

      premiumActiveUntil: profile.user.premiumActiveUntil,

      city: listing?.city ?? profile.city,

      listings: profile.user.listings.map((currentListing) => {
        const currentVisibility = this.visibilityService.getVisibilityStatus(
          {
            boostActiveUntil: currentListing.boostActiveUntil,
            premiumActiveUntil: profile.user.premiumActiveUntil,
            isVerified: profile.isVerified,
            availableNow: currentListing.availableNow,
            publishedAt: currentListing.publishedAt,
            viewCount: currentListing.viewCount,
          },
          now,
        );

        return {
          ...currentListing,
          favoriteCount: currentListing._count.favorites,
          isBoosted: currentVisibility.isBoosted,
          isPremium: currentVisibility.isPremium,
          visibilityPriority: currentVisibility.visibilityPriority,
        };
      }),
    };
  }

  /**
   * Suggestions de profils similaires.
   *
   * Retourne jusqu’à quatre profils en excluant
   * le profil actuellement consulté.
   */
  async findSuggestions(username: string) {
    const now = new Date();

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
            premiumActiveUntil: true,

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
                city: {
                  select: {
                    id: true,
                    name: true,
                  },
                },

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
    });

    const sortedProfiles = this.visibilityService.sortByVisibility(
      profiles,
      (profile) => {
        const listing = profile.user.listings[0];

        return {
          boostActiveUntil: listing?.boostActiveUntil,
          premiumActiveUntil: profile.user.premiumActiveUntil,
          isVerified: profile.isVerified,
          availableNow: listing?.availableNow,
          publishedAt: listing?.publishedAt,
          viewCount: listing?.viewCount,
        };
      },
    );

    return sortedProfiles.slice(0, 4).map((profile) => {
      const listing = profile.user.listings[0];

      const visibility = this.visibilityService.getVisibilityStatus(
        {
          boostActiveUntil: listing?.boostActiveUntil,
          premiumActiveUntil: profile.user.premiumActiveUntil,
          isVerified: profile.isVerified,
          availableNow: listing?.availableNow,
          publishedAt: listing?.publishedAt,
          viewCount: listing?.viewCount,
        },
        now,
      );

      return {
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,

        isVerified: visibility.isVerified,
        isPremium: visibility.isPremium,
        isBoosted: visibility.isBoosted,
        visibilityPriority: visibility.visibilityPriority,

        city: listing?.city ?? profile.city,

        listing: listing
          ? {
              id: listing.id,
              title: listing.title,
              age: listing.age,
              availableNow: listing.availableNow,
              viewCount: listing.viewCount,
              publishedAt: listing.publishedAt,
              boostActiveUntil: listing.boostActiveUntil,
              isBoosted: visibility.isBoosted,
              primaryImage: listing.images[0]?.url ?? null,
            }
          : null,
      };
    });
  }

  /**
   * Coordonnées protégées d’une créatrice.
   *
   * Cette méthode est appelée uniquement par une route
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
   * Recherche publique visiteur.
   *
   * Exemple :
   * /profiles/search?q=douala
   */
  async searchProfiles(query: string) {
    const search = query?.trim();

    if (!search) {
      return [];
    }

    const now = new Date();

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
            user: {
              listings: {
                some: {
                  status: 'PUBLISHED',
                  deletedAt: null,

                  city: {
                    name: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                },
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
            premiumActiveUntil: true,

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
                city: {
                  select: {
                    id: true,
                    name: true,
                  },
                },

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
    });

    const sortedProfiles = this.visibilityService.sortByVisibility(
      profiles,
      (profile) => {
        const listing = profile.user.listings[0];

        return {
          boostActiveUntil: listing?.boostActiveUntil,
          premiumActiveUntil: profile.user.premiumActiveUntil,
          isVerified: profile.isVerified,
          availableNow: listing?.availableNow,
          publishedAt: listing?.publishedAt,
          viewCount: listing?.viewCount,
        };
      },
    );

    return sortedProfiles.slice(0, 20).map((profile) => {
      const listing = profile.user.listings[0];

      const visibility = this.visibilityService.getVisibilityStatus(
        {
          boostActiveUntil: listing?.boostActiveUntil,
          premiumActiveUntil: profile.user.premiumActiveUntil,
          isVerified: profile.isVerified,
          availableNow: listing?.availableNow,
          publishedAt: listing?.publishedAt,
          viewCount: listing?.viewCount,
        },
        now,
      );

      return {
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,

        isVerified: visibility.isVerified,
        isPremium: visibility.isPremium,
        isBoosted: visibility.isBoosted,
        visibilityPriority: visibility.visibilityPriority,

        city: listing?.city ?? profile.city,

        listing: listing
          ? {
              id: listing.id,
              title: listing.title,
              age: listing.age,
              availableNow: listing.availableNow,
              viewCount: listing.viewCount,
              publishedAt: listing.publishedAt,
              boostActiveUntil: listing.boostActiveUntil,
              isBoosted: visibility.isBoosted,
              primaryImage: listing.images[0]?.url ?? null,
            }
          : null,
      };
    });
  }

  /**
   * Met à jour les coordonnées du profil
   * de l’utilisateur connecté.
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

    const updatedProfile = await this.prisma.profile.update({
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

    await this.refreshVerificationStatus(userId);

    return updatedProfile;
  }
}
