import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { validateEnv } from './config/env.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { RolesGuard } from './modules/auth/roles.guard.js';
import { SupabaseAuthGuard } from './modules/auth/supabase-auth.guard.js';
import { ContentsModule } from './modules/contents/contents.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { PublicContentsModule } from './modules/public/public-contents.module.js';
import { UploadsModule } from './modules/uploads/uploads.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
    }),
    AuthModule,
    ContentsModule,
    PublicContentsModule,
    UploadsModule,
    HealthModule,
  ],
  providers: [
    // Urutan penting: verifikasi token dulu, baru cek role dari database.
    { provide: APP_GUARD, useClass: SupabaseAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
