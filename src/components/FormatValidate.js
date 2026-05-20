'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import JsonEditor from './JsonEditor';
import TreeView from './TreeView';
import StatusPanel from './StatusPanel';
import { Button, Select, cx } from './ui';
import {
  IconFormat,
  IconMinify,
  IconCheck,
  IconCode,
  IconTree,
  IconCopy,
  IconDownload,
  IconUpload,
  IconTrash,
} from './Icons';
import { useJsonWorker } from '@/hooks/useJsonWorker';
import { copyToClipboard, downloadText, notify } from '@/lib/clientUtils';
import { FORMAT_SAMPLES } from '@/lib/samples';

const INDENT_OPTIONS = [
  { value: '2', label: '2 spaces' },
  { value: '4', label: '4 spaces' },
  { value: 'tab', label: 'Tabs' },
];

export default function FormatValidate({ active }) {
  const run = useJsonWorker();
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState('2');
  const [view, setView] = useState('text'); // 'text' | 'tree'
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const fileRef = useRef(null);
  const debounceRef = useRef(null);

  const validate = useCallback(
    async (text) => {
      try {
        const result = await run('validate', { text });
        setStatus(result);
        return result;
      } catch (err) {
        setStatus({ valid: false, error: { message: err.message || 'Invalid JSON.' }, warnings: [] });
        return null;
      }
    },
    [run]
  );

  // Live, debounced validation as the user types.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!input.trim()) {
      setStatus(null);
      return;
    }
    debounceRef.current = setTimeout(() => validate(input), 350);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [input, validate]);

  const handleFormat = useCallback(async () => {
    if (!input.trim()) {
      notify('Nothing to format — the input is empty.', 'info');
      return;
    }
    setBusy(true);
    try {
      const formatted = await run('format', { text: input, indent });
      setInput(formatted);
      await validate(formatted);
      notify('Formatted.', 'success');
    } catch (err) {
      await validate(input);
      notify('Cannot format — the JSON is invalid.', 'error');
    } finally {
      setBusy(false);
    }
  }, [input, indent, run, validate]);

  const handleMinify = useCallback(async () => {
    if (!input.trim()) {
      notify('Nothing to minify — the input is empty.', 'info');
      return;
    }
    setBusy(true);
    try {
      const minified = await run('minify', { text: input });
      setInput(minified);
      await validate(minified);
      notify('Minified.', 'success');
    } catch (err) {
      await validate(input);
      notify('Cannot minify — the JSON is invalid.', 'error');
    } finally {
      setBusy(false);
    }
  }, [input, run, validate]);

  const handleValidate = useCallback(async () => {
    if (!input.trim()) {
      notify('Nothing to validate — the input is empty.', 'info');
      return;
    }
    const result = await validate(input);
    if (result) notify(result.valid ? 'Valid JSON.' : 'Invalid JSON.', result.valid ? 'success' : 'error');
  }, [input, validate]);

  const switchView = useCallback(
    async (next) => {
      setView(next);
      if (next === 'tree' && input.trim()) {
        await validate(input);
      }
    },
    [input, validate]
  );

  const handleCopy = useCallback(async () => {
    if (!input) return;
    const ok = await copyToClipboard(input);
    notify(ok ? 'Copied to clipboard.' : 'Copy failed.', ok ? 'success' : 'error');
  }, [input]);

  const handleDownload = useCallback(() => {
    if (!input) return;
    downloadText('formatted.json', input);
  }, [input]);

  const handleClear = useCallback(() => {
    setInput('');
    setStatus(null);
    setView('text');
  }, []);

  const onFile = useCallback(async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const { readFileAsText } = await import('@/lib/clientUtils');
    try {
      const text = await readFileAsText(file);
      setInput(text);
      notify(`Loaded ${file.name}`, 'success');
    } catch (_) {
      notify('Could not read that file.', 'error');
    }
  }, []);

  // Keyboard shortcuts: Ctrl+Shift+F (format), Ctrl+Shift+M (minify).
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey) || !e.shiftKey) return;
      const k = e.key.toLowerCase();
      if (k === 'f') {
        e.preventDefault();
        handleFormat();
      } else if (k === 'm') {
        e.preventDefault();
        handleMinify();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, handleFormat, handleMinify]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" icon={IconFormat} onClick={handleFormat} disabled={busy} title="Format (Ctrl+Shift+F)">
          Format
        </Button>
        <Button icon={IconMinify} onClick={handleMinify} disabled={busy} title="Minify (Ctrl+Shift+M)">
          Minify
        </Button>
        <Button icon={IconCheck} onClick={handleValidate} disabled={busy}>
          Validate
        </Button>
        <Select label="Indent" value={indent} onChange={setIndent} options={INDENT_OPTIONS} />

        {/* View toggle */}
        <div className="ml-1 inline-flex gap-1 rounded-lg border border-line bg-surface-2 p-1 shadow-card">
          <button
            type="button"
            onClick={() => switchView('text')}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-all duration-150',
              view === 'text'
                ? 'bg-surface text-ink shadow-card ring-1 ring-line'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            <IconCode className={cx('h-4 w-4', view === 'text' ? 'text-accent' : '')} /> Text
          </button>
          <button
            type="button"
            onClick={() => switchView('tree')}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-all duration-150',
              view === 'tree'
                ? 'bg-surface text-ink shadow-card ring-1 ring-line'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            <IconTree className={cx('h-4 w-4', view === 'tree' ? 'text-accent' : '')} /> Tree
          </button>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select
            value=""
            onChange={(id) => {
              const s = FORMAT_SAMPLES.find((x) => x.id === id);
              if (s) {
                setInput(s.value);
                setView('text');
              }
            }}
            options={[{ value: '', label: 'Load sample…' }, ...FORMAT_SAMPLES.map((s) => ({ value: s.id, label: s.label }))]}
          />
          <Button icon={IconUpload} onClick={() => fileRef.current?.click()}>
            Upload
          </Button>
          <Button icon={IconCopy} onClick={handleCopy} disabled={!input}>
            Copy
          </Button>
          <Button icon={IconDownload} onClick={handleDownload} disabled={!input}>
            Download
          </Button>
          <Button variant="danger" icon={IconTrash} onClick={handleClear} disabled={!input}>
            Clear
          </Button>
          <input ref={fileRef} type="file" accept=".json,application/json,text/plain" className="hidden" onChange={onFile} />
        </div>
      </div>

      {/* Editor / Tree */}
      <div className="flex min-h-0 flex-1 flex-col">
        {view === 'text' ? (
          <JsonEditor
            value={input}
            onChange={setInput}
            onCursor={setCursor}
            ariaLabel="JSON input"
            placeholder={'Paste or type JSON here, drop a .json file, or load a sample…\n\nShortcuts:  Ctrl+Shift+F to format   •   Ctrl+Shift+M to minify'}
          />
        ) : (
          <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-line bg-surface shadow-card">
            {status && status.valid ? (
              <TreeView value={status.value} className="flex-1" />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-ink-subtle ring-1 ring-line">
                  <IconTree className="h-5 w-5" />
                </span>
                <p className="max-w-xs text-sm text-ink-subtle">
                  {input.trim()
                    ? 'Tree view is unavailable — fix the JSON errors shown below to explore it.'
                    : 'Paste some JSON to explore it as an interactive, collapsible tree.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="rounded-xl border border-line bg-surface shadow-card">
        <StatusPanel status={status} cursor={view === 'text' ? cursor : null} />
      </div>
    </div>
  );
}
