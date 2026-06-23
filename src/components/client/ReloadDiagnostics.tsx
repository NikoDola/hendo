'use client';

import { useEffect, useState } from 'react';

// Lightweight reload/crash logger. It persists a small record across page loads
// so that after the page reloads "on its own" we can tell WHY:
//
//  - If the previous load did NOT shut down cleanly (no pagehide/beforeunload)
//    and this load is a "reload" with no JS error => the browser killed the tab
//    (Safari memory crash). This is the "significant memory" reload.
//  - If a JS error / unhandledrejection was captured just before => a script
//    crash triggered it.
//  - If it shut down cleanly => something navigated/reloaded on purpose
//    (e.g. a deploy/version change, or code calling reload).
//
// Add ?debug=1 to the URL to see the readout on screen (works on iOS where
// there's no console). Otherwise it just logs to console and is invisible.

const KEY = 'reloadDiag';

interface DiagRecord {
  loads: number;
  thisLoad: number;
  lastNavType: string;
  prevCleanShutdown: boolean | null;
  prevError: string | null;
  gapMs: number | null;
  cleanShutdown?: boolean;
  lastUnload?: number | null;
  lastError?: string | null;
}

export default function ReloadDiagnostics() {
  const [record, setRecord] = useState<DiagRecord | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const now = Date.now();

    let prev: Partial<DiagRecord> = {};
    try {
      prev = JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch {
      prev = {};
    }

    const navEntry = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    const navType = navEntry?.type ?? 'unknown';

    const current: DiagRecord = {
      loads: (prev.loads || 0) + 1,
      thisLoad: now,
      lastNavType: navType,
      prevCleanShutdown: prev.cleanShutdown ?? null,
      prevError: prev.lastError ?? null,
      gapMs: prev.lastUnload ? now - prev.lastUnload : null,
    };

    // Persist, resetting the "clean shutdown" flag for THIS session.
    const persisted = {
      ...current,
      cleanShutdown: false,
      lastUnload: null,
      lastError: null,
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(persisted));
    } catch {
      /* ignore */
    }

    // Diagnosis line for quick reading.
    // prevCleanShutdown === false means the previous page never fired
    // pagehide/beforeunload — it was killed abruptly. With no JS error that's a
    // WebKit memory/process kill (the navType is irrelevant: iOS Safari labels
    // the page it brings back after a kill as "navigate", not "reload").
    let verdict = 'normal first load';
    if (current.loads > 1) {
      if (current.prevError) {
        verdict = 'JS ERROR before reload';
      } else if (current.prevCleanShutdown === false) {
        verdict = 'BROWSER KILLED TAB (abrupt termination — memory/process crash)';
      } else {
        verdict = 'clean reload/navigation (deploy or code-triggered)';
      }
    }

    // eslint-disable-next-line no-console
    console.log('[ReloadDiag]', verdict, current);
    setRecord({ ...current, lastError: current.prevError });

    const patch = (fields: Partial<DiagRecord>) => {
      try {
        const cur = JSON.parse(localStorage.getItem(KEY) || '{}');
        localStorage.setItem(KEY, JSON.stringify({ ...cur, ...fields }));
      } catch {
        /* ignore */
      }
    };

    const markClean = () => patch({ cleanShutdown: true, lastUnload: Date.now() });
    const onError = (e: ErrorEvent) =>
      patch({ lastError: `${e.message} @ ${e.filename}:${e.lineno}`.slice(0, 300) });
    const onRej = (e: PromiseRejectionEvent) => {
      const reason = (e.reason && (e.reason.message || e.reason)) ?? 'unknown';
      patch({ lastError: `unhandledrejection: ${String(reason)}`.slice(0, 300) });
    };

    window.addEventListener('pagehide', markClean);
    window.addEventListener('beforeunload', markClean);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRej);

    if (typeof window !== 'undefined' && window.location.search.includes('debug')) {
      setShowOverlay(true);
    }

    return () => {
      window.removeEventListener('pagehide', markClean);
      window.removeEventListener('beforeunload', markClean);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRej);
    };
  }, []);

  if (!showOverlay || !record) return null;

  let verdict = 'first load';
  if (record.loads > 1) {
    if (record.prevError) verdict = '⚠️ JS ERROR before last reload';
    else if (record.prevCleanShutdown === false)
      verdict = '💥 BROWSER KILLED TAB (memory/process crash)';
    else verdict = '↻ clean reload (deploy/code)';
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 8,
        left: 8,
        zIndex: 99999,
        maxWidth: '92vw',
        background: 'rgba(0,0,0,0.85)',
        color: '#0f0',
        font: '11px/1.4 monospace',
        padding: '8px 10px',
        border: '1px solid #0f0',
        borderRadius: 6,
        pointerEvents: 'none',
        whiteSpace: 'pre-wrap',
      }}
    >
      {`RELOAD DIAG
verdict: ${verdict}
loads this session: ${record.loads}
nav type: ${record.lastNavType}
prev clean shutdown: ${record.prevCleanShutdown}
gap since last unload: ${record.gapMs ?? '-'} ms
last error: ${record.prevError ?? 'none'}`}
    </div>
  );
}
