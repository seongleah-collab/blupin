'use client';

import { useTheme, type Theme } from '@/lib/theme';

const OPTIONS: Array<{ value: Theme; label: string }> = [
  { value: 'light', label: 'light' },
  { value: 'dark', label: 'dark' },
  { value: 'system', label: 'system' },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="theme"
      className="inline-flex rounded-lg border border-neutral-200 dark:border-neutral-800 p-0.5 bg-neutral-50 dark:bg-neutral-900"
    >
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(opt.value)}
            className={`px-3 py-1.5 text-[12px] rounded-md transition-colors ${
              active
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
