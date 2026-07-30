import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { VisibilityModule } from '../visibility/visibility.module';

import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [PrismaModule, VisibilityModule],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
