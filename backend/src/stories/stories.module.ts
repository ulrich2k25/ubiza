import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';

@Module({
  imports: [PrismaModule, StorageModule, ScheduleModule.forRoot()],
  controllers: [StoriesController],
  providers: [StoriesService],
})
export class StoriesModule {}
