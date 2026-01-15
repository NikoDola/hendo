"use client";

import { createContext, useContext, useEffect, useRef, ReactNode } from "react";

// Color pairs for cycling
const gradientPairs = [
  { color1: "hsl(220, 100%, 50%)", color2: "hsl(120, 100%, 50%)", solid: "hsl(220, 100%, 50%)" },
  { color1: "hsl(30, 100%, 55%)", color2: "hsl(0, 100%, 60%)", solid: "hsl(30, 100%, 55%)" },
  { color1: "hsl(320, 100%, 55%)", color2: "hsl(270, 100%, 60%)", solid: "hsl(320, 100%, 55%)" },
  { color1: "hsl(190, 100%, 50%)", color2: "hsl(140, 100%, 50%)", solid: "hsl(190, 100%, 50%)" },
  { color1: "hsl(240, 100%, 55%)", color2: "hsl(320, 100%, 60%)", solid: "hsl(240, 100%, 55%)" },
];

// Static context values (we use CSS variables, not React state)
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

// This provider directly updates CSS variables without causing React re-renders
export function ColorToggleProvider({ children }: { children: ReactNode }) {
  const indexRef = useRef(0);

  useEffect(() => {
    // Function to update CSS variables directly on the document
    const updateColors = () => {
      const pair = gradientPairs[indexRef.current];
      const root = document.documentElement;
      root.style.setProperty("--theme-color", pair.solid);
      root.style.setProperty("--theme-color-1", pair.color1);
      root.style.setProperty("--theme-color-2", pair.color2);
      
      // Move to next color
      indexRef.current = (indexRef.current + 1) % gradientPairs.length;
    };

    // Set initial colors
    updateColors();

    // Cycle every 8 seconds (no React state = no re-renders)
    const interval = setInterval(updateColors, 8000);

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

