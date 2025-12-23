"use client";
import { useColorToggle } from "@/context/ColorToggleContext";
import { useEffect } from "react";

export default function ThemeCSSVariablesUpdater() {
  const { color, color1, color2 } = useColorToggle();

  useEffect(() => {
    const style = document.documentElement.style;
    style.setProperty("--theme-color", color);
    style.setProperty("--theme-color-1", color1);
    style.setProperty("--theme-color-2", color2);
  }, [color, color1, color2]);

  return null;
}

