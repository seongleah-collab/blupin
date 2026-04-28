'use client';

import { useEffect, useState } from 'react';

function slugDomain(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return slug ? `${slug}.com` : '';
}

export default function CompetitorLogo({
  name,
  domain,
  size = 36,
}: {
  name: string;
  domain?: string;
  size?: number;
}) {
  const guess = (domain && domain.length > 0 ? domain : slugDomain(name)).replace(/^www\./, '');
  const sources = guess
    ? [
        `https://logo.clearbit.com/${guess}`,
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
        className="rounded-lg flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-500 dark:text-neutral-400 shrink-0"
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
      className="rounded-lg object-contain bg-white border border-neutral-200 dark:border-neutral-700 shrink-0 p-1"
    />
  );
}
