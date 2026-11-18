import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

type Tone = 'brand' | 'amber' | 'ink';

const TONE_STYLES: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-700',
  amber: 'bg-accent-100 text-accent-700',
  ink: 'bg-ink-100 text-ink-600',
};

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  icon: LucideIcon;
  tone?: Tone;
  href?: string;
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'brand', href }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-ink-600">{label}</p>
        <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${TONE_STYLES[tone]}`}>
          <Icon aria-hidden className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl leading-none font-bold tracking-tight text-ink-900 tabular-nums">
        {value}
      </p>
      {hint ? <p className="mt-2 text-[11px] leading-relaxed text-ink-600">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="card-lift group relative rounded-2xl border border-ink-200/80 bg-white p-4 shadow-soft hover:border-brand-200"
      >
        {body}
        <ArrowUpRight
          aria-hidden
          className="absolute right-3 bottom-3 size-3.5 text-ink-300 transition group-hover:text-brand-600"
        />
      </Link>
    );
  }

  return <div className="rounded-2xl border border-ink-200/80 bg-white p-4 shadow-soft">{body}</div>;
}
