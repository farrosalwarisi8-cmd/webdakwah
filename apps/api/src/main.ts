import 'reflect-metadata';

import helmet from '@fastify/helmet';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from './app.module.js';
import { parseOrigins } from './config/env.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: { level: process.env.LOG_LEVEL ?? 'info' },
      trustProxy: true,
      bodyLimit: 1_048_576,
    }),
  );

  const config = app.get(ConfigService);
  const port = config.getOrThrow<number>('PORT');
  const host = config.getOrThrow<string>('HOST');
  const origins = parseOrigins(config.getOrThrow<string>('FRONTEND_ORIGINS'));

  if (config.get<string>('NODE_ENV') === 'production' && !config.get<string>('SUPABASE_URL')) {
    throw new Error('SUPABASE_URL wajib diisi di production agar verifikasi token berjalan.');
  }

  await app.register(helmet, { contentSecurityPolicy: false });

  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Semua endpoint API berada di /api, kecuali health check untuk Render.
  app.setGlobalPrefix('api', { exclude: ['health'] });

  app.enableShutdownHooks();

  await app.listen({ port, host });

  Logger.log(`API siap di http://${host}:${port} (health: /health)`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  Logger.error('Gagal menjalankan server', error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
