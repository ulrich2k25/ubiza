import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ReferralsModule } from '../referrals/referrals.module';

import { AdminPaymentsController } from './admin-payments.controller';
import { CamPayController } from './campay/campay.controller';
import { CamPayService } from './campay/campay.service';
import { PaymentPlatformService } from './payment-platform/payment-platform.service';
import { PaymentPricingService } from './payment-pricing.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentPlatformWebhookController } from './payment-platform/payment-platform-webhook.controller';

@Module({
  imports: [PrismaModule, ReferralsModule, NotificationsModule],
  controllers: [
    PaymentsController,
    AdminPaymentsController,
    CamPayController,
    PaymentPlatformWebhookController,
  ],
  providers: [
    PaymentsService,
    PaymentPricingService,
    CamPayService,
    PaymentPlatformService,
  ],
  exports: [
    PaymentsService,
    PaymentPricingService,
    CamPayService,
    PaymentPlatformService,
  ],
})
export class PaymentsModule {}
