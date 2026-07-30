import { Module } from '@nestjs/common';

import { ListingService } from './listing.service';
import { ListingController } from './listing.controller';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [ProfileModule],
  controllers: [ListingController],
  providers: [ListingService],
})
export class ListingModule {}
