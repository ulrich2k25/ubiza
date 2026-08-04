import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { PaymentStatus, UserRole } from '../../generated/prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaymentsService } from './payments.service';

@Controller('admin/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(@Query('status') status?: PaymentStatus) {
    return this.paymentsService.findAllManualPaymentsForAdmin(status);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.paymentsService.approveManualPayment(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.paymentsService.rejectManualPayment(id, reason);
  }
}
