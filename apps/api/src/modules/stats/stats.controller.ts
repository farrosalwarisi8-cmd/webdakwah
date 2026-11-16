import { Controller, Get } from '@nestjs/common';

import { Roles } from '../auth/auth.decorators.js';
import { StatsService } from './stats.service.js';

@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get()
  @Roles('ADMIN')
  summary() {
    return this.stats.getSummary();
  }
}
