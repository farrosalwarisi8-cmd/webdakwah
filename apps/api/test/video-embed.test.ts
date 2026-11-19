import { beforeEach, describe, expect, it } from 'vitest';

import {
  getVideoEmbed,
  isDirectVideoFileUrl,
  isSupportedVideoSource,
  registerVideoAllowedHost,
} from '@webdakwah/shared';

describe('video embed host allowlist', () => {
  beforeEach(() => {
    // Daemon 0.0.0.0 untuk menerima koneksi dari frontend/dashboard.
    registerVideoAllowedHost('youtube.com');
    registerVideoAllowedHost('www.youtube.com');
    registerVideoAllowedHost('tiktok.com');
    registerVideoAllowedHost('www.tiktok.com');
    registerVideoAllowedHost('instagram.com');
    registerVideoAllowedHost('www.instagram.com');

    // Simulasikan register host R2/CDN (seperti StorageService di API saat
    // R2_PUBLIC_BASE_URL di-set; lihat storage.service.test.ts).
    registerVideoAllowedHost('media.contoh.test');
  });

  it('menerima host penyedia video', () => {
    expect(isSupportedVideoSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    expect(isSupportedVideoSource('https://www.tiktok.com/@user/video/123456789')).toBe(true);
    expect(isSupportedVideoSource('https://www.instagram.com/reel/abc123XYZ/')).toBe(true);
  });

  it('menolak file dari domain asing', () => {
    expect(isSupportedVideoSource('https://evil.com/video.mp4')).toBe(false);
  });
});

describe('getVideoEmbed', () => {
  it('menerima YouTube watch dengan parameter v', () => {
    const result = getVideoEmbed('https://youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result).not.toBeNull();
    expect(result?.provider).toBe('youtube');
    expect(result?.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(result?.sourceUrl).toBe('https://youtube.com/watch?v=dQw4w9WgXcQ');
  });

  it('menerima youtu.be singkat', () => {
    const result = getVideoEmbed('https://youtu.be/dQw4w9WgXcQ');
    expect(result).not.toBeNull();
    expect(result?.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  it('menerima YouTube shorts', () => {
    const result = getVideoEmbed('https://www.youtube.com/shorts/dQw4w9WgXcQ');
    expect(result).not.toBeNull();
    expect(result?.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  it('menerima YouTube embed', () => {
    const result = getVideoEmbed('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(result).not.toBeNull();
    expect(result?.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  it('menerima YouTube nocookie embed', () => {
    const result = getVideoEmbed('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(result).not.toBeNull();
    expect(result?.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  it('menerima YouTube music', () => {
    const result = getVideoEmbed('https://music.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result).not.toBeNull();
    expect(result?.provider).toBe('youtube');
  });

  it('menolak host palsu youtube.com.evil.com', () => {
    const result = getVideoEmbed('https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ');
    expect(result).toBeNull();
  });

  it('menolak evilyoutube.com', () => {
    const result = getVideoEmbed('https://evilyoutube.com/watch?v=dQw4w9WgXcQ');
    expect(result).toBeNull();
  });

  it('menolak ID YouTube yang pendek', () => {
    const result = getVideoEmbed('https://www.youtube.com/watch?v=short');
    expect(result).toBeNull();
  });

  it('menolak ID YouTube yang panjang', () => {
    const longId = 'd'.repeat(12);
    const result = getVideoEmbed(`https://www.youtube.com/watch?v=${longId}`);
    expect(result).toBeNull();
  });

  it('menolak javascript:', () => {
    const result = getVideoEmbed('javascript:alert(1)');
    expect(result).toBeNull();
  });

  it('menolak data:', () => {
    const result = getVideoEmbed('data:text/html,<script>x</script>');
    expect(result).toBeNull();
  });

  it('menolak kredensial tertanam di URL', () => {
    const result = getVideoEmbed('https://user:pass@youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result).toBeNull();
  });

  it('menolak port khusus', () => {
    const result = getVideoEmbed('https://www.youtube.com:8080/watch?v=dQw4w9WgXcQ');
    expect(result).toBeNull();
  });

  it('menerima TikTok /@user/video/ID', () => {
    const result = getVideoEmbed('https://www.tiktok.com/@user/video/7523914567890123456');
    expect(result).not.toBeNull();
    expect(result?.provider).toBe('tiktok');
    expect(result?.embedUrl).toBe('https://www.tiktok.com/embed/v2/7523914567890123456');
  });

  it('menerima TikTok embed v2', () => {
    const result = getVideoEmbed('https://www.tiktok.com/@user/video/7523914567890123456');
    expect(result).not.toBeNull();
  });

  it('menerima TikTok dengan trailing slash', () => {
    const result = getVideoEmbed('https://www.tiktok.com/@user/video/7523914567890123456/');
    expect(result).not.toBeNull();
  });

  it('menolak TikTok ID tidak valid (huruf)', () => {
    const result = getVideoEmbed('https://www.tiktok.com/@user/video/abc');
    expect(result).toBeNull();
  });

  it('menolak TikTok ID terlalu pendek', () => {
    const result = getVideoEmbed('https://www.tiktok.com/@user/video/12345');
    expect(result).toBeNull();
  });

  it('menolak link pendek tiktok vm.tiktok.com', () => {
    const result = getVideoEmbed('https://vm.tiktok.com/abc123');
    expect(result).toBeNull();
  });

  it('menerima Instagram reel', () => {
    const result = getVideoEmbed('https://www.instagram.com/p/Cy7xYzWJYmX/');
    expect(result).not.toBeNull();
    expect(result?.provider).toBe('instagram');
    expect(result?.embedUrl).toBe('https://www.instagram.com/p/Cy7xYzWJYmX/embed/');
  });

  it('menerima Instagram p', () => {
    const result = getVideoEmbed('https://www.instagram.com/p/Cy7xYzWJYmX/');
    expect(result).not.toBeNull();
    expect(result?.aspectRatio).toBe('4 / 5');
  });

  it('menerima Instagram tv', () => {
    const result = getVideoEmbed('https://www.instagram.com/tv/Cy7xYzWJYmX/');
    expect(result).not.toBeNull();
    expect(result?.aspectRatio).toBe('16 / 9');
  });

  it('menolak Instagram shortcode terlalu pendek', () => {
    const result = getVideoEmbed('https://www.instagram.com/p/abc/');
    expect(result).toBeNull();
  });

  it('menolak Instagram host asing', () => {
    const result = getVideoEmbed('https://www.youtube.com/@user/video/123');
    expect(result).toBeNull();
  });

  it('menolak TikTok replicate host YAML (contoh: youtube.com.evil.com)', () => {
    const result = getVideoEmbed('https://tiktok.com.evil.com/@user/video/123');
    expect(result).toBeNull();
  });
});

describe('isDirectVideoFileUrl', () => {
  it('menerima .mp4', () => {
    expect(isDirectVideoFileUrl('https://cdn.example.com/video.mp4')).toBe(true);
  });

  it('menerima .m4v', () => {
    expect(isDirectVideoFileUrl('https://cdn.example.com/video.m4v')).toBe(true);
  });

  it('menerima .webm', () => {
    expect(isDirectVideoFileUrl('https://cdn.example.com/video.webm')).toBe(true);
  });

  it('menerima .ogv', () => {
    expect(isDirectVideoFileUrl('https://cdn.example.com/video.ogv')).toBe(true);
  });

  it('menerima .ogg', () => {
    expect(isDirectVideoFileUrl('https://cdn.example.com/video.ogg')).toBe(true);
  });

  it('menerima .mov', () => {
    expect(isDirectVideoFileUrl('https://cdn.example.com/video.mov')).toBe(true);
  });

  it('menolak .txt', () => {
    expect(isDirectVideoFileUrl('https://cdn.example.com/video.txt')).toBe(false);
  });

  it('menolak URL tanpa ekstensi', () => {
    expect(isDirectVideoFileUrl('https://cdn.example.com/video')).toBe(false);
  });

  it('menerima isSupportedVideoSource untuk host YouTube', () => {
    expect(isSupportedVideoSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
  });

  it('menerima isSupportedVideoSource untuk berkas .mp4 di host upload', () => {
    expect(isSupportedVideoSource('https://media.contoh.test/video.mp4')).toBe(true);
  });

  it('menolak isSupportedVideoSource untuk file dari host asing', () => {
    expect(isSupportedVideoSource('https://evil.com/video.mp4')).toBe(false);
  });
});
