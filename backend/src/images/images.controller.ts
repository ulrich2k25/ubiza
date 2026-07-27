import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import type { Request } from 'express';

import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from '../storage/storage.service';
import { BlurImageDto } from './dto/blur-image.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import { ImagesService } from './images.service';

type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
};

function imageFileFilter(
  request: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  const acceptedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!acceptedMimeTypes.includes(file.mimetype)) {
    callback(
      new BadRequestException(
        'Seules les images JPG, PNG et WEBP sont autorisées.',
      ),
      false,
    );

    return;
  }

  callback(null, true);
}

@Controller('listings')
export class ImagesController {
  constructor(
    private readonly imagesService: ImagesService,
    private readonly storageService: StorageService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post(':listingId/images')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async create(
    @Req() request: Request,
    @Param('listingId') listingId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Aucune image valide n’a été envoyée.');
    }

    const user = request.user as AuthenticatedUser;
    const storedFile = await this.storageService.save(file, 'listings');

    try {
      return await this.imagesService.create(user.id, listingId, {
        url: storedFile.url,
        publicId: storedFile.publicId,
        faceBlurRequested: false,
      });
    } catch (error) {
      await this.storageService.delete(storedFile.url);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':listingId/images/reorder')
  reorder(
    @Req() request: Request,
    @Param('listingId') listingId: string,
    @Body() reorderImagesDto: ReorderImagesDto,
  ) {
    const user = request.user as AuthenticatedUser;

    return this.imagesService.reorder(
      user.id,
      listingId,
      reorderImagesDto.imageIds,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':listingId/images/:imageId/primary')
  setPrimary(
    @Req() request: Request,
    @Param('listingId') listingId: string,
    @Param('imageId') imageId: string,
  ) {
    const user = request.user as AuthenticatedUser;

    return this.imagesService.setPrimary(user.id, listingId, imageId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':listingId/images/:imageId/blur')
  blur(
    @Req() request: Request,
    @Param('listingId') listingId: string,
    @Param('imageId') imageId: string,
    @Body() blurImageDto: BlurImageDto,
  ) {
    const user = request.user as AuthenticatedUser;

    return this.imagesService.blurImage(
      user.id,
      listingId,
      imageId,
      blurImageDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':listingId/images/:imageId/unblur')
  unblur(
    @Req() request: Request,
    @Param('listingId') listingId: string,
    @Param('imageId') imageId: string,
  ) {
    const user = request.user as AuthenticatedUser;

    return this.imagesService.unblurImage(user.id, listingId, imageId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':listingId/images/:imageId')
  remove(
    @Req() request: Request,
    @Param('listingId') listingId: string,
    @Param('imageId') imageId: string,
  ) {
    const user = request.user as AuthenticatedUser;

    return this.imagesService.remove(user.id, listingId, imageId);
  }
}
