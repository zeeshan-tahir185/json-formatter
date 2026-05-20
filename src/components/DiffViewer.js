'use client';

import { useMemo } from 'react';
import VirtualList from './VirtualList';
import { Badge } from './ui';
import { IconCheckCircle } from './Icons';

const ROW_HEIGHT = 22;
const CHAR_W = 7.8;
const GUTTER = 46;
const SIGN = 16;

// Returns { bg, gutterBg, sign, emphasis } for one side of a row.
// Colours are alpha-based so they read correctly in both themes.
function sideStyle(rowType, side) {
  const isLeft = side === 'left';
  // For changed rows, left = deletion, right = addition.
  if (rowType === 'equal') return { bg: '', gutterBg: 'bg-surface-2', sign: '', emphasis: '' };
  if (rowType === 'removed')
    return isLeft
      ? { bg: 'bg-red-500/10', gutterBg: 'bg-red-500/15', sign: '-', signClass: 'text-red-500', emphasis: '' }
      : { filler: true };
  if (rowType === 'added')
    return isLeft
      ? { filler: true }
      : { bg: 'bg-emerald-500/10', gutterBg: 'bg-emerald-500/15', sign: '+', signClass: 'text-emerald-600 dark:text-emerald-400', emphasis: '' };
  // changed
  return isLeft
    ? { bg: 'bg-red-500/10', gutterBg: 'bg-red-500/15', sign: '-', signClass: 'text-red-500', emphasis: 'bg-red-500/25' }
    : { bg: 'bg-emerald-500/10', gutterBg: 'bg-emerald-500/15', sign: '+', signClass: 'text-emerald-600 dark:text-emerald-400', emphasis: 'bg-emerald-500/25' };
}

function Cell({ cell, no, rowType, side, cellWidth, textWidth }) {
  const s = sideStyle(rowType, side);
  if (s.filler) {
    return (
      <div
        className="flex items-stretch bg-surface-2/50"
        style={{ width: cellWidth }}
      >
        <span className="shrink-0 border-r border-line" style={{ width: GUTTER }} />
        <span style={{ width: SIGN }} />
      </div>
    );
  }
  return (
    <div className={`flex items-stretch ${s.bg}`} style={{ width: cellWidth }}>
      <span
        className={`shrink-0 select-none border-r border-line px-1 text-right text-[11px] leading-[22px] text-ink-subtle ${s.gutterBg}`}
        style={{ width: GUTTER }}
      >
        {no ?? ''}
      </span>
      <span className={`shrink-0 select-none text-center leading-[22px] ${s.signClass || 'text-ink-subtle/60'}`} style={{ width: SIGN }}>
        {s.sign || ''}
      </span>
      <span className="leading-[22px] text-ink" style={{ whiteSpace: 'pre', width: textWidth }}>
        {s.emphasis ? <span className={`rounded-sm ${s.emphasis}`}>{cell ? cell.text : ''}</span> : cell ? cell.text : ''}
      </span>
    </div>
  );
}

export default function DiffViewer({ result, leftLabel, rightLabel }) {
  const { rows, summary, identical } = result;

  const { textWidth, cellWidth, contentWidth } = useMemo(() => {
    let maxLen = 0;
    for (const r of rows) {
      if (r.l && r.l.text.length > maxLen) maxLen = r.l.text.length;
      if (r.r && r.r.text.length > maxLen) maxLen = r.r.text.length;
    }
    const tw = Math.max(160, Math.ceil(maxLen * CHAR_W) + 16);
    const cw = GUTTER + SIGN + tw;
    return { textWidth: tw, cellWidth: cw, contentWidth: cw * 2 };
  }, [rows]);

  const renderRow = (i) => {
    const row = rows[i];
    return (
      <div key={i} className="code-surface flex" style={{ height: ROW_HEIGHT, width: contentWidth }}>
        <Cell cell={row.l} no={row.leftNo} rowType={row.type} side="left" cellWidth={cellWidth} textWidth={textWidth} />
        <div className="w-px shrink-0 bg-line" />
        <Cell cell={row.r} no={row.rightNo} rowType={row.type} side="right" cellWidth={cellWidth} textWidth={textWidth} />
      </div>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-card">
      {/* Summary header */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-line px-3 py-2 text-sm">
        {identical ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
            <IconCheckCircle className="h-4 w-4" /> The two inputs are identical.
          </span>
        ) : (
          <>
            <span className="font-medium text-ink-muted">Differences</span>
            <Badge tone="green">+{summary.added} added</Badge>
            <Badge tone="red">−{summary.removed} removed</Badge>
            <Badge tone="amber">~{summary.changed} changed</Badge>
          </>
        )}
      </div>

      {/* Column labels */}
      <div className="flex border-b border-line bg-surface-2 text-xs font-medium text-ink-subtle">
        <div className="flex-1 px-3 py-1.5">{leftLabel || 'Original'}</div>
        <div className="w-px bg-line" />
        <div className="flex-1 px-3 py-1.5">{rightLabel || 'Changed'}</div>
      </div>

      <VirtualList
        className="min-h-0 flex-1"
        count={rows.length}
        rowHeight={ROW_HEIGHT}
        contentWidth={contentWidth}
        renderRow={renderRow}
      />
    </div>
  );
}
