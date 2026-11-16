import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { validateEnv } from './config/env.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { RolesGuard } from './modules/auth/roles.guard.js';
import { SupabaseAuthGuard } from './modules/auth/supabase-auth.guard.js';
import { ContentsModule } from './modules/contents/contents.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { PublicContentsModule } from './modules/public/public-contents.module.js';
import { TaxonomyModule } from './modules/taxonomy/taxonomy.module.js';
import {
  readLimit,
  resolveThrottleTracker,
  THROTTLE_TTL_MS,
} from './modules/throttling/throttling.js';
import { UploadsModule } from './modules/uploads/uploads.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: THROTTLE_TTL_MS,
          limit: () => readLimit('THROTTLE_GLOBAL_PER_MIN', 600),
        },
      ],
      getTracker: (request) => resolveThrottleTracker(request),
      errorMessage: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.',
    }),
    AuthModule,
    ContentsModule,
    PublicContentsModule,
    TaxonomyModule,
    UploadsModule,
    UsersModule,
    HealthModule,
  ],
  providers: [
    // Urutan penting: verifikasi token dulu (agar kunci throttle memakai id
    // pengguna), lalu batasi laju, baru cek role dari database.
    { provide: APP_GUARD, useClass: SupabaseAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
