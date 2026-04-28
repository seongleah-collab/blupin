'use client';

import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'blupin-theme';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  root.classList.toggle('dark', isDark);
}

export function useTheme(): {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolved: 'light' | 'dark';
} {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const initial = getStoredTheme();
    setThemeState(initial);
    applyTheme(initial);
    setResolved(document.documentElement.classList.contains('dark') ? 'dark' : 'light');

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const current = getStoredTheme();
      if (current === 'system') {
        applyTheme('system');
        setResolved(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      }
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  function setTheme(next: Theme) {
    window.localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
    applyTheme(next);
    setResolved(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }

  return { theme, setTheme, resolved };
}

export const NO_FLASH_SCRIPT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(!t)t='system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;
