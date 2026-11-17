import { Module } from '@nestjs/common';

import { BroadcastController } from './broadcast.controller.js';
import { BroadcastService } from './broadcast.service.js';
import { BroadcastStatusService } from './broadcast-status.service.js';
import { PublicLiveController } from './public-live.controller.js';

@Module({
  controllers: [BroadcastController, PublicLiveController],
  providers: [BroadcastService, BroadcastStatusService],
})
export class BroadcastModule {}
