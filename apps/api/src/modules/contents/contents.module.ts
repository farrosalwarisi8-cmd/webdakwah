import { Module } from '@nestjs/common';

import { RevalidationService } from '../revalidation/revalidation.service.js';
import { StorageModule } from '../storage/storage.module.js';
import { TaxonomyModule } from '../taxonomy/taxonomy.module.js';
import { ContentsController } from './contents.controller.js';
import { ContentsService } from './contents.service.js';

@Module({
  imports: [StorageModule, TaxonomyModule],
  controllers: [ContentsController],
  providers: [ContentsService, RevalidationService],
})
export class ContentsModule {}
