import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TrustModule } from './trust/trust.module';
import { ListingModule } from './listing/listing.module';
import { ImagesModule } from './images/images.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CitiesModule } from './cities/cities.module';
import { CategoriesModule } from './categories/categories.module';
import { ProfileModule } from './profile/profile.module';
import { StorageModule } from './storage/storage.module';
import { StoriesModule } from './stories/stories.module';
import { ReferralsModule } from './referrals/referrals.module';
import { BoostsModule } from './boosts/boosts.module';
import { MailModule } from './mail/mail.module';
import { FavoritesModule } from './favorites/favorites.module';
import { PremiumModule } from './premium/premium.module';
import { PaymentsModule } from './payments/payments.module';
import { AmbassadorsModule } from './ambassadors/ambassadors.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    TrustModule,
    ListingModule,
    ImagesModule,
    DashboardModule,
    CitiesModule,
    CategoriesModule,
    ProfileModule,
    StorageModule,
    StoriesModule,
    ReferralsModule,
    BoostsModule,
    MailModule,
    FavoritesModule,
    PremiumModule,
    PaymentsModule,
    AmbassadorsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
