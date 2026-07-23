import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListingService } from './listing.service';
import { UpdateListingDto } from './dto/update-listing.dto';

type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
};

@Controller('listings')
@UseGuards(JwtAuthGuard)
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  @Post()
  create(@Req() request: Request, @Body() createListingDto: CreateListingDto) {
    const user = request.user as AuthenticatedUser;

    return this.listingService.create(user.id, createListingDto);
  }

  @Patch(':id/publish')
  publish(@Req() request: Request, @Param('id') listingId: string) {
    const user = request.user as AuthenticatedUser;

    return this.listingService.publish(user.id, listingId);
  }

  @Patch(':id/pause')
  pause(@Req() request: Request, @Param('id') listingId: string) {
    const user = request.user as AuthenticatedUser;

    return this.listingService.pause(user.id, listingId);
  }

  @Patch(':id/resume')
  resume(@Req() request: Request, @Param('id') listingId: string) {
    const user = request.user as AuthenticatedUser;

    return this.listingService.resume(user.id, listingId);
  }

  @Delete(':id')
  remove(@Req() request: Request, @Param('id') listingId: string) {
    const user = request.user as AuthenticatedUser;

    return this.listingService.remove(user.id, listingId);
  }

  @Patch(':id')
  update(
    @Req() request: Request,
    @Param('id') listingId: string,
    @Body() updateListingDto: UpdateListingDto,
  ) {
    const user = request.user as AuthenticatedUser;

    return this.listingService.update(user.id, listingId, updateListingDto);
  }
}
