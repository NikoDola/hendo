"use client";

import React, { useEffect, useState } from "react";

const palette = [
  ["#0000ff", "#00ff00"], // blue → green
  ["#ff0000", "#8000ff"], // red → purple
  ["#ffff00", "#000000"], // yellow → black
  ["#00ff00", "#ff00ff"], // neon green → magenta
  ["#ff6600", "#0066ff"], // orange → blue
  ["#00ffff", "#ff0000"], // cyan → red
  ["#ffffff", "#ff00ff"]  // white → magenta
];

export function ColorProvider({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % palette.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const [color1, color2] = palette[index];

  return (
    <div
      style={{
        "--theme-color-1": color1,
        "--theme-color-2": color2
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
