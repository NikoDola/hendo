"use client";
import React, { useState, useEffect } from "react";
import { useColorToggle } from "@/context/ColorToggleContext";
import { gradientPairs, SLOT_MS, THEME_CYCLE_MS } from "@/lib/themeCycle";
import "./ColorSlider.css";

interface ColorSliderProps {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  className?: string;
}

// Internal component that uses the color context
function ColorSliderInner({
  min = 0,
  max = 100,
  step = 1,
  defaultValue = 50,
  onChange,
  className = ""
}: ColorSliderProps) {
  const [value, setValue] = useState(defaultValue);
  // const [isDragging, setIsDragging] = useState(false);
  const [currentColor, setCurrentColor] = useState("hsl(317 100% 54%)");

  // Derive the readout color from the shared time-based cycle (mirrors the CSS
  // `themeCycle` keyframes) instead of polling getComputedStyle every 50ms —
  // that poll forced a synchronous style flush 20×/s. We show the active pair's
  // solid color and switch ~1.2s into each slot, matching the original "update
  // when the glitch starts" timing. This re-renders only ~5×/40s, not 20×/s.
  useEffect(() => {
    let raf = 0;
    let lastIndex = -1;
    const GLITCH_DELAY_MS = 1200;

    const tick = () => {
      const t = performance.now() - GLITCH_DELAY_MS;
      const pos = ((t % THEME_CYCLE_MS) + THEME_CYCLE_MS) % THEME_CYCLE_MS;
      const index = Math.floor(pos / SLOT_MS);
      if (index !== lastIndex) {
        lastIndex = index;
        setCurrentColor(gradientPairs[index].solid);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setValue(newValue);
    onChange?.(newValue);
  };

  // const handleMouseDown = () => setIsDragging(true);
  // const handleMouseUp = () => setIsDragging(false);

  // Calculate the percentage for the fill
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`color-slider-container ${className}`}>
      <div className="slider-wrapper">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          // onMouseDown={handleMouseDown}
          // onMouseUp={handleMouseUp}
          // onTouchStart={handleMouseDown}
          // onTouchEnd={handleMouseUp}
          className="color-slider"
          style={{
            '--slider-fill': `${percentage}%`,
            '--current-color': currentColor
          } as React.CSSProperties}
        />
        <div className="slider-labels">
          <span className="slider-min">{min}</span>
          <span className="slider-value" style={{ color: currentColor }}>{value}</span>
          <span className="slider-max">{max}</span>
        </div>
      </div>
    </div>
  );
}

export default function ColorSlider(props: ColorSliderProps) {
  return <ColorSliderInner {...props} />;
}
