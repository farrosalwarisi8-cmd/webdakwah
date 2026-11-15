import { Module } from '@nestjs/common';

import { RevalidationService } from '../revalidation/revalidation.service.js';
import { ContentsController } from './contents.controller.js';
import { ContentsService } from './contents.service.js';

@Module({
  controllers: [ContentsController],
  providers: [ContentsService, RevalidationService],
})
export class ContentsModule {}
