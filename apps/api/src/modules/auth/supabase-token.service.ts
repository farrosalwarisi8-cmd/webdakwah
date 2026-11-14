import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from 'jose';

import type { AuthUser } from './auth.types.js';

/** Toleransi jam antara server API dan Supabase. */
const CLOCK_TOLERANCE_SEC = 5;

@Injectable()
export class SupabaseTokenService {
  private readonly logger = new Logger(SupabaseTokenService.name);
  private readonly issuer: string | null;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet> | null;
  private readonly secret: Uint8Array | null;

  constructor(config: ConfigService) {
    const supabaseUrl = config.get<string>('SUPABASE_URL');
    const jwksUrl =
      config.get<string>('SUPABASE_JWKS_URL') ??
      (supabaseUrl ? `${supabaseUrl}/auth/v1/.well-known/jwks.json` : null);
    const secret = config.get<string>('SUPABASE_JWT_SECRET');

    this.issuer = supabaseUrl ? `${supabaseUrl}/auth/v1` : null;
    this.jwks = jwksUrl ? createRemoteJWKSet(new URL(jwksUrl)) : null;
    this.secret = secret ? new TextEncoder().encode(secret) : null;
  }

  /**
   * Memverifikasi access token Supabase. Token baru memakai kunci asimetris
   * (ES256) lewat JWKS; proyek lama dengan JWT secret memakai HS256.
   */
  async verify(accessToken: string): Promise<AuthUser> {
    if (!this.issuer || (!this.jwks && !this.secret)) {
      throw new ServiceUnavailableException(
        'Autentikasi belum dikonfigurasi di server (SUPABASE_URL / SUPABASE_JWT_SECRET).',
      );
    }

    const verifyOptions = {
      issuer: this.issuer,
      audience: 'authenticated',
      clockTolerance: CLOCK_TOLERANCE_SEC,
    } as const;

    try {
      const { alg } = decodeProtectedHeader(accessToken);
      const key = alg?.startsWith('HS') === true && this.secret ? this.secret : this.jwks;

      if (!key) {
        throw new UnauthorizedException('Metode verifikasi token tidak didukung.');
      }

      const { payload } = await jwtVerify(accessToken, key, verifyOptions);
      const id = payload.sub;
      const email = typeof payload.email === 'string' ? payload.email : undefined;

      if (!id || !email) {
        throw new UnauthorizedException('Token tidak memuat identitas pengguna.');
      }

      return { id, email };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.debug(`Token ditolak: ${error instanceof Error ? error.message : String(error)}`);
      throw new UnauthorizedException(
        'Sesi tidak valid atau sudah kedaluwarsa. Silakan masuk kembali.',
      );
    }
  }
}
