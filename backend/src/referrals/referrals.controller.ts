import { Controller, Get, Request, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReferralsService } from './referrals.service';

interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('referrals')
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('me')
  getMine(@Request() request: AuthenticatedRequest) {
    return this.referralsService.getMine(request.user.id);
  }
}
