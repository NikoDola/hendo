"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// 5 gradient color pairs for text gradients
const gradientPairs = [
  {
    color1: "hsl(220 100% 50%)", // blue
    color2: "hsl(120 100% 50%)", // green
    solid: "hsl(220 100% 50%)"
  },
  {
    color1: "hsl(30 100% 55%)",  // orange
    color2: "hsl(0 100% 60%)",   // red
    solid: "hsl(30 100% 55%)"
  },
  {
    color1: "hsl(320 100% 55%)", // pink
    color2: "hsl(270 100% 60%)", // purple
    solid: "hsl(320 100% 55%)"
  },
  {
    color1: "hsl(190 100% 50%)", // cyan/turquoise
    color2: "hsl(140 100% 50%)", // green
    solid: "hsl(190 100% 50%)"
  },
  {
    color1: "hsl(240 100% 55%)", // royal blue
    color2: "hsl(320 100% 60%)", // pink
    solid: "hsl(240 100% 55%)"
  }
];

interface ColorToggleContextType {
  color: string;
  color1: string;
  color2: string;
  colorIndex: number;
}

const ColorToggleContext = createContext<ColorToggleContextType | undefined>(undefined);

export function ColorToggleProvider({ children }: { children: ReactNode }) {
  const [colorIndex, setColorIndex] = useState(0);

  useEffect(() => {
    // Cycle through all 5 gradient pairs every 8 seconds (5s transition + 3s display)
    const interval = setInterval(() => {
      setColorIndex((prevIndex) => (prevIndex + 1) % gradientPairs.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const value = {
    color: gradientPairs[colorIndex].solid,
    color1: gradientPairs[colorIndex].color1,
    color2: gradientPairs[colorIndex].color2,
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

