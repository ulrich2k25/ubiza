import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoostsService } from './boosts.service';

@Controller('boosts')
@UseGuards(JwtAuthGuard)
export class BoostsController {
  constructor(private readonly boostsService: BoostsService) {}

  @Get('status')
  getStatus(
    @Request()
    request: {
      user: {
        id: string;
      };
    },
  ) {
    return this.boostsService.getStatus(request.user.id);
  }

  @Post('activate')
  activate(
    @Request()
    request: {
      user: {
        id: string;
      };
    },
  ) {
    return this.boostsService.activate(request.user.id);
  }
}
