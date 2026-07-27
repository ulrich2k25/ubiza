import { Module } from '@nestjs/common';

import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [ImagesController],
  providers: [ImagesService],
})
export class ImagesModule {}
