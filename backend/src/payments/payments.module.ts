import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ReferralsModule } from '../referrals/referrals.module';

import { PaymentsController } from './payments.controller';
import { PaymentPricingService } from './payment-pricing.service';
import { PaymentsService } from './payments.service';

@Module({
  imports: [PrismaModule, ReferralsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentPricingService],
  exports: [PaymentsService, PaymentPricingService],
})
export class PaymentsModule {}
