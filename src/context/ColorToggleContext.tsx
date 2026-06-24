"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { themeColorsAt, setSlotMs, SLOT_MS } from "@/lib/themeCycle";

// The color cycle is driven here by a throttled JS loop that writes plain
// --theme-color* variables to :root. We do NOT use a CSS @property animation:
// on iOS Safari a long-running registered-property animation leaks engine
// memory until the tab reloads ("significant memory"). Writing a plain variable
// a few times per second (only during the cross-fades) has no persistent
// animation state to accumulate, and idles completely during the holds.
//
// This provider only exposes the CSS-variable references for components that
// read them; the actual colors live on :root.

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

    const apply = (c: { color: string; color1: string; color2: string }) => {
      root.style.setProperty("--theme-color", c.color);
      root.style.setProperty("--theme-color-1", c.color1);
      root.style.setProperty("--theme-color-2", c.color2);
    };

    // ?notheme=1 freezes the cycle on pair 0 (Safari isolation test).
    if (params.get("notheme") === "1") {
      root.dataset.staticThemeTest = "true";
      apply(themeColorsAt(0));
      return () => {
        delete root.dataset.staticThemeTest;
      };
    }

    // ?fast stress test: shorten the cycle and write at full rate so any leak
    // shows in minutes instead of half an hour. ?fast or ?fast=1 => aggressive
    // (0.5s/pair, ~60 writes/sec). ?fast=<sec> sets seconds per pair. Off by
    // default for real visitors.
    let tickMs = 100; // ~10 writes/sec during fades is smooth to the eye
    if (params.has("fast")) {
      const raw = Number(params.get("fast"));
      const slotSec = Number.isFinite(raw) && raw > 1 ? raw : 0.5;
      setSlotMs(slotSec * 1000);
      tickMs = 16; // ~60 writes/sec — maximum stress
    } else {
      setSlotMs(SLOT_MS);
    }

    // Write only when the color actually changes: the loop idles (no setProperty,
    // so no style recalc) during the holds, and updates during the fades.
    let last = "";
    const tick = () => {
      const c = themeColorsAt(performance.now());
      const key = `${c.color}|${c.color1}|${c.color2}`;
      if (key !== last) {
        last = key;
        apply(c);
      }
    };
    tick();
    const interval = setInterval(tick, tickMs);

    // Catch up immediately when returning to a backgrounded tab.
    const onVisible = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
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
