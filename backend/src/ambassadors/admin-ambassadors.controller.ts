import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  AmbassadorStatus,
  UserRole,
  PayoutStatus,
} from '../../generated/prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AmbassadorsService } from './ambassadors.service';
import { RejectAmbassadorDto } from './dto/reject-ambassador.dto';

@Controller('admin/ambassadors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminAmbassadorsController {
  constructor(private readonly ambassadorsService: AmbassadorsService) {}

  @Get()
  findAll(
    @Query(
      'status',
      new ParseEnumPipe(AmbassadorStatus, {
        optional: true,
      }),
    )
    status?: AmbassadorStatus,
  ) {
    return this.ambassadorsService.findAllForAdmin(status);
  }

  @Get('payouts/all')
  findAllPayouts(
    @Query(
      'status',
      new ParseEnumPipe(PayoutStatus, {
        optional: true,
      }),
    )
    status?: PayoutStatus,
  ) {
    return this.ambassadorsService.findAllPayoutsForAdmin(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ambassadorsService.findOneForAdmin(id);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.ambassadorsService.approve(id);
  }

  @Patch(':id/verify-identity')
  verifyIdentity(@Param('id') id: string) {
    return this.ambassadorsService.verifyIdentity(id);
  }

  @Patch('payouts/:id/start')
  startPayout(@Param('id') id: string) {
    return this.ambassadorsService.startPayout(id);
  }

  @Patch('payouts/:id/paid')
  markPayoutAsPaid(
    @Param('id') id: string,
    @Body('paymentReference') paymentReference?: string,
  ) {
    return this.ambassadorsService.markPayoutAsPaid(id, paymentReference);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectAmbassadorDto) {
    return this.ambassadorsService.reject(id, dto.reason);
  }

  @Patch(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.ambassadorsService.suspend(id);
  }

  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.ambassadorsService.reactivate(id);
  }
}
