'use client';

import { useEffect, useState } from 'react';

const TLD_RE = /\.(com|ai|io|co|app|dev|so|xyz|net|org|tech|cloud|inc|me|fyi)$/i;

function slugDomain(name: string): string {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return '';
  // already looks like a domain (e.g. "fireflies.ai", "notion.so") — use it as-is
  if (TLD_RE.test(trimmed)) {
    return trimmed.replace(/\s+/g, '');
  }
  const slug = trimmed.replace(/[^a-z0-9]/g, '');
  return slug ? `${slug}.com` : '';
}

export default function CompetitorLogo({
  name,
  domain,
  size = 40,
}: {
  name: string;
  domain?: string;
  size?: number;
}) {
  const guess = (domain && domain.length > 0 ? domain : slugDomain(name)).replace(/^www\./, '');
  const sources = guess
    ? [
        `https://logo.clearbit.com/${guess}?size=128`,
        `https://www.google.com/s2/favicons?domain=${guess}&sz=128`,
        `https://icons.duckduckgo.com/ip3/${guess}.ico`,
      ]
    : [];

  const [idx, setIdx] = useState(0);
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();

  useEffect(() => {
    setIdx(0);
  }, [guess]);

  const dim = { width: size, height: size };

  if (sources.length === 0 || idx >= sources.length) {
    return (
      <div
        style={dim}
        className="rounded-lg flex items-center justify-center bg-neutral-900/5 dark:bg-white/10 backdrop-blur-sm border border-neutral-900/10 dark:border-white/15 text-sm font-semibold text-neutral-500 dark:text-neutral-400 shrink-0"
      >
        {initial}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sources[idx]}
      alt=""
      style={dim}
      onError={() => setIdx((i) => i + 1)}
      className="rounded-lg object-contain bg-white/40 dark:bg-white/10 backdrop-blur-sm border border-neutral-900/10 dark:border-white/15 shrink-0"
    />
  );
}
