import {
  Controller,
  Get,
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
    return this.paymentsService.findAllPaymentsForAdmin(status);
  }
}
