"use client";

import React from "react";
import { useColorToggle } from "@/context/ColorToggleContext";

export function ColorProvider({ children }: { children: React.ReactNode }) {
  const { color, color1, color2 } = useColorToggle();

  return (
    <div
      className="colorProviderWrapper"
      style={
        {
          "--theme-color": color,
          "--theme-color-1": color1,
          "--theme-color-2": color2,
          transition: "--theme-color 5s ease, --theme-color-1 5s ease, --theme-color-2 5s ease",
        } as React.CSSProperties & { [key: string]: string }
      }
    >
      {children}
    </div>
  );
}
