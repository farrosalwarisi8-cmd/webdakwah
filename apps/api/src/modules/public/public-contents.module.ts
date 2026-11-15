import { Module } from '@nestjs/common';

import { PublicContentsController } from './public-contents.controller.js';
import { PublicContentsService } from './public-contents.service.js';

@Module({
  controllers: [PublicContentsController],
  providers: [PublicContentsService],
})
export class PublicContentsModule {}
