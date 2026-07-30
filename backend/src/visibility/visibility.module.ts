import { Module } from '@nestjs/common';

import { VisibilityService } from './visibility.service';

@Module({
  providers: [VisibilityService],
  exports: [VisibilityService],
})
export class VisibilityModule {}
