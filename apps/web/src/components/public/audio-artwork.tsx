import { AudioLines } from 'lucide-react';

interface AudioArtworkProps {
  title: string;
  speaker?: string | null;
  compact?: boolean;
  className?: string;
}

/**
 * Artwork pengganti ketika konten audio tidak punya gambar sampul. Dibuat dari
 * pola geometris dan tipografi, bukan gambar stok, supaya tetap konsisten
 * dengan identitas visual WebDakwah.
 */
export function AudioArtwork({
  title,
  speaker,
  compact = false,
  className = '',
}: AudioArtworkProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative isolate overflow-hidden rounded-2xl bg-ink-950 ${className}`}
    >
      <div className="pattern-islamic absolute inset-0 opacity-70" />
      <div className="absolute -top-10 -right-8 size-36 rounded-full bg-accent-500/25 blur-2xl" />
      <div className="absolute -bottom-12 -left-10 size-40 rounded-full bg-brand-500/30 blur-2xl" />

      {compact ? (
        <div className="relative grid h-full w-full place-items-center">
          <AudioLines className="size-5 text-accent-400" />
        </div>
      ) : (
        <div className="relative flex h-full flex-col justify-between p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="grid size-9 place-items-center rounded-xl border border-white/15 bg-white/10 text-accent-300">
              <AudioLines className="size-4" />
            </span>
            <span className="text-[10px] font-semibold tracking-[0.22em] text-white/55">AUDIO</span>
          </div>

          <div>
            <div className="mb-3 flex h-6 items-end gap-1" aria-hidden="true">
              {[10, 18, 12, 22, 16, 24, 14, 20, 9, 17, 13, 21].map((height, index) => (
                <span
                  key={`${height}-${index}`}
                  className="w-1 rounded-full bg-accent-400/70"
                  style={{ height }}
                />
              ))}
            </div>
            <p className="line-clamp-2 text-sm leading-snug font-semibold text-white sm:text-base">
              {title}
            </p>
            {speaker ? <p className="mt-1 truncate text-xs text-white/60">{speaker}</p> : null}
          </div>
        </div>
      )}
    </div>
  );
}
