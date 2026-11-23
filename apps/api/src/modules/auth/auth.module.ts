import { Global, Module } from '@nestjs/common';

import { AuthController } from './auth.controller.js';
import { MeService } from './me.service.js';
import { RolesGuard } from './roles.guard.js';
import { SupabaseAuthGuard } from './supabase-auth.guard.js';
import { SupabaseTokenService } from './supabase-token.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [SupabaseTokenService, SupabaseAuthGuard, RolesGuard, MeService],
  exports: [PrismaModule, SupabaseTokenService, SupabaseAuthGuard, RolesGuard],
})
export class AuthModule {}
