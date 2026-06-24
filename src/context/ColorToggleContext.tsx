"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { themeColorsAt, setSlotMs, setLiveSolid, SLOT_MS } from "@/lib/themeCycle";
import { getMusicPlaying, subscribeMusicPlaying } from "@/lib/playbackSignal";

// The color cycle is driven here by a throttled JS loop that writes plain
// --theme-color* variables to :root — only WHILE a song is playing. This gives
// the "galaxy" feel during playback AND fixes the iOS Safari "significant
// memory" self-reload: the whole-page recompute that the color change triggers
// is what WebKit leaks on, so we only pay it during short playback windows and
// freeze (zero cost) when idle. We also avoid a CSS @property animation, which
// leaks engine state of its own.
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

    let last = "";
    const apply = (c: { color: string; color1: string; color2: string }) => {
      const key = `${c.color}|${c.color1}|${c.color2}`;
      if (key === last) return; // unchanged -> skip the write -> no style recalc
      last = key;
      root.style.setProperty("--theme-color", c.color);
      root.style.setProperty("--theme-color-1", c.color1);
      root.style.setProperty("--theme-color-2", c.color2);
      setLiveSolid(c.color); // keep canvas shooting stars in sync
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
    // shows in minutes. ?fast / ?fast=1 => aggressive (0.5s/pair, ~60 writes/s);
    // ?fast=<sec> sets seconds per pair. Off by default for real visitors.
    let tickMs = 100; // ~10 writes/sec during fades is smooth to the eye
    if (params.has("fast")) {
      const raw = Number(params.get("fast"));
      const slotSec = Number.isFinite(raw) && raw > 1 ? raw : 0.5;
      setSlotMs(slotSec * 1000);
      tickMs = 16;
    } else {
      setSlotMs(SLOT_MS);
    }

    // ?fast or ?forceplay=1 run the cycle without needing music (visual / leak
    // testing). Otherwise the cycle only runs while a track is playing.
    const forcePlay = params.has("fast") || params.get("forceplay") === "1";

    // A play-time clock: it only advances while the cycle is running, so pausing
    // the music freezes the color and resuming continues smoothly (no jump).
    let elapsed = 0;
    let lastTs = 0;
    let interval: ReturnType<typeof setInterval> | null = null;

    const startLoop = () => {
      if (interval) return;
      lastTs = performance.now();
      interval = setInterval(() => {
        const now = performance.now();
        elapsed += now - lastTs;
        lastTs = now;
        apply(themeColorsAt(elapsed));
      }, tickMs);
    };
    const stopLoop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      // Leave the last color in place — frozen until playback resumes.
    };

    apply(themeColorsAt(elapsed)); // paint the starting color (pair 0)

    const onPlaying = (p: boolean) => {
      if (p || forcePlay) startLoop();
      else stopLoop();
    };
    const unsubscribe = subscribeMusicPlaying(onPlaying);
    if (getMusicPlaying() || forcePlay) startLoop();

    // Pause the loop when the tab is hidden; resume if still playing.
    const onVisible = () => {
      if (document.hidden) stopLoop();
      else if (getMusicPlaying() || forcePlay) startLoop();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopLoop();
      unsubscribe();
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
