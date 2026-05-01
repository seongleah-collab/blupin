'use client';

// Tiny dependency-free sparkline. Renders a smooth area chart from a
// series of {day, count} points. Used in the feed expanded view and
// on the /competitor/[name] deep-dive page to show whether a
// competitor's activity is heating up or quiet.

export type SparklinePoint = { day: string; count: number };

export default function Sparkline({
  series,
  height = 36,
  width = 160,
  className,
}: {
  series: SparklinePoint[];
  height?: number;
  width?: number;
  className?: string;
}) {
  if (series.length === 0) return null;
  const max = Math.max(1, ...series.map((p) => p.count));
  const stepX = series.length > 1 ? width / (series.length - 1) : 0;

  const pts = series.map((p, i) => {
    const x = i * stepX;
    const y = height - (p.count / max) * (height - 2) - 1;
    return [x, y] as const;
  });

  const linePath = pts
    .map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`))
    .join(' ');
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  const total = series.reduce((s, p) => s + p.count, 0);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label={`${total} events over the last ${series.length} days`}
    >
      <defs>
        <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkfill)" />
      <path d={linePath} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
