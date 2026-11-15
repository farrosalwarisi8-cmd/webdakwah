import { Module } from '@nestjs/common';

import { StorageModule } from '../storage/storage.module.js';
import { UploadQuotaService } from './upload-quota.service.js';
import { UploadsController } from './uploads.controller.js';
import { UploadsService } from './uploads.service.js';

@Module({
  imports: [StorageModule],
  controllers: [UploadsController],
  providers: [UploadsService, UploadQuotaService],
})
export class UploadsModule {}
