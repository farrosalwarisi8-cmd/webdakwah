'use client';

import { Radio, UserMinus, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface UseLiveWatchesResult {
  watcherCount: number;
  watching: boolean;
  authenticated: boolean;
  loading: boolean;
  pending: boolean;
  error: string | null;
  toggle: () => Promise<void>;
}

interface WatchingResponse {
  watching?: boolean;
  watcherCount?: number;
  message?: string | string[];
}

async function getAccessToken(): Promise<string | null> {
  try {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function readMessage(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => null)) as WatchingResponse | null;
  const message = body?.message;

  if (Array.isArray(message)) return message.join(' ');
  return typeof message === 'string' && message ? message : fallback;
}

/** Status dan aksi mengikuti satu channel siaran live. */
export function useLiveWatches(channelId: string): UseLiveWatchesResult {
  const [watcherCount, setWatcherCount] = useState(0);
  const [watching, setWatching] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [countResponse, token] = await Promise.all([
          fetch(`${API_URL}/api/broadcast/public/${encodeURIComponent(channelId)}/watching-count`, {
            cache: 'no-store',
          }),
          getAccessToken(),
        ]);

        if (cancelled) return;

        const countBody = (await countResponse.json().catch(() => null)) as WatchingResponse | null;
        if (typeof countBody?.watcherCount === 'number') {
          setWatcherCount(countBody.watcherCount);
        }

        setAuthenticated(Boolean(token));
        if (!token) return;

        const statusResponse = await fetch(
          `${API_URL}/api/broadcast/watch/${encodeURIComponent(channelId)}`,
          { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
        );

        if (cancelled || !statusResponse.ok) return;

        const statusBody = (await statusResponse
          .json()
          .catch(() => null)) as WatchingResponse | null;
        setWatching(Boolean(statusBody?.watching));
        if (typeof statusBody?.watcherCount === 'number') {
          setWatcherCount(statusBody.watcherCount);
        }
      } catch {
        if (!cancelled) setError('Gagal memuat status siaran.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [channelId]);

  const toggle = useCallback(async () => {
    setPending(true);
    setError(null);

    try {
      const token = await getAccessToken();

      if (!token) {
        setAuthenticated(false);
        setError('Masuk dulu untuk mengikuti siaran.');
        return;
      }

      const response = await fetch(
        `${API_URL}/api/broadcast/watch/${encodeURIComponent(channelId)}`,
        {
          method: watching ? 'DELETE' : 'POST',
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        },
      );

      if (!response.ok) {
        setError(await readMessage(response, 'Gagal memperbarui status ikut siaran.'));
        return;
      }

      const body = (await response.json().catch(() => null)) as WatchingResponse | null;

      setWatching(typeof body?.watching === 'boolean' ? body.watching : !watching);
      if (typeof body?.watcherCount === 'number') setWatcherCount(body.watcherCount);
    } catch {
      setError('Gagal menghubungi server. Coba lagi beberapa saat.');
    } finally {
      setPending(false);
    }
  }, [channelId, watching]);

  return { watcherCount, watching, authenticated, loading, pending, error, toggle };
}

/** Tombol mengikuti / berhenti mengikuti channel siaran live. */
export function LiveWatchToggle({ channelId }: { channelId: string }) {
  const { watcherCount, watching, authenticated, loading, pending, error, toggle } =
    useLiveWatches(channelId);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-600">
        <span className="font-semibold text-ink-900">{watcherCount}</span> pendengar mengikuti
        siaran ini.
      </p>

      {loading ? (
        <p className="text-xs text-ink-500">Memuat status ikut siaran…</p>
      ) : authenticated ? (
        <button
          type="button"
          onClick={() => void toggle()}
          disabled={pending}
          aria-pressed={watching}
          className={`inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-white transition disabled:cursor-wait disabled:opacity-60 ${
            watching ? 'bg-rose-600 hover:bg-rose-500' : 'bg-ink-900 hover:bg-ink-800'
          }`}
        >
          {pending ? (
            <Radio aria-hidden className="size-4 animate-spin" />
          ) : watching ? (
            <UserMinus aria-hidden className="size-4" />
          ) : (
            <UserPlus aria-hidden className="size-4" />
          )}
          {watching ? 'Berhenti mengikuti' : 'Ikuti siaran'}
        </button>
      ) : (
        <Link
          href="/masuk?next=/siaran"
          className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-full bg-ink-900 px-4 text-sm font-semibold text-white transition hover:bg-ink-800"
        >
          <UserPlus aria-hidden className="size-4" />
          Masuk untuk mengikuti siaran
        </Link>
      )}

      {error ? (
        <p role="status" className="text-xs text-amber-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
