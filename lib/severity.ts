// shared severity scale used across feed, chat, and competitor pages so
// the same event always shows the same number. feed renders it
// deterministically from threat_level + relevance_score; chat passes it
// into the system prompt and tells Sonnet to emit [severity:N] using
// this exact number for any listed event.
export function severityFromLevel(
  level: string | null,
  score: number | null
): number {
  const base =
    level === 'high' ? 8 : level === 'medium' ? 5 : level === 'low' ? 3 : 4;
  const bump = score == null ? 0 : Math.round((score - 0.5) * 4);
  return Math.min(10, Math.max(1, base + bump));
}

export function severityHue(n: number): number {
  const clamped = Math.max(1, Math.min(10, n));
  return 50 - ((clamped - 1) * 50) / 9;
}

export function severityLabel(n: number): 'high' | 'medium' | 'low' {
  if (n >= 7) return 'high';
  if (n >= 4) return 'medium';
  return 'low';
}
