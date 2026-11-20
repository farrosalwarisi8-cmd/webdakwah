import { Module } from '@nestjs/common';

import { BroadcastController } from './broadcast.controller.js';
import { BroadcastService } from './broadcast.service.js';
import { BroadcastStatusService } from './broadcast-status.service.js';
import { PublicLiveController } from './public-live.controller.js';
import { BroadcastWatchingController } from './broadcast-watching.controller.js';
import { BroadcastWatchingService } from './broadcast-watching.service.js';

@Module({
  controllers: [BroadcastController, PublicLiveController, BroadcastWatchingController],
  providers: [BroadcastService, BroadcastStatusService, BroadcastWatchingService],
})
export class BroadcastModule {}
