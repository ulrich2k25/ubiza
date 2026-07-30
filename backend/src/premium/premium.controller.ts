import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PremiumService } from './premium.service';

interface AuthenticatedRequest {
  user: {
    id: string;
  };
}

@Controller('premium')
@UseGuards(JwtAuthGuard)
export class PremiumController {
  constructor(private readonly premiumService: PremiumService) {}

  @Get('me')
  getMyPremium(@Request() request: AuthenticatedRequest) {
    return this.premiumService.getMyPremium(request.user.id);
  }

  @Post('trial')
  startTrial(@Request() request: AuthenticatedRequest) {
    return this.premiumService.startFreeTrial(request.user.id);
  }
}
