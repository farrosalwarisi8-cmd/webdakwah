import { ThrottlerException, ThrottlerGuard, type ThrottlerStorage } from '@nestjs/throttler';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';

import { resolveThrottleTracker } from '../src/modules/throttling/throttling.js';

class FakeStorage {
  readonly hits = new Map<string, number>();

  increment(key: string, _ttl: number, limit: number) {
    const totalHits = (this.hits.get(key) ?? 0) + 1;
    this.hits.set(key, totalHits);

    return Promise.resolve({
      totalHits,
      timeToExpire: 60,
      isBlocked: totalHits > limit,
      timeToBlockExpire: 60,
    });
  }
}

class PublicContentsController {}
class UploadsController {}

function namedHandler(name: string) {
  const handler = () => undefined;
  Object.defineProperty(handler, 'name', { value: name });

  return handler;
}

function contextFor(options: {
  ip: string;
  userId?: string;
  controller: new () => unknown;
  handler: string;
}): ExecutionContext {
  const request = {
    ip: options.ip,
    ...(options.userId ? { user: { id: options.userId } } : {}),
  };

  return {
    getHandler: () => namedHandler(options.handler),
    getClass: () => options.controller,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({ header: () => undefined }),
    }),
  } as unknown as ExecutionContext;
}

function createGuard(limit = 1) {
  const options = {
    throttlers: [{ name: 'default', ttl: 60_000, limit }],
    getTracker: (request: Record<string, unknown>) =>
      resolveThrottleTracker(request as { user?: { id?: string }; ip?: string }),
    setHeaders: false,
  };
  const reflector = {
    getAllAndOverride: () => undefined,
  } as unknown as Reflector;
  const guard = new ThrottlerGuard(options, new FakeStorage() as unknown as ThrottlerStorage, reflector);

  return guard.onModuleInit().then(() => guard);
}

describe('resolveThrottleTracker', () => {
  it('memakai id pengguna bila tersedia, selain itu IP', () => {
    expect(resolveThrottleTracker({ user: { id: 'user-1' }, ip: '10.0.0.1' })).toBe('user:user-1');
    expect(resolveThrottleTracker({ ip: '10.0.0.1' })).toBe('ip:10.0.0.1');
    expect(resolveThrottleTracker({})).toBe('ip:tidak-diketahui');
  });
});

describe('ThrottlerGuard — kunci dan pemisahan bucket', () => {
  it('menghitung pengguna berbeda secara terpisah walau IP-nya sama', async () => {
    const guard = await createGuard();
    const request = (userId: string) =>
      contextFor({
        ip: '10.0.0.1',
        userId,
        controller: UploadsController,
        handler: 'presign',
      });

    await expect(guard.canActivate(request('user-a'))).resolves.toBe(true);
    await expect(guard.canActivate(request('user-a'))).rejects.toBeInstanceOf(ThrottlerException);
    // Pengguna lain di belakang IP yang sama tidak ikut terblokir.
    await expect(guard.canActivate(request('user-b'))).resolves.toBe(true);
  });

  it('pengunjung publik dengan IP berbeda tidak saling menghambat', async () => {
    const guard = await createGuard();
    const request = (ip: string) =>
      contextFor({ ip, controller: PublicContentsController, handler: 'list' });

    await expect(guard.canActivate(request('203.0.113.1'))).resolves.toBe(true);
    await expect(guard.canActivate(request('203.0.113.1'))).rejects.toBeInstanceOf(
      ThrottlerException,
    );
    await expect(guard.canActivate(request('203.0.113.2'))).resolves.toBe(true);
  });

  it('pencarian publik punya penghitung sendiri, tidak menghabiskan daftar', async () => {
    const guard = await createGuard();
    const list = contextFor({ ip: '198.51.100.7', controller: PublicContentsController, handler: 'list' });
    const search = contextFor({
      ip: '198.51.100.7',
      controller: PublicContentsController,
      handler: 'search',
    });

    await expect(guard.canActivate(list)).resolves.toBe(true);
    await expect(guard.canActivate(search)).resolves.toBe(true);
    // Daftar tetap punya jatah; yang habis hanya bucket miliknya sendiri.
    await expect(guard.canActivate(list)).rejects.toBeInstanceOf(ThrottlerException);
    await expect(guard.canActivate(search)).rejects.toBeInstanceOf(ThrottlerException);
  });
});
