import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { CreateStoryDto } from './dto/create-story.dto';
import { StoriesService } from './stories.service';

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

@Controller('stories')
export class StoriesController {
  constructor(
    private readonly storiesService: StoriesService,
    private readonly storageService: StorageService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
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
    @UploadedFile() file?: Express.Multer.File,
    @Body() createStoryDto?: CreateStoryDto,
  ) {
    if (!file) {
      throw new BadRequestException('Aucune image valide n’a été envoyée.');
    }

    const user = request.user as AuthenticatedUser;
    const storedFile = await this.storageService.save(file, 'stories');

    try {
      return await this.storiesService.create(
        user.id,
        storedFile,
        createStoryDto,
      );
    } catch (error) {
      await this.storageService.delete(storedFile.url);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMine(@Req() request: Request) {
    const user = request.user as AuthenticatedUser;

    return this.storiesService.findMine(user.id);
  }

  @Get('public')
  findPublicStories() {
    return this.storiesService.findPublicStories();
  }

  @Get('public/:username')
  findPublic(@Param('username') username: string) {
    return this.storiesService.findPublicByUsername(username);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':storyId')
  remove(@Req() request: Request, @Param('storyId') storyId: string) {
    const user = request.user as AuthenticatedUser;

    return this.storiesService.remove(user.id, storyId);
  }
}
