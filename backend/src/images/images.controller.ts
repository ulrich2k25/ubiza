import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Req,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateImageDto } from './dto/create-image.dto';
import { ImagesService } from './images.service';

type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
};

@Controller('listings')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':listingId/images')
  create(
    @Req() request: Request,
    @Param('listingId') listingId: string,
    @Body() createImageDto: CreateImageDto,
  ) {
    const user = request.user as AuthenticatedUser;

    return this.imagesService.create(user.id, listingId, createImageDto);
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
  @Delete(':listingId/images/:imageId')
  remove(
    @Req() request: Request,
    @Param('listingId') listingId: string,
    @Param('imageId') imageId: string,
  ) {
    const user = request.user as AuthenticatedUser;

    return this.imagesService.remove(user.id, listingId, imageId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':listingId/images/:imageId/blur')
  toggleBlur(
    @Req() request: Request,
    @Param('listingId') listingId: string,
    @Param('imageId') imageId: string,
    @Query('enabled') enabled: string,
  ) {
    const user = request.user as AuthenticatedUser;

    return this.imagesService.toggleBlur(
      user.id,
      listingId,
      imageId,
      enabled === 'true',
    );
  }
}
