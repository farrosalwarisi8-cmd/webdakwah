import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module.js';
import { RevalidationService } from '../revalidation/revalidation.service.js';
import { StorageModule } from '../storage/storage.module.js';
import { TaxonomyModule } from '../taxonomy/taxonomy.module.js';
import { ContentsController } from './contents.controller.js';
import { ContentsService } from './contents.service.js';

@Module({
  imports: [NotificationsModule, StorageModule, TaxonomyModule],
  controllers: [ContentsController],
  providers: [ContentsService, RevalidationService],
})
export class ContentsModule {}
