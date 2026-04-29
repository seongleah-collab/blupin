'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SECTIONS = [
  { href: '/settings/company', label: 'company' },
  { href: '/settings/competitors', label: 'competitors' },
  { href: '/settings/account', label: 'account' },
] as const;

export default function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:sticky lg:top-12 self-start">
      <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible -mx-6 px-6 lg:mx-0 lg:px-0 pb-2 lg:pb-0">
        {SECTIONS.map((s) => {
          const active = pathname === s.href;
          return (
            <li key={s.href} className="shrink-0">
              <Link
                href={s.href}
                className={`block px-3 py-1.5 rounded-md text-[13px] transition-colors ${
                  active
                    ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                }`}
              >
                {s.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
