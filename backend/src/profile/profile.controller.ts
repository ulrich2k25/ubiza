import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';
import { createHash } from 'crypto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileContactDto } from './dto/update-profile-contact.dto';
import { ProfileService } from './profile.service';

type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
};

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Homepage / découverte publique
   * Retourne les profils visibles.
   */
  @Get('public')
  findPublicProfiles() {
    return this.profileService.findPublicProfiles();
  }

  /**
   * Recherche publique visiteur.
   *
   * Exemple :
   * GET /profiles/search?q=douala
   */
  @Get('search')
  searchProfiles(@Query('q') query: string) {
    return this.profileService.searchProfiles(query);
  }

  /**
   * Mise à jour des coordonnées du profil connecté.
   *
   * Exemple :
   * PATCH /profiles/me/contact
   */
  @UseGuards(JwtAuthGuard)
  @Patch('me/contact')
  updateMyContact(
    @Req() request: Request,
    @Body() updateProfileContactDto: UpdateProfileContactDto,
  ) {
    const user = request.user as AuthenticatedUser;

    return this.profileService.updateMyContact(
      user.id,
      updateProfileContactDto,
    );
  }

  /**
   * Suggestions de profils.
   *
   * Exemple :
   * GET /profiles/bella237/suggestions
   */
  @Get(':username/suggestions')
  findSuggestions(@Param('username') username: string) {
    return this.profileService.findSuggestions(username);
  }

  /**
   * Coordonnées protégées d'une créatrice.
   *
   * Cette route nécessite un compte connecté
   * avec un token JWT valide.
   *
   * Exemple :
   * GET /profiles/bella237/contact
   */
  @Get(':username/contact')
  findProfileContact(@Param('username') username: string) {
    return this.profileService.findProfileContact(username);
  }

  /**
   * Page publique détaillée d'une créatrice.
   *
   * Cette route ne retourne jamais les coordonnées.
   *
   * Exemple :
   * GET /profiles/bella237
   */
  @Get(':username')
  findPublicProfile(
    @Param('username') username: string,
    @Req() request: Request,
  ) {
    const forwardedFor = request.headers['x-forwarded-for'];

    const ipAddress =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : request.ip || request.socket.remoteAddress || 'unknown-ip';

    const userAgent = request.headers['user-agent'] || 'unknown-user-agent';

    const visitorKey = createHash('sha256')
      .update(`${ipAddress}:${userAgent}`)
      .digest('hex');

    return this.profileService.findPublicProfile(username, visitorKey);
  }
}
