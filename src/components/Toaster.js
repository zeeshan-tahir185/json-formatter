'use client';

import { useEffect, useState } from 'react';
import { IconCheckCircle, IconAlert } from './Icons';

const TONES = {
  success: 'border-emerald-500/40 bg-surface text-emerald-700 dark:text-emerald-300',
  error: 'border-red-500/40 bg-surface text-red-700 dark:text-red-300',
  info: 'border-line bg-surface text-ink',
};

export default function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    function onToast(e) {
      const t = e.detail;
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 2600);
    }
    window.addEventListener('app-toast', onToast);
    return () => window.removeEventListener('app-toast', onToast);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(92vw,22rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-toast-in pointer-events-auto flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm shadow-pop backdrop-blur ${
            TONES[t.type] || TONES.info
          }`}
        >
          {t.type === 'error' ? (
            <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
          ) : t.type === 'success' ? (
            <IconCheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : null}
          <span className="leading-snug">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
