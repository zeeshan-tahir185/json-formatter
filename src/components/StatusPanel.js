'use client';

import { Badge } from './ui';
import { IconCheckCircle, IconAlert } from './Icons';
import { formatBytes } from '@/lib/jsonTools';

export default function StatusPanel({ status, cursor }) {
  if (!status) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 text-sm text-ink-subtle">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-ink-subtle/60" />
          Ready
        </span>
        {cursor ? (
          <span className="ml-auto tabular-nums text-xs">
            Ln {cursor.line}, Col {cursor.column}
          </span>
        ) : null}
      </div>
    );
  }

  if (status.valid) {
    const s = status.stats || {};
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
          <IconCheckCircle className="h-4 w-4" /> Valid JSON
        </span>
        <span className="flex flex-wrap items-center gap-1.5 text-xs">
          <Badge>{formatBytes(s.bytes || 0)}</Badge>
          <Badge>{(s.lines || 0).toLocaleString()} lines</Badge>
          <Badge>depth {s.maxDepth || 0}</Badge>
          <Badge>{(s.objects || 0).toLocaleString()} objects</Badge>
          <Badge>{(s.arrays || 0).toLocaleString()} arrays</Badge>
          <Badge>{(s.keys || 0).toLocaleString()} keys</Badge>
        </span>
        {status.warnings && status.warnings.length > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <IconAlert className="h-3.5 w-3.5" />
            {status.warnings.length} warning{status.warnings.length > 1 ? 's' : ''}
            {': '}
            {status.warnings[0].message}
          </span>
        ) : null}
        {cursor ? (
          <span className="ml-auto tabular-nums text-xs text-ink-subtle">
            Ln {cursor.line}, Col {cursor.column}
          </span>
        ) : null}
      </div>
    );
  }

  const e = status.error || {};
  return (
    <div className="px-3 py-2 text-sm">
      <div className="flex items-center gap-1.5 font-medium text-red-600 dark:text-red-400">
        <IconAlert className="h-4 w-4 shrink-0" />
        Invalid JSON
        {e.line ? (
          <span className="font-normal text-red-500/90 dark:text-red-300/90">
            — line {e.line}, column {e.column}
          </span>
        ) : null}
      </div>
      <div className="mt-1 text-ink-muted">{e.message}</div>
      {e.snippet ? (
        <pre className="code-surface mt-2 overflow-x-auto rounded-lg border border-red-500/30 bg-red-500/8 p-2 text-xs leading-snug text-red-700 dark:text-red-300">
          {e.snippet}
        </pre>
      ) : null}
    </div>
  );
}
