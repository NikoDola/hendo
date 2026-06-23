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
    // Safari diagnostic: ?notheme=1 freezes the CSS color cycle by tagging the
    // root. globals.css then applies `animation: none`, pinning pair 0.
    const themeTestDisabled =
      new URLSearchParams(window.location.search).get("notheme") === "1";
    if (!themeTestDisabled) return;

    const root = document.documentElement;
    root.dataset.staticThemeTest = "true";
    return () => {
      delete root.dataset.staticThemeTest;
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
