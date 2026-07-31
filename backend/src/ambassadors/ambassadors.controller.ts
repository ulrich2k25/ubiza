import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '../../generated/prisma/enums';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AmbassadorsService } from './ambassadors.service';
import { ApplyAmbassadorDto } from './dto/apply-ambassador.dto';

interface AuthenticatedRequest {
  user: {
    id: string;
  };
}

@Controller('ambassadors')
@UseGuards(JwtAuthGuard)
export class AmbassadorsController {
  constructor(private readonly ambassadorsService: AmbassadorsService) {}

  @Post('apply')
  apply(
    @Request() request: AuthenticatedRequest,
    @Body() dto: ApplyAmbassadorDto,
  ) {
    return this.ambassadorsService.apply(request.user.id, dto);
  }

  @Get('me')
  getMine(@Request() request: AuthenticatedRequest) {
    return this.ambassadorsService.getMine(request.user.id);
  }

  @Post('me/request-identity-verification')
  requestIdentityVerification(@Request() request: AuthenticatedRequest) {
    return this.ambassadorsService.requestIdentityVerification(request.user.id);
  }

  @Get('payouts')
  getMyPayouts(@Request() request: AuthenticatedRequest) {
    return this.ambassadorsService.getMyPayouts(request.user.id);
  }
  @Post('request-payout')
  requestPayout(@Request() request: AuthenticatedRequest) {
    return this.ambassadorsService.requestPayout(request.user.id);
  }

  @Patch(':id/verify-identity')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  verifyIdentity(@Param('id') id: string) {
    return this.ambassadorsService.verifyIdentity(id);
  }
}
