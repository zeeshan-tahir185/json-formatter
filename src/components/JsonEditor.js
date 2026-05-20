'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { readFileAsText, MAX_BYTES, notify } from '@/lib/clientUtils';

/**
 * A clean, fast textarea editor with a synced line-number gutter, drag & drop
 * file loading, and cursor position reporting. The gutter is a single <pre>
 * node (one big string) so it scales to very large files without creating
 * thousands of DOM elements.
 */
export default function JsonEditor({ value, onChange, placeholder, ariaLabel, onCursor }) {
  const taRef = useRef(null);
  const gutterRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const lineCount = useMemo(() => {
    if (!value) return 1;
    let n = 1;
    for (let i = 0; i < value.length; i++) if (value[i] === '\n') n++;
    return n;
  }, [value]);

  const gutterText = useMemo(() => {
    // Cap the rendered numbers for absurdly large inputs to keep the string small.
    const max = Math.min(lineCount, 200000);
    let s = '';
    for (let i = 1; i <= max; i++) s += i + '\n';
    return s;
  }, [lineCount]);

  const gutterWidth = Math.max(2, String(lineCount).length) * 9 + 16;

  function syncScroll() {
    if (gutterRef.current && taRef.current) {
      gutterRef.current.scrollTop = taRef.current.scrollTop;
    }
  }

  function reportCursor() {
    if (!onCursor || !taRef.current) return;
    const pos = taRef.current.selectionStart;
    const upto = value.slice(0, pos);
    let line = 1;
    let lastNl = -1;
    for (let i = 0; i < upto.length; i++) {
      if (upto[i] === '\n') {
        line++;
        lastNl = i;
      }
    }
    onCursor({ line, column: pos - lastNl });
  }

  useEffect(() => {
    syncScroll();
  }, [value]);

  async function loadFiles(files) {
    const file = files && files[0];
    if (!file) return;
    if (file.size > MAX_BYTES * 1.05) {
      notify(`"${file.name}" is larger than 1MB and may be slow.`, 'info');
    }
    try {
      const text = await readFileAsText(file);
      onChange(text);
      notify(`Loaded ${file.name}`, 'success');
    } catch (_) {
      notify('Could not read that file.', 'error');
    }
  }

  return (
    <div
      className={`relative flex min-h-0 flex-1 overflow-hidden rounded-xl border bg-surface shadow-card transition-colors ${
        dragOver
          ? 'border-accent ring-2 ring-accent/40'
          : 'border-line'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        loadFiles(e.dataTransfer.files);
      }}
    >
      <pre
        ref={gutterRef}
        aria-hidden="true"
        className="code-surface m-0 select-none overflow-hidden border-r border-line bg-surface-2 px-2 py-3 text-right text-ink-subtle"
        style={{ width: gutterWidth, whiteSpace: 'pre' }}
      >
        {gutterText}
      </pre>
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        onKeyUp={reportCursor}
        onClick={reportCursor}
        onSelect={reportCursor}
        placeholder={placeholder}
        aria-label={ariaLabel}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        wrap="off"
        className="code-surface min-h-0 flex-1 bg-transparent px-3 py-3 text-ink caret-accent outline-none placeholder:text-ink-subtle"
      />
      {dragOver ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-accent/5 text-sm font-medium text-accent">
          Drop a .json file to load
        </div>
      ) : null}
    </div>
  );
}
