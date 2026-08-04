import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { PaymentsService } from './payments.service';
import { SubmitManualPaymentDto } from './dto/submit-manual-payment.dto';

interface AuthenticatedRequest {
  user: {
    id: string;
  };
}

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  initiate(
    @Request() request: AuthenticatedRequest,
    @Body() dto: InitiatePaymentDto,
  ) {
    return this.paymentsService.initiate(request.user.id, dto);
  }

  @Post('manual')
  submitManualPayment(
    @Request() request: AuthenticatedRequest,
    @Body() dto: SubmitManualPaymentDto,
  ) {
    return this.paymentsService.submitManualPayment(request.user.id, dto);
  }

  @Post(':paymentId/manual-confirm')
  confirmManualPayment(
    @Request() request: AuthenticatedRequest,
    @Param('paymentId') paymentId: string,
    @Headers('x-manual-payment-secret')
    secret?: string,
  ) {
    return this.paymentsService.confirmManualPayment(
      request.user.id,
      paymentId,
      secret,
    );
  }

  @Get('pricing')
  getPricing() {
    return this.paymentsService.getPricing();
  }

  @Get('me')
  getMine(@Request() request: AuthenticatedRequest) {
    return this.paymentsService.getMine(request.user.id);
  }

  @Get(':paymentId')
  getOne(
    @Request() request: AuthenticatedRequest,
    @Param('paymentId') paymentId: string,
  ) {
    return this.paymentsService.getOne(request.user.id, paymentId);
  }
}
