'use client';

import { useMemo, useState, useCallback } from 'react';
import VirtualList from './VirtualList';
import { IconChevron, IconExpand, IconCollapse } from './Icons';

const ROW_HEIGHT = 24;
const INDENT = 16;

function isObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function valueKind(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v; // 'string' | 'number' | 'boolean' | 'object'
}

// Walk the tree once to collect every container path (for "collapse all").
function collectContainerPaths(value) {
  const paths = [];
  const walk = (v, path) => {
    if (isObj(v) || Array.isArray(v)) {
      paths.push(path);
      const entries = Array.isArray(v) ? v.map((x, i) => [i, x]) : Object.entries(v);
      entries.forEach(([k, child]) => walk(child, `${path}/${encodeURIComponent(k)}`));
    }
  };
  walk(value, '$');
  return paths;
}

// Flatten the visible rows given the current collapsed set.
function flatten(root, collapsed) {
  const rows = [];
  let maxLen = 0;
  const walk = (value, depth, key, path, isLast) => {
    const isArray = Array.isArray(value);
    if (isObj(value) || isArray) {
      const entries = isArray ? value.map((v, i) => [i, v]) : Object.entries(value);
      const count = entries.length;
      const isCollapsed = collapsed.has(path) || count === 0;
      rows.push({
        id: path,
        depth,
        key,
        keyIsIndex: key !== null && isArray === false ? false : false,
        kind: isArray ? 'array' : 'object',
        openable: count > 0,
        collapsed: isCollapsed,
        count,
        isLast,
      });
      const approx = depth * 2 + (key != null ? String(key).length + 4 : 0) + 24;
      if (approx > maxLen) maxLen = approx;
      if (!isCollapsed) {
        entries.forEach(([k, child], idx) =>
          walk(child, depth + 1, isArray ? k : k, `${path}/${encodeURIComponent(k)}`, idx === count - 1)
        );
        rows.push({ id: `${path}#close`, depth, kind: isArray ? 'array-close' : 'object-close', isLast });
      }
    } else {
      rows.push({ id: path, depth, key, kind: valueKind(value), value, isLast });
      const approx = depth * 2 + (key != null ? String(key).length + 4 : 0) + String(value).length + 6;
      if (approx > maxLen) maxLen = approx;
    }
  };
  walk(root, 0, null, '$', true);
  return { rows, maxLen };
}

function PrimitiveValue({ kind, value }) {
  if (kind === 'string')
    return <span className="text-emerald-600 dark:text-emerald-400">{JSON.stringify(value)}</span>;
  if (kind === 'number')
    return <span className="text-sky-600 dark:text-sky-400">{String(value)}</span>;
  if (kind === 'boolean')
    return <span className="text-violet-600 dark:text-violet-400">{String(value)}</span>;
  return <span className="text-ink-subtle">null</span>;
}

export default function TreeView({ value, className }) {
  const [collapsed, setCollapsed] = useState(() => new Set());

  const { rows, maxLen } = useMemo(() => flatten(value, collapsed), [value, collapsed]);

  const toggle = useCallback((id) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => setCollapsed(new Set()), []);
  const collapseAll = useCallback(() => {
    setCollapsed(new Set(collectContainerPaths(value)));
  }, [value]);

  const contentWidth = Math.max(320, maxLen * 8 + INDENT * 2);

  const renderRow = (i) => {
    const row = rows[i];
    const pad = 8 + row.depth * INDENT;
    const comma = !row.isLast;

    if (row.kind === 'object-close' || row.kind === 'array-close') {
      return (
        <div key={row.id} className="code-surface flex items-center hover:bg-surface-3/60" style={{ height: ROW_HEIGHT, paddingLeft: pad }}>
          <span className="text-ink-subtle">{row.kind === 'array-close' ? ']' : '}'}</span>
          {comma ? <span className="text-ink-subtle">,</span> : null}
        </div>
      );
    }

    const openable = row.openable;
    const isContainer = row.kind === 'object' || row.kind === 'array';
    const open = isContainer ? '{' : '[';
    const openBracket = row.kind === 'array' ? '[' : '{';
    const closeBracket = row.kind === 'array' ? ']' : '}';

    return (
      <div
        key={row.id}
        className="code-surface group flex items-center hover:bg-surface-3/60"
        style={{ height: ROW_HEIGHT, paddingLeft: pad }}
      >
        {openable ? (
          <button
            type="button"
            onClick={() => toggle(row.id)}
            aria-label={row.collapsed ? 'Expand' : 'Collapse'}
            className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded text-ink-subtle hover:text-ink"
          >
            <IconChevron
              className="h-3.5 w-3.5 transition-transform"
              style={{ transform: row.collapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}
            />
          </button>
        ) : (
          <span className="mr-1 inline-block h-4 w-4" />
        )}

        {row.key !== null && row.key !== undefined ? (
          <>
            <span className="text-ink">{JSON.stringify(String(row.key))}</span>
            <span className="text-ink-subtle">:&nbsp;</span>
          </>
        ) : null}

        {isContainer ? (
          row.collapsed ? (
            <span className="text-ink-muted">
              <span className="text-ink-subtle">{openBracket}</span>
              {row.count > 0 ? (
                <button
                  type="button"
                  onClick={() => toggle(row.id)}
                  className="mx-1 rounded bg-surface-3 px-1 text-xs text-ink-muted transition-colors hover:bg-line-strong/40 hover:text-ink"
                >
                  {row.count} {row.kind === 'array' ? (row.count === 1 ? 'item' : 'items') : row.count === 1 ? 'key' : 'keys'}
                </button>
              ) : null}
              <span className="text-ink-subtle">{closeBracket}</span>
              {comma ? <span className="text-ink-subtle">,</span> : null}
            </span>
          ) : (
            <span className="text-ink-subtle">{openBracket}</span>
          )
        ) : (
          <>
            <PrimitiveValue kind={row.kind} value={row.value} />
            {comma ? <span className="text-ink-subtle">,</span> : null}
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`flex min-h-0 flex-col ${className || ''}`}>
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5 text-xs text-ink-subtle">
        <span className="tabular-nums">{rows.length.toLocaleString()} rows</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={expandAll}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-surface-3 hover:text-ink"
          >
            <IconExpand className="h-3.5 w-3.5" /> Expand all
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-surface-3 hover:text-ink"
          >
            <IconCollapse className="h-3.5 w-3.5" /> Collapse all
          </button>
        </div>
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
