import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AdminAmbassadorsController } from './admin-ambassadors.controller';
import { AmbassadorsController } from './ambassadors.controller';
import { AmbassadorsService } from './ambassadors.service';

@Module({
  imports: [PrismaModule],
  controllers: [AmbassadorsController, AdminAmbassadorsController],
  providers: [AmbassadorsService],
  exports: [AmbassadorsService],
})
export class AmbassadorsModule {}
