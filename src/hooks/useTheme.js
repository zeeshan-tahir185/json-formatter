'use client';

import { useCallback, useEffect, useState } from 'react';

const KEY = 'json-tool-theme';

export function useTheme() {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  // Read the persisted/system preference once on mount.
  useEffect(() => {
    let initial = 'light';
    try {
      const saved = localStorage.getItem(KEY);
      initial = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } catch (_) {}
    setTheme(initial);
    setMounted(true);
  }, []);

  // Apply the class to <html> whenever the theme changes.
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme, mounted]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(KEY, next);
      } catch (_) {}
      return next;
    });
  }, []);

  return { theme, toggle, mounted };
}
