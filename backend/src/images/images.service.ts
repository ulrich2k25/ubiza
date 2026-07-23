import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateImageDto } from './dto/create-image.dto';

@Injectable()
export class ImagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    listingId: string,
    createImageDto: CreateImageDto,
  ) {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id: listingId,
        userId,
        deletedAt: null,
      },
      include: {
        images: true,
      },
    });

    if (!listing) {
      throw new NotFoundException(
        'Annonce introuvable ou vous n’êtes pas le propriétaire.',
      );
    }

    const isFirstImage = listing.images.length === 0;

    const nextPosition = listing.images.length;

    return this.prisma.listingImage.create({
      data: {
        listingId,

        url: createImageDto.url,

        publicId: createImageDto.publicId,

        position: nextPosition,

        isPrimary: isFirstImage,

        faceBlurRequested: createImageDto.faceBlurRequested ?? false,

        faceBlurApplied: false,
      },
    });
  }

  async setPrimary(userId: string, listingId: string, imageId: string) {
    const image = await this.prisma.listingImage.findFirst({
      where: {
        id: imageId,
        listingId,
        listing: {
          userId,
          deletedAt: null,
        },
      },
    });

    if (!image) {
      throw new NotFoundException(
        'Image introuvable ou vous n’êtes pas le propriétaire.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.listingImage.updateMany({
        where: {
          listingId,
        },
        data: {
          isPrimary: false,
        },
      }),

      this.prisma.listingImage.update({
        where: {
          id: imageId,
        },
        data: {
          isPrimary: true,
        },
      }),
    ]);

    return this.prisma.listingImage.findUnique({
      where: {
        id: imageId,
      },
    });
  }

  async remove(userId: string, listingId: string, imageId: string) {
    const image = await this.prisma.listingImage.findFirst({
      where: {
        id: imageId,
        listingId,
        listing: {
          userId,
          deletedAt: null,
        },
      },
    });

    if (!image) {
      throw new NotFoundException(
        'Image introuvable ou vous n’êtes pas le propriétaire.',
      );
    }

    await this.prisma.listingImage.delete({
      where: {
        id: imageId,
      },
    });

    if (image.isPrimary) {
      const nextImage = await this.prisma.listingImage.findFirst({
        where: {
          listingId,
        },
        orderBy: {
          position: 'asc',
        },
      });

      if (nextImage) {
        await this.prisma.listingImage.update({
          where: {
            id: nextImage.id,
          },
          data: {
            isPrimary: true,
          },
        });
      }
    }

    return {
      message: 'Image supprimée avec succès.',
    };
  }

  async toggleBlur(
    userId: string,
    listingId: string,
    imageId: string,
    enabled: boolean,
  ) {
    const image = await this.prisma.listingImage.findFirst({
      where: {
        id: imageId,
        listingId,
        listing: {
          userId,
          deletedAt: null,
        },
      },
    });

    if (!image) {
      throw new NotFoundException(
        'Image introuvable ou vous n’êtes pas le propriétaire.',
      );
    }

    return this.prisma.listingImage.update({
      where: {
        id: imageId,
      },
      data: {
        faceBlurRequested: enabled,
        faceBlurApplied: false,
      },
    });
  }
}
