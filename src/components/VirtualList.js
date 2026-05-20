'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Fixed-row-height virtual list. Renders only the rows in (and near) the
 * viewport, so it stays smooth with tens of thousands of lines.
 *
 * Props:
 *  - count: total number of rows
 *  - rowHeight: px height of each row (must be constant)
 *  - renderRow: (index) => ReactNode  (the node should be exactly rowHeight tall)
 *  - contentWidth: optional inner width (px) to enable stable horizontal scroll
 *  - overscan: extra rows above/below the viewport
 */
export default function VirtualList({ count, rowHeight, renderRow, contentWidth, overscan = 14, className }) {
  const ref = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(420);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setViewport(el.clientHeight || 420);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect?.height;
      if (h) setViewport(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reset scroll to top when the dataset changes shape dramatically.
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
    setScrollTop(0);
  }, [count]);

  const onScroll = useCallback((e) => setScrollTop(e.currentTarget.scrollTop), []);

  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(count, Math.ceil((scrollTop + viewport) / rowHeight) + overscan);

  const rows = [];
  for (let i = start; i < end; i++) rows.push(renderRow(i));

  return (
    <div ref={ref} onScroll={onScroll} className={className} style={{ overflow: 'auto', position: 'relative' }}>
      <div style={{ height: count * rowHeight, width: contentWidth || '100%', position: 'relative' }}>
        <div style={{ position: 'absolute', top: start * rowHeight, left: 0, width: contentWidth || '100%' }}>
          {rows}
        </div>
      </div>
    </div>
  );
}
