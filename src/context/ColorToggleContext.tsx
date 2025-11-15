"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// 7 neon colors that will cycle through the app
const colors = [
  "hsl(317 100% 54%)", // neon pink
  "hsl(190 100% 50%)", // neon cyan
  "hsl(120 100% 45%)", // neon green
  "hsl(50 100% 50%)",  // neon yellow
  "hsl(280 100% 60%)", // neon purple
  "hsl(0 100% 60%)",   // neon red
  "hsl(30 100% 55%)"   // neon orange
];

interface ColorToggleContextType {
  color: string;
  colorIndex: number;
}

const ColorToggleContext = createContext<ColorToggleContextType | undefined>(undefined);

export function ColorToggleProvider({ children }: { children: ReactNode }) {
  const [colorIndex, setColorIndex] = useState(0);

  useEffect(() => {
    // Cycle through all 7 colors every 3 seconds
    const interval = setInterval(() => {
      setColorIndex((prevIndex) => (prevIndex + 1) % colors.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const value = {
    color: colors[colorIndex],
    colorIndex,
  };

  return (
    <ColorToggleContext.Provider value={value}>
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

