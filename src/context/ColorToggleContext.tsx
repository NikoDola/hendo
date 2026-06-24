"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";

// The color cycle itself is now driven entirely by CSS — `@keyframes themeCycle`
// on :root in globals.css (mirrored in JS by src/lib/themeCycle.ts for canvas
// consumers). This provider no longer runs any setInterval / setProperty loop;
// it only exposes the CSS-variable references for components that read them and
// wires up the ?notheme=1 diagnostic freeze.

// Static context values — these are live CSS variable references, so consumers
// always get the current animated color.
const staticColors = {
  color: "var(--theme-color)",
  color1: "var(--theme-color-1)",
  color2: "var(--theme-color-2)",
  colorIndex: 0,
};

interface ColorToggleContextType {
  color: string;
  color1: string;
  color2: string;
  colorIndex: number;
}

const ColorToggleContext = createContext<ColorToggleContextType | undefined>(undefined);

export function ColorToggleProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const root = document.documentElement;

    // Safari diagnostic: ?notheme=1 freezes the CSS color cycle by tagging the
    // root. globals.css then applies `animation: none`, pinning pair 0.
    if (params.get("notheme") === "1") {
      root.dataset.staticThemeTest = "true";
      return () => {
        delete root.dataset.staticThemeTest;
      };
    }

    // SOFT RESET (Safari memory workaround). WebKit accumulates internal memory
    // for the long-running :root color animation and doesn't release it, which
    // grows until iOS reloads the tab. Periodically restarting the animation
    // makes WebKit tear down and rebuild that state, releasing the pile —
    // without reloading the page. We resume at the same phase via a negative
    // animation-delay so there is no visible color jump.
    //
    // Interval is 120s by default; override with ?reset=<seconds> for faster
    // testing (?reset=0 disables it). Must match @keyframes themeCycle (40s).
    const CYCLE_MS = 40000;
    const resetSec = params.has("reset") ? Number(params.get("reset")) : 120;
    if (!Number.isFinite(resetSec) || resetSec <= 0) return;

    const start = performance.now();
    const interval = setInterval(() => {
      const phaseMs = (performance.now() - start) % CYCLE_MS;
      // Restart the animation in a single frame (none -> reflow -> on) so the
      // intermediate "stopped" state is never painted (no flicker).
      root.style.animation = "none";
      void root.offsetWidth; // force the browser to register the stop
      root.style.animation = ""; // fall back to the stylesheet animation
      root.style.animationDelay = `-${(phaseMs / 1000).toFixed(3)}s`;

      // Persist a counter so the ?debug overlay can confirm it's firing on iOS
      // (where there's no console).
      try {
        const n = (Number(localStorage.getItem("themeSoftResets")) || 0) + 1;
        localStorage.setItem("themeSoftResets", String(n));
      } catch {
        /* ignore */
      }
    }, resetSec * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ColorToggleContext.Provider value={staticColors}>
      {children}
    </ColorToggleContext.Provider>
  );
}

export function useColorToggle() {
  const context = useContext(ColorToggleContext);
  if (context === undefined) {
    throw new Error("useColorToggle must be used within a ColorToggleProvider");
  }
  return context;
}
