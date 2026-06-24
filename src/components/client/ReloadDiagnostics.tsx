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
//
// MEMORY NOTE: iOS Safari does NOT expose `performance.memory`, so we cannot
// print a real MB number on the iPhone. Instead, while ?debug=1 is on we run a
// 1s heartbeat that persists how long THIS session has been alive. After Safari
// kills the tab there is no unload event, so the last heartbeat value is our
// best proxy for "how far it got before the crash" — for a memory leak that
// time-to-death is consistent and is the most useful signal we can get
// on-device. Where the browser does expose heap (desktop Chrome) we also show
// it. For real MB on the iPhone itself, use a Mac + Safari Web Inspector
// (Develop > Timelines > Memory).

const KEY = 'reloadDiag';
const HEARTBEAT_MS = 1000;

interface HeapInfo {
  used: number;
  limit: number;
}

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
  // Heartbeat fields (persisted ~1x/sec while alive):
  aliveMs?: number; // how long this session has been alive
  heapUsed?: number | null; // last heap reading (bytes), if supported
  heapPeak?: number | null; // peak heap reading (bytes), if supported
  // Carried over from the previous (possibly crashed) session for the readout:
  prevAliveMs?: number | null;
  prevHeapUsed?: number | null;
  prevHeapPeak?: number | null;
}

// performance.memory is non-standard (Chromium only); read it defensively.
function readHeap(): HeapInfo | null {
  const mem = (performance as unknown as {
    memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
  }).memory;
  if (!mem) return null;
  return { used: mem.usedJSHeapSize, limit: mem.jsHeapSizeLimit };
}

const mb = (bytes: number | null | undefined) =>
  bytes == null ? null : Math.round(bytes / 1048576);

const fmtDuration = (ms: number | null | undefined) => {
  if (ms == null) return '-';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export default function ReloadDiagnostics() {
  const [record, setRecord] = useState<DiagRecord | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  // Live values refreshed by the heartbeat (only while the overlay is on).
  const [live, setLive] = useState<{
    uptimeMs: number;
    heap: HeapInfo | null;
    softResets: number;
  }>({
    uptimeMs: 0,
    heap: null,
    softResets: 0,
  });

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
      // Snapshot of how the PREVIOUS session ended (its last heartbeat) — this is
      // our "how far it got before the crash" readout.
      prevAliveMs: prev.aliveMs ?? null,
      prevHeapUsed: prev.heapUsed ?? null,
      prevHeapPeak: prev.heapPeak ?? null,
    };

    // Persist, resetting the per-session flags for THIS load.
    const persisted: DiagRecord = {
      ...current,
      cleanShutdown: false,
      lastUnload: null,
      lastError: null,
      aliveMs: 0,
      heapUsed: readHeap()?.used ?? null,
      heapPeak: readHeap()?.used ?? null,
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(persisted));
    } catch {
      /* ignore */
    }

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

    const debug =
      typeof window !== 'undefined' && window.location.search.includes('debug');

    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let peak = readHeap()?.used ?? 0;

    if (debug) {
      setShowOverlay(true);
      // Heartbeat: record uptime + heap so a later load can show how long this
      // session survived before Safari killed it. Only runs in debug mode, so
      // normal visitors get zero added work.
      heartbeat = setInterval(() => {
        const uptimeMs = Date.now() - now;
        const heap = readHeap();
        if (heap && heap.used > peak) peak = heap.used;
        let softResets = 0;
        try {
          softResets = Number(localStorage.getItem('themeSoftResets')) || 0;
        } catch {
          /* ignore */
        }
        setLive({ uptimeMs, heap, softResets });
        patch({
          aliveMs: uptimeMs,
          heapUsed: heap?.used ?? null,
          heapPeak: heap ? peak : null,
        });
      }, HEARTBEAT_MS);
    }

    return () => {
      window.removeEventListener('pagehide', markClean);
      window.removeEventListener('beforeunload', markClean);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRej);
      if (heartbeat) clearInterval(heartbeat);
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

  const heapNow = live.heap
    ? `${mb(live.heap.used)} / ${mb(live.heap.limit)} MB`
    : 'n/a (Safari hides it — use Mac Web Inspector)';

  // What the previous (likely crashed) session reached before it died.
  const prevLife =
    record.loads > 1
      ? `${fmtDuration(record.prevAliveMs)}${
          record.prevHeapPeak != null ? ` · peak ${mb(record.prevHeapPeak)} MB` : ''
        }`
      : '-';

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
uptime: ${fmtDuration(live.uptimeMs)}
heap now: ${heapNow}
soft resets: ${live.softResets}
prev session lasted: ${prevLife}
nav type: ${record.lastNavType}
gap since last unload: ${record.gapMs ?? '-'} ms
last error: ${record.prevError ?? 'none'}`}
    </div>
  );
}
