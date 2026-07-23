import { Controller, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TrustService } from './trust.service';

type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
};

@Controller('trust')
export class TrustController {
  constructor(private readonly trustService: TrustService) {}

  @UseGuards(JwtAuthGuard)
  @Patch('me/recalculate')
  recalculateMyTrust(@Req() request: Request) {
    const user = request.user as AuthenticatedUser;

    return this.trustService.recalculateUserTrust(user.id);
  }
}
