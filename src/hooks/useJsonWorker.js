'use client';

import { useCallback, useEffect, useRef } from 'react';
import { formatJson, minifyJson, validateJson } from '@/lib/jsonTools';
import { buildSideBySideDiff } from '@/lib/diff';

// Same computation as the worker, used as a graceful fallback when Web Workers
// are unavailable (or fail to initialise).
function runOnMainThread(type, payload) {
  switch (type) {
    case 'format':
      return formatJson(payload.text, payload.indent);
    case 'minify':
      return minifyJson(payload.text);
    case 'validate':
      return validateJson(payload.text);
    case 'diff':
      return buildSideBySideDiff(JSON.parse(payload.left), JSON.parse(payload.right), payload.options);
    default:
      throw new Error(`Unknown task: ${type}`);
  }
}

/**
 * Returns a `run(type, payload) => Promise` function backed by a Web Worker
 * (with a transparent main-thread fallback).
 */
export function useJsonWorker() {
  const workerRef = useRef(null);
  const pending = useRef(new Map());
  const idRef = useRef(0);

  useEffect(() => {
    let worker = null;
    try {
      worker = new Worker(new URL('../workers/json.worker.js', import.meta.url));
      worker.onmessage = (e) => {
        const { id, ok, result, error } = e.data;
        const p = pending.current.get(id);
        if (!p) return;
        pending.current.delete(id);
        if (ok) p.resolve(result);
        else p.reject(error);
      };
      worker.onerror = () => {
        // Reject everything in flight; future calls fall back to main thread.
        pending.current.forEach((p) => p.reject({ message: 'Worker error' }));
        pending.current.clear();
        try {
          worker.terminate();
        } catch (_) {}
        workerRef.current = null;
      };
      workerRef.current = worker;
    } catch (_) {
      workerRef.current = null;
    }
    return () => {
      if (worker) {
        try {
          worker.terminate();
        } catch (_) {}
      }
      workerRef.current = null;
      pending.current.clear();
    };
  }, []);

  return useCallback((type, payload) => {
    const worker = workerRef.current;
    if (worker) {
      const id = ++idRef.current;
      return new Promise((resolve, reject) => {
        pending.current.set(id, { resolve, reject });
        worker.postMessage({ id, type, payload });
      });
    }
    return new Promise((resolve, reject) => {
      // Defer so callers can show a "busy" state before a big sync parse.
      setTimeout(() => {
        try {
          resolve(runOnMainThread(type, payload));
        } catch (err) {
          reject({ message: err.message, name: err.name });
        }
      }, 0);
    });
  }, []);
}
