"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { themeColorsAt } from "@/lib/themeCycle";

// The color cycle is driven entirely from JS here — a single rAF/interval loop
// writes plain `--theme-color*` custom properties on :root from themeColorsAt().
// We do NOT use a CSS @keyframes animation of registered `@property` <color>
// vars: that leaks engine memory on Apple WebKit (desktop Safari + every iOS
// browser) until iOS reloads the tab. Plain custom-property writes don't carry
// that leak, so the same JS path is safe on every engine.
//
// Default rate: 60fps on Chrome/Firefox (smooth, no leak there), ~24fps on
// Apple WebKit (smooth enough, fewer whole-page recomputes). Overrides for
// testing: ?js=0 disables the cycle, ?fps=<n> sets the rate, ?fast speeds the
// cycle ~16x to surface any residual leak quickly, ?notheme=1 freezes pair 0.

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

    // ?notheme=1 freezes the cycle at pair 0 (the :root defaults) — diagnostic
    // for confirming the color cycle is the cause of a memory issue.
    // ?js=0 also disables the cycle.
    if (params.get("notheme") === "1" || params.get("js") === "0") return;

    const isAppleWebKit =
      typeof navigator !== "undefined" &&
      navigator.vendor === "Apple Computer, Inc.";
    // Lower default rate on Apple WebKit (fewer whole-page recomputes); both
    // paths write plain custom properties, so neither leaks @property state.
    const fps = Number(params.get("fps")) || (isAppleWebKit ? 24 : 60);
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
    };
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
