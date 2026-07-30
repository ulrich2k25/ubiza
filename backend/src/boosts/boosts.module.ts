import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { BoostsController } from './boosts.controller';
import { BoostsService } from './boosts.service';

@Module({
  imports: [PrismaModule],
  controllers: [BoostsController],
  providers: [BoostsService],
})
export class BoostsModule {}
