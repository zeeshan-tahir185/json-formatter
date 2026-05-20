'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import JsonEditor from './JsonEditor';
import DiffViewer from './DiffViewer';
import { Button, Select, cx } from './ui';
import { IconCompare, IconSwap, IconTrash, IconUpload, IconCheckCircle, IconAlert } from './Icons';
import { useJsonWorker } from '@/hooks/useJsonWorker';
import { readFileAsText, notify } from '@/lib/clientUtils';
import { COMPARE_SAMPLES } from '@/lib/samples';

function InlineStatus({ status }) {
  if (!status) return <span className="text-ink-subtle">Awaiting input…</span>;
  if (status.valid)
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
        <IconCheckCircle className="h-3.5 w-3.5" /> Valid
      </span>
    );
  const e = status.error || {};
  return (
    <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
      <IconAlert className="h-3.5 w-3.5" />
      {e.line ? `Invalid — line ${e.line}, col ${e.column}` : 'Invalid'}
      {e.message ? <span className="hidden text-red-500/80 sm:inline">· {e.message}</span> : null}
    </span>
  );
}

function Pane({ title, value, onChange, onUpload, status }) {
  const fileRef = useRef(null);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted">
          <span className="h-2 w-2 rounded-full bg-accent/70" />
          {title}
        </span>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-ink-subtle transition-colors hover:bg-surface-3 hover:text-ink"
        >
          <IconUpload className="h-3.5 w-3.5" /> Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json,text/plain"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files && e.target.files[0];
            e.target.value = '';
            if (f) onUpload(f);
          }}
        />
      </div>
      <JsonEditor value={value} onChange={onChange} ariaLabel={title} placeholder={`Paste ${title} JSON, or drop a .json file…`} />
      <div className="mt-1 px-1 text-xs">
        <InlineStatus status={status} />
      </div>
    </div>
  );
}

export default function Compare() {
  const run = useJsonWorker();
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [leftStatus, setLeftStatus] = useState(null);
  const [rightStatus, setRightStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [ignoreKeyOrder, setIgnoreKeyOrder] = useState(false);
  const [busy, setBusy] = useState(false);
  const [labels, setLabels] = useState({ left: 'Original', right: 'Changed' });

  const compareNow = useCallback(
    async (l, r, opts) => {
      const d = await run('diff', { left: l, right: r, options: { ignoreKeyOrder: opts } });
      setResult(d);
      return d;
    },
    [run]
  );

  const handleCompare = useCallback(async () => {
    if (!left.trim() || !right.trim()) {
      notify('Both sides need JSON to compare.', 'info');
      return;
    }
    setBusy(true);
    try {
      const [lv, rv] = await Promise.all([run('validate', { text: left }), run('validate', { text: right })]);
      setLeftStatus(lv);
      setRightStatus(rv);
      if (!lv.valid || !rv.valid) {
        setResult(null);
        notify('Fix the invalid JSON before comparing.', 'error');
        return;
      }
      const d = await compareNow(left, right, ignoreKeyOrder);
      notify(d.identical ? 'Inputs are identical.' : `Found ${d.summary.added + d.summary.removed + d.summary.changed} difference(s).`, 'success');
    } catch (err) {
      notify('Comparison failed.', 'error');
    } finally {
      setBusy(false);
    }
  }, [left, right, ignoreKeyOrder, run, compareNow]);

  // Re-run the diff when the key-order option changes (if we already have a result).
  useEffect(() => {
    if (result && leftStatus?.valid && rightStatus?.valid) {
      compareNow(left, right, ignoreKeyOrder);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ignoreKeyOrder]);

  const onUpload = useCallback(async (side, file) => {
    try {
      const text = await readFileAsText(file);
      if (side === 'left') {
        setLeft(text);
        setLabels((l) => ({ ...l, left: file.name }));
      } else {
        setRight(text);
        setLabels((l) => ({ ...l, right: file.name }));
      }
      notify(`Loaded ${file.name}`, 'success');
    } catch (_) {
      notify('Could not read that file.', 'error');
    }
  }, []);

  const swap = useCallback(() => {
    setLeft(right);
    setRight(left);
    setLeftStatus(rightStatus);
    setRightStatus(leftStatus);
    setLabels((l) => ({ left: l.right, right: l.left }));
    setResult(null);
  }, [left, right, leftStatus, rightStatus]);

  const clear = useCallback(() => {
    setLeft('');
    setRight('');
    setLeftStatus(null);
    setRightStatus(null);
    setResult(null);
    setLabels({ left: 'Original', right: 'Changed' });
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" icon={IconCompare} onClick={handleCompare} disabled={busy}>
          {busy ? 'Comparing…' : 'Compare'}
        </Button>
        <label className="inline-flex cursor-pointer select-none items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink-muted shadow-card transition-colors hover:text-ink">
          <input
            type="checkbox"
            checked={ignoreKeyOrder}
            onChange={(e) => setIgnoreKeyOrder(e.target.checked)}
            className="h-4 w-4 rounded border-line text-accent accent-[rgb(var(--accent))] focus:ring-accent"
          />
          Ignore key order
        </label>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select
            value=""
            onChange={(id) => {
              const s = COMPARE_SAMPLES.find((x) => x.id === id);
              if (s) {
                setLeft(s.left);
                setRight(s.right);
                setLeftStatus(null);
                setRightStatus(null);
                setResult(null);
                setLabels({ left: s.leftName, right: s.rightName });
              }
            }}
            options={[{ value: '', label: 'Load sample pair…' }, ...COMPARE_SAMPLES.map((s) => ({ value: s.id, label: s.label }))]}
          />
          <Button icon={IconSwap} onClick={swap} disabled={!left && !right}>
            Swap
          </Button>
          <Button variant="danger" icon={IconTrash} onClick={clear} disabled={!left && !right}>
            Clear
          </Button>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid min-h-[220px] grid-cols-1 gap-3 md:h-[34vh] md:grid-cols-2">
        <Pane title={labels.left} value={left} onChange={(v) => setLeft(v)} onUpload={(f) => onUpload('left', f)} status={leftStatus} />
        <Pane title={labels.right} value={right} onChange={(v) => setRight(v)} onUpload={(f) => onUpload('right', f)} status={rightStatus} />
      </div>

      {/* Result */}
      <div className="flex min-h-[200px] flex-1 flex-col">
        {result ? (
          <DiffViewer result={result} leftLabel={labels.left} rightLabel={labels.right} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-surface/50 p-6 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-ink-subtle ring-1 ring-line">
              <IconCompare className="h-5 w-5" />
            </span>
            <p className="max-w-sm text-sm text-ink-subtle">
              Paste or load JSON on both sides, then press{' '}
              <span className="font-medium text-accent">Compare</span> to see a side-by-side diff.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
