"use client";
import React, { useState, useEffect } from "react";
import { ColorProvider } from "./ColorProvider";
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

  // Listen for color changes from the ColorProvider
  useEffect(() => {
    const updateColor = () => {
      const root = document.documentElement;
      const color = getComputedStyle(root).getPropertyValue('--theme-color').trim();
      if (color) {
        setCurrentColor(color);
      }
    };

    // Initial color
    updateColor();

    // Update color every 100ms to catch changes
    const interval = setInterval(updateColor, 100);

    return () => clearInterval(interval);
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
  return (
    <ColorProvider>
      <ColorSliderInner {...props} />
    </ColorProvider>
  );
}
