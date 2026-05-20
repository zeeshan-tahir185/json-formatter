'use client';

// Small shared UI primitives.

export function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

const VARIANTS = {
  primary:
    'bg-accent text-accent-fg shadow-glow hover:bg-accent-hover active:translate-y-px border border-transparent',
  secondary:
    'bg-surface text-ink-muted border border-line shadow-card hover:bg-surface-3 hover:text-ink active:translate-y-px',
  ghost:
    'bg-transparent text-ink-muted border border-transparent hover:bg-surface-3 hover:text-ink',
  danger:
    'bg-transparent text-red-600 border border-transparent hover:bg-red-500/10 dark:text-red-400',
};

export function Button({ variant = 'secondary', className, children, icon: Icon, ...props }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        VARIANTS[variant],
        className
      )}
      {...props}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      {children}
    </button>
  );
}

export function IconButton({ className, children, label, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-muted shadow-card transition-colors hover:bg-surface-3 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'slate', className }) {
  const tones = {
    slate: 'bg-surface-2 text-ink-muted ring-1 ring-inset ring-line',
    accent: 'bg-accent-soft text-accent ring-1 ring-inset ring-accent/30',
    green: 'bg-emerald-500/12 text-emerald-700 ring-1 ring-inset ring-emerald-500/25 dark:text-emerald-300',
    red: 'bg-red-500/12 text-red-700 ring-1 ring-inset ring-red-500/25 dark:text-red-300',
    amber: 'bg-amber-500/12 text-amber-700 ring-1 ring-inset ring-amber-500/25 dark:text-amber-300',
  };
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium tabular-nums',
        tones[tone] || tones.slate,
        className
      )}
    >
      {children}
    </span>
  );
}

/** A labelled <select> styled to match the toolbar. */
export function Select({ value, onChange, options, label, className }) {
  return (
    <label className={cx('inline-flex items-center gap-1.5 text-sm', className)}>
      {label ? <span className="text-ink-subtle">{label}</span> : null}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink-muted shadow-card transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
