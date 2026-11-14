import { Controller, Get } from '@nestjs/common';

export interface HealthResponse {
  status: 'ok';
  uptimeSec: number;
  timestamp: string;
}

/**
 * Sengaja sangat ringan (tanpa query database) karena dipakai Render sebagai
 * health check. Path publik: GET /health
 */
@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      uptimeSec: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
