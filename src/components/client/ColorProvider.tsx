"use client";

import React from "react";
import { useColorToggle } from "@/context/ColorToggleContext";

export function ColorProvider({ children }: { children: React.ReactNode }) {
  const { color } = useColorToggle();

  return (
    <div
      style={
        {
          "--theme-color": color,
          transition: "var(--theme-color) 1s ease"
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
