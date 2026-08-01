import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ReferralsModule } from '../referrals/referrals.module';

import { CamPayController } from './campay/campay.controller';
import { CamPayService } from './campay/campay.service';
import { PaymentsController } from './payments.controller';
import { PaymentPricingService } from './payment-pricing.service';
import { PaymentsService } from './payments.service';

@Module({
  imports: [PrismaModule, ReferralsModule],
  controllers: [PaymentsController, CamPayController],
  providers: [PaymentsService, PaymentPricingService, CamPayService],
  exports: [PaymentsService, PaymentPricingService, CamPayService],
})
export class PaymentsModule {}
