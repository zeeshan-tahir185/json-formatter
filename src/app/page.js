'use client';

import { useState } from 'react';
import FormatValidate from '@/components/FormatValidate';
import Compare from '@/components/Compare';
import Toaster from '@/components/Toaster';
import { IconSun, IconMoon, IconFormat, IconCompare, IconBraces, IconShield } from '@/components/Icons';
import { IconButton, cx } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';

const TABS = [
  { id: 'format', label: 'Format & Validate', icon: IconFormat },
  { id: 'compare', label: 'Compare', icon: IconCompare },
];

export default function Home() {
  const [tab, setTab] = useState('format');
  const { theme, toggle, mounted } = useTheme();

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-line bg-bg/75 backdrop-blur-md">
        {/* hairline of accent at the very top edge */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
        <div className="mx-auto flex w-full max-w-[1600px] items-center gap-4 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-glow">
              <IconBraces className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <h1 className="text-[15px] font-semibold tracking-tight text-ink">
                JSON Formatter <span className="font-normal text-ink-subtle">/</span> Validator
              </h1>
              <p className="hidden items-center gap-1.5 text-[11px] text-ink-subtle sm:flex">
                <IconShield className="h-3 w-3 text-accent" />
                Runs entirely in your browser — nothing is ever uploaded
              </p>
            </div>
          </div>

          {/* Tabs */}
          <nav className="mx-auto flex items-center gap-1 rounded-xl border border-line bg-surface-2 p-1 shadow-card">
            {TABS.map((t) => {
              const Icon = t.icon;
              const activeTab = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cx(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150',
                    activeTab
                      ? 'bg-surface text-ink shadow-card ring-1 ring-line'
                      : 'text-ink-muted hover:text-ink'
                  )}
                  aria-current={activeTab ? 'page' : undefined}
                >
                  <Icon className={cx('h-4 w-4', activeTab ? 'text-accent' : '')} />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </nav>

          <IconButton label="Toggle dark mode" onClick={toggle}>
            {mounted && theme === 'dark' ? <IconSun className="h-5 w-5" /> : <IconMoon className="h-5 w-5" />}
          </IconButton>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto flex w-full max-w-[1600px] min-h-0 flex-1 flex-col px-4 py-4">
        <div className={cx('min-h-0 flex-1', tab === 'format' ? 'flex flex-col animate-rise' : 'hidden')}>
          <FormatValidate active={tab === 'format'} />
        </div>
        <div className={cx('min-h-0 flex-1', tab === 'compare' ? 'flex flex-col animate-rise' : 'hidden')}>
          <Compare />
        </div>
      </main>

      <Toaster />
    </div>
  );
}
