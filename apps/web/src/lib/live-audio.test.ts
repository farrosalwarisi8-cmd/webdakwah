import { describe, expect, it } from 'vitest';

import {
  LIVE_ERROR_MESSAGE,
  formatTrackMeta,
  isLiveTrack,
  playbackErrorMessage,
  progressPercent,
  safeDuration,
  trackHref,
} from './live-audio';

const liveTrack = {
  slug: 'siaran-langsung',
  title: 'Siaran Langsung',
  speaker: 'Siaran langsung',
  src: 'https://radio.example.com/live',
  isLive: true,
};

const audioTrack = {
  slug: 'kajian-sabar',
  title: 'Sabar',
  speaker: 'Ust. Contoh',
  src: 'https://cdn.example.com/kajian.mp3',
};

const base = { currentTime: 75, duration: 600, isBuffering: false, ended: false };

describe('logika pemutar siaran langsung', () => {
  it('mengenali trek siaran dari penanda isLive atau slug lama', () => {
    expect(isLiveTrack(liveTrack)).toBe(true);
    expect(isLiveTrack({ slug: 'siaran-langsung', isLive: false })).toBe(true);
    expect(isLiveTrack(audioTrack)).toBe(false);
  });

  it('mengarahkan tautan siaran ke /siaran, bukan halaman audio', () => {
    expect(trackHref(liveTrack)).toBe('/siaran');
    expect(trackHref({ slug: 'siaran-langsung' })).toBe('/siaran');
    expect(trackHref(audioTrack)).toBe('/audio/kajian-sabar');
  });

  it('tidak pernah menampilkan durasi tak hingga atau NaN', () => {
    expect(safeDuration(Number.POSITIVE_INFINITY)).toBe(0);
    expect(safeDuration(Number.NaN)).toBe(0);
    expect(safeDuration(-5)).toBe(0);
    expect(safeDuration(42.9)).toBe(42.9);

    const meta = formatTrackMeta(
      { ...audioTrack, isLive: true },
      { ...base, duration: Number.POSITIVE_INFINITY, currentTime: Number.NaN },
    );

    expect(meta).not.toMatch(/Infinity|NaN/);
    expect(meta).toBe('LANGSUNG');
  });

  it('menyembunyikan waktu dan durasi untuk siaran', () => {
    expect(formatTrackMeta(liveTrack, base)).toBe('LANGSUNG');
    expect(formatTrackMeta(liveTrack, { ...base, isBuffering: true })).toBe('LANGSUNG · memuat…');
    expect(progressPercent(liveTrack, 30, 600)).toBe(0);
  });

  it('tetap menampilkan waktu dan progres untuk trek biasa', () => {
    expect(formatTrackMeta(audioTrack, base)).toBe('Ust. Contoh · 1:15 / 10:00');
    expect(formatTrackMeta(audioTrack, { ...base, duration: 0 })).toBe('Ust. Contoh · 1:15');
    expect(formatTrackMeta(audioTrack, { ...base, ended: true })).toBe(
      'Ust. Contoh · 1:15 / 10:00 · selesai',
    );
    expect(progressPercent(audioTrack, 150, 600)).toBe(25);
    expect(progressPercent(audioTrack, 150, Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('memakai pesan galat ramah khusus siaran', () => {
    expect(playbackErrorMessage(liveTrack)).toBe(LIVE_ERROR_MESSAGE);
    expect(playbackErrorMessage(audioTrack)).not.toBe(LIVE_ERROR_MESSAGE);
    expect(playbackErrorMessage(null)).toContain('Audio tidak dapat diputar');
  });
});
