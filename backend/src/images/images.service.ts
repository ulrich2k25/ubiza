import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { promises as fs } from 'fs';
import { basename, extname, join } from 'path';
import sharp from 'sharp';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { BlurImageDto } from './dto/blur-image.dto';
import { CreateImageDto } from './dto/create-image.dto';

@Injectable()
export class ImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

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

  async reorder(userId: string, listingId: string, imageIds: string[]) {
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

    const uniqueImageIds = new Set(imageIds);

    if (uniqueImageIds.size !== imageIds.length) {
      throw new BadRequestException(
        'La liste contient des identifiants d’images en double.',
      );
    }

    const existingImageIds = new Set(listing.images.map((image) => image.id));

    const containsInvalidImage = imageIds.some(
      (imageId) => !existingImageIds.has(imageId),
    );

    if (containsInvalidImage || imageIds.length !== listing.images.length) {
      throw new BadRequestException(
        'La liste des images ne correspond pas aux images de cette annonce.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.listingImage.updateMany({
        where: {
          listingId,
        },
        data: {
          position: {
            decrement: listing.images.length + 10,
          },
        },
      });

      await Promise.all(
        imageIds.map((imageId, position) =>
          tx.listingImage.update({
            where: {
              id: imageId,
            },
            data: {
              position,
            },
          }),
        ),
      );
    });

    return this.prisma.listingImage.findMany({
      where: {
        listingId,
      },
      orderBy: {
        position: 'asc',
      },
    });
  }

  async setPrimary(userId: string, listingId: string, imageId: string) {
    const image = await this.findOwnedImage(userId, listingId, imageId);

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
          id: image.id,
        },
        data: {
          isPrimary: true,
        },
      }),
    ]);

    return this.prisma.listingImage.findUnique({
      where: {
        id: image.id,
      },
    });
  }

  async blurImage(
    userId: string,
    listingId: string,
    imageId: string,
    blurImageDto: BlurImageDto,
  ) {
    const image = await this.findOwnedImage(userId, listingId, imageId);

    const currentImagePath = this.urlToFilePath(image.url);

    await this.ensureFileExists(
      currentImagePath,
      'Le fichier de cette image est introuvable.',
    );

    let originalUrl = image.originalUrl;
    let originalImagePath: string;

    if (originalUrl) {
      originalImagePath = this.urlToFilePath(originalUrl);

      await this.ensureFileExists(
        originalImagePath,
        'Le fichier original de cette image est introuvable.',
      );
    } else {
      if (!image.publicId) {
        throw new BadRequestException(
          'Cette image ne possède pas de nom de fichier valide.',
        );
      }

      const extension = extname(image.publicId);
      const filenameWithoutExtension = basename(image.publicId, extension);
      const originalFilename = `${filenameWithoutExtension}-original${extension}`;

      originalUrl = `/uploads/listings/${originalFilename}`;
      originalImagePath = this.urlToFilePath(originalUrl);

      await fs.copyFile(currentImagePath, originalImagePath);
    }

    const metadata = await sharp(originalImagePath).metadata();

    if (!metadata.width || !metadata.height) {
      throw new BadRequestException(
        'Les dimensions de cette image sont invalides.',
      );
    }

    const imageWidth = metadata.width;
    const imageHeight = metadata.height;

    const horizontalPadding = blurImageDto.width * 0.15;
    const verticalPadding = blurImageDto.height * 0.2;

    const normalizedLeft = Math.max(0, blurImageDto.x - horizontalPadding);
    const normalizedTop = Math.max(0, blurImageDto.y - verticalPadding);

    const normalizedRight = Math.min(
      1,
      blurImageDto.x + blurImageDto.width + horizontalPadding,
    );

    const normalizedBottom = Math.min(
      1,
      blurImageDto.y + blurImageDto.height + verticalPadding,
    );

    const left = Math.max(0, Math.floor(normalizedLeft * imageWidth));
    const top = Math.max(0, Math.floor(normalizedTop * imageHeight));

    const right = Math.min(imageWidth, Math.ceil(normalizedRight * imageWidth));

    const bottom = Math.min(
      imageHeight,
      Math.ceil(normalizedBottom * imageHeight),
    );

    const width = right - left;
    const height = bottom - top;

    if (width <= 0 || height <= 0) {
      throw new BadRequestException('La zone du visage détectée est invalide.');
    }

    const blurredFaceBuffer = await sharp(originalImagePath)
      .extract({
        left,
        top,
        width,
        height,
      })
      .blur(35)
      .toBuffer();

    const temporaryPath = `${currentImagePath}.processing`;

    try {
      await sharp(originalImagePath)
        .composite([
          {
            input: blurredFaceBuffer,
            left,
            top,
          },
        ])
        .toFile(temporaryPath);

      await fs.copyFile(temporaryPath, currentImagePath);
    } finally {
      await fs.unlink(temporaryPath).catch(() => undefined);
    }

    return this.prisma.listingImage.update({
      where: {
        id: image.id,
      },
      data: {
        originalUrl,
        faceBlurRequested: true,
        faceBlurApplied: true,
      },
    });
  }

  async unblurImage(userId: string, listingId: string, imageId: string) {
    const image = await this.findOwnedImage(userId, listingId, imageId);

    if (!image.originalUrl) {
      throw new BadRequestException(
        'Aucune version originale n’est disponible pour cette image.',
      );
    }

    const originalImagePath = this.urlToFilePath(image.originalUrl);
    const currentImagePath = this.urlToFilePath(image.url);

    await this.ensureFileExists(
      originalImagePath,
      'Le fichier original de cette image est introuvable.',
    );

    await fs.copyFile(originalImagePath, currentImagePath);

    return this.prisma.listingImage.update({
      where: {
        id: image.id,
      },
      data: {
        faceBlurRequested: false,
        faceBlurApplied: false,
      },
    });
  }

  async remove(userId: string, listingId: string, imageId: string) {
    const image = await this.findOwnedImage(userId, listingId, imageId);

    await this.prisma.listingImage.delete({
      where: {
        id: image.id,
      },
    });

    await Promise.all([
      this.storageService.delete(image.url),
      image.originalUrl
        ? this.storageService.delete(image.originalUrl)
        : Promise.resolve(),
    ]);

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

  private async findOwnedImage(
    userId: string,
    listingId: string,
    imageId: string,
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

    return image;
  }

  private urlToFilePath(imageUrl: string): string {
    const relativePath = imageUrl.replace(/^[/\\]+/, '');

    return join(process.cwd(), relativePath);
  }

  private async ensureFileExists(
    filePath: string,
    errorMessage: string,
  ): Promise<void> {
    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException(errorMessage);
    }
  }
}
