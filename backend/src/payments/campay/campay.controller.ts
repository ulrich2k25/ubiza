import { Body, Controller, HttpCode, Post } from '@nestjs/common';

import { PaymentsService } from '../payments.service';
import type { CamPayWebhookPayload } from './campay.types';
@Controller('payments/campay')
export class CamPayController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook')
  @HttpCode(200)
  handleWebhook(@Body() payload: CamPayWebhookPayload) {
    return this.paymentsService.handleCamPayWebhook(payload);
  }
}
