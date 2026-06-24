"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { themeColorsAt } from "@/lib/themeCycle";

// The color cycle is driven by CSS — `@keyframes themeCycle` on :root in
// globals.css — EXCEPT on Apple WebKit (desktop Safari + every iOS browser),
// which leaks engine memory on the 60fps CSS @property animation. There this
// provider stops the CSS animation and drives the same colors from a low-fps
// (default 15fps) JS loop: ~4x fewer whole-page recomputes, so the leak builds
// ~4x slower. Chrome/Firefox keep the smooth 60fps CSS animation untouched.

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

    // Apple WebKit -> drive the colors from a low-fps JS loop instead of the
    // leaky 60fps CSS animation. Override with ?js=1 (force JS, e.g. to test on
    // Chrome) or ?js=0 (force CSS). ?fps=<n> sets the rate (default 15). ?fast
    // speeds the cycle up ~16x so a leak shows quickly during testing.
    const isAppleWebKit =
      typeof navigator !== "undefined" &&
      navigator.vendor === "Apple Computer, Inc.";
    const useJs =
      params.get("js") === "1" || (isAppleWebKit && params.get("js") !== "0");

    if (useJs) {
      root.dataset.themeJs = "true"; // globals.css stops the CSS animation
      const fps = Number(params.get("fps")) || 15;
      const tickMs = 1000 / fps;
      const speed = params.has("fast") ? 16 : 1;

      let last = "";
      const apply = () => {
        const c = themeColorsAt(performance.now() * speed);
        const key = `${c.color}|${c.color1}|${c.color2}`;
        if (key === last) return; // unchanged -> no write -> no style recalc
        last = key;
        root.style.setProperty("--theme-color", c.color);
        root.style.setProperty("--theme-color-1", c.color1);
        root.style.setProperty("--theme-color-2", c.color2);
      };

      apply();
      let interval: ReturnType<typeof setInterval> | null = setInterval(apply, tickMs);
      const onVisible = () => {
        if (document.hidden) {
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
        } else if (!interval) {
          interval = setInterval(apply, tickMs);
        }
      };
      document.addEventListener("visibilitychange", onVisible);

      return () => {
        if (interval) clearInterval(interval);
        document.removeEventListener("visibilitychange", onVisible);
        delete root.dataset.themeJs;
      };
    }

    // SOFT RESET (Safari memory workaround). WebKit accumulates internal memory
    // for the long-running :root color animation and doesn't release it, which
    // grows until iOS reloads the tab. Periodically restarting the animation
    // makes WebKit tear down and rebuild that state, releasing the pile —
    // without reloading the page. We resume at the same phase via a negative
    // animation-delay so there is no visible color jump.
    //
    // DISABLED BY DEFAULT. Testing showed restarting the animation does NOT free
    // the engine memory — it allocates fresh state on top of the old, making the
    // crash happen FASTER. Kept behind an explicit ?reset=<seconds> opt-in only
    // for further experiments. Must match @keyframes themeCycle (40s).
    const CYCLE_MS = 40000;
    const resetSec = params.has("reset") ? Number(params.get("reset")) : 0;
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
