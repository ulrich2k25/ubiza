import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class ListingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileService: ProfileService,
  ) {}

  async findMine(userId: string) {
    const listing = await this.prisma.listing.findFirst({
      where: {
        userId,
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
        city: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Vous ne possédez aucune annonce active.');
    }

    return listing;
  }

  async create(userId: string, createListingDto: CreateListingDto) {
    const existingListing = await this.prisma.listing.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (existingListing) {
      throw new ConflictException(
        'Vous possédez déjà une annonce. Modifiez votre annonce existante.',
      );
    }

    const category = await this.prisma.category.findFirst({
      where: {
        id: createListingDto.categoryId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      throw new NotFoundException(
        'La catégorie sélectionnée est introuvable ou inactive.',
      );
    }

    const city = await this.prisma.city.findFirst({
      where: {
        id: createListingDto.cityId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!city) {
      throw new NotFoundException(
        'La ville sélectionnée est introuvable ou inactive.',
      );
    }

    return this.prisma.listing.create({
      data: {
        userId,
        categoryId: createListingDto.categoryId,
        cityId: createListingDto.cityId,

        title: createListingDto.title.trim(),
        description: createListingDto.description.trim(),
        age: createListingDto.age,

        availableNow: createListingDto.availableNow ?? false,

        allowPhone: createListingDto.allowPhone ?? true,
        allowWhatsapp: createListingDto.allowWhatsapp ?? true,
        allowTelegram: createListingDto.allowTelegram ?? true,
        allowInstagram: createListingDto.allowInstagram ?? true,

        automaticFaceBlur: createListingDto.automaticFaceBlur ?? false,

        status: 'DRAFT',
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        city: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });
  }

  async publish(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id: listingId,
        userId,
        deletedAt: null,
      },
    });

    if (!listing) {
      throw new NotFoundException(
        'Annonce introuvable ou vous n’êtes pas le propriétaire.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        referredById: true,
        referralRewardGrantedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    const isFirstPublication = listing.publishedAt === null;

    const shouldRewardReferrer =
      isFirstPublication &&
      user.referredById !== null &&
      user.referralRewardGrantedAt === null;

    const publishedAt = listing.publishedAt ?? new Date();

    const result = await this.prisma.$transaction(async (transaction) => {
      const publishedListing = await transaction.listing.update({
        where: {
          id: listingId,
        },
        data: {
          status: 'PUBLISHED',
          publishedAt,
          pausedAt: null,
        },
      });

      if (shouldRewardReferrer && user.referredById) {
        await transaction.user.update({
          where: {
            id: user.referredById,
          },
          data: {
            boostCredits: {
              increment: 1,
            },
          },
        });

        await transaction.user.update({
          where: {
            id: userId,
          },
          data: {
            referralRewardGrantedAt: new Date(),
          },
        });
      }

      return {
        ...publishedListing,
        referralRewardGranted: shouldRewardReferrer,
      };
    });

    await this.profileService.refreshVerificationStatus(userId);

    return result;
  }

  async pause(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id: listingId,
        userId,
        deletedAt: null,
      },
    });

    if (!listing) {
      throw new NotFoundException(
        'Annonce introuvable ou vous n’êtes pas le propriétaire.',
      );
    }

    if (listing.status !== 'PUBLISHED') {
      throw new ConflictException(
        'Seule une annonce publiée peut être mise en pause.',
      );
    }

    return this.prisma.listing.update({
      where: {
        id: listingId,
      },
      data: {
        status: 'PAUSED',
        pausedAt: new Date(),
      },
    });
  }

  async resume(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id: listingId,
        userId,
        deletedAt: null,
      },
    });

    if (!listing) {
      throw new NotFoundException(
        'Annonce introuvable ou vous n’êtes pas le propriétaire.',
      );
    }

    if (listing.status !== 'PAUSED') {
      throw new ConflictException(
        'Seule une annonce en pause peut être remise en ligne.',
      );
    }

    return this.prisma.listing.update({
      where: {
        id: listingId,
      },
      data: {
        status: 'PUBLISHED',
        pausedAt: null,
        publishedAt: listing.publishedAt ?? new Date(),
      },
    });
  }

  async remove(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id: listingId,
        userId,
        deletedAt: null,
      },
    });

    if (!listing) {
      throw new NotFoundException(
        'Annonce introuvable ou vous n’êtes pas le propriétaire.',
      );
    }

    return this.prisma.listing.update({
      where: {
        id: listingId,
      },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
        pausedAt: null,
      },
    });
  }

  async update(
    userId: string,
    listingId: string,
    updateListingDto: UpdateListingDto,
  ) {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id: listingId,
        userId,
        deletedAt: null,
      },
    });

    if (!listing) {
      throw new NotFoundException(
        'Annonce introuvable ou vous n’êtes pas le propriétaire.',
      );
    }

    if (updateListingDto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: updateListingDto.categoryId,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      if (!category) {
        throw new NotFoundException(
          'La catégorie sélectionnée est introuvable ou inactive.',
        );
      }
    }

    if (updateListingDto.cityId) {
      const city = await this.prisma.city.findFirst({
        where: {
          id: updateListingDto.cityId,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      if (!city) {
        throw new NotFoundException(
          'La ville sélectionnée est introuvable ou inactive.',
        );
      }
    }

    return this.prisma.listing.update({
      where: {
        id: listingId,
      },
      data: {
        ...updateListingDto,

        title:
          updateListingDto.title !== undefined
            ? updateListingDto.title.trim()
            : undefined,

        description:
          updateListingDto.description !== undefined
            ? updateListingDto.description.trim()
            : undefined,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        city: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });
  }
}
