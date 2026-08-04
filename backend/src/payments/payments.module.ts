import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ReferralsModule } from '../referrals/referrals.module';

import { AdminPaymentsController } from './admin-payments.controller';
import { CamPayController } from './campay/campay.controller';
import { CamPayService } from './campay/campay.service';
import { PaymentPricingService } from './payment-pricing.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [PrismaModule, ReferralsModule, NotificationsModule],
  controllers: [PaymentsController, AdminPaymentsController, CamPayController],
  providers: [PaymentsService, PaymentPricingService, CamPayService],
  exports: [PaymentsService, PaymentPricingService, CamPayService],
})
export class PaymentsModule {}
