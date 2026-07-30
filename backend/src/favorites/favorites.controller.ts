import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FavoritesService } from './favorites.service';

type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
};

@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  /**
   * Retourne les favoris de l'utilisateur connecté.
   *
   * GET /favorites/me
   */
  @Get('me')
  findMine(@Req() request: Request) {
    const user = request.user as AuthenticatedUser;

    return this.favoritesService.findMine(user.id);
  }

  /**
   * Vérifie si une annonce est déjà en favori.
   *
   * GET /favorites/:listingId/status
   */
  @Get(':listingId/status')
  getStatus(@Req() request: Request, @Param('listingId') listingId: string) {
    const user = request.user as AuthenticatedUser;

    return this.favoritesService.getStatus(user.id, listingId);
  }

  /**
   * Ajoute une annonce aux favoris.
   *
   * POST /favorites/:listingId
   */
  @Post(':listingId')
  add(@Req() request: Request, @Param('listingId') listingId: string) {
    const user = request.user as AuthenticatedUser;

    return this.favoritesService.add(user.id, listingId);
  }

  /**
   * Retire une annonce des favoris.
   *
   * DELETE /favorites/:listingId
   */
  @Delete(':listingId')
  remove(@Req() request: Request, @Param('listingId') listingId: string) {
    const user = request.user as AuthenticatedUser;

    return this.favoritesService.remove(user.id, listingId);
  }
}
