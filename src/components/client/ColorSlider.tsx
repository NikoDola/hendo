"use client";
import React, { useState, useEffect } from "react";
import { useColorToggle } from "@/context/ColorToggleContext";
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

  // Listen for color changes from the ColorProvider with glitch timing
  useEffect(() => {
    let lastColor = "";
    let colorTimeout: NodeJS.Timeout;

    const updateColor = () => {
      const root = document.documentElement;
      const color = getComputedStyle(root).getPropertyValue('--theme-color').trim();

      if (color && color !== lastColor) {
        console.log('ColorSlider: Color change detected, will update in 1.2s for glitch sync');
        lastColor = color;

        // Clear any existing timeout
        if (colorTimeout) {
          clearTimeout(colorTimeout);
        }

        // Update color 1.2 seconds after color change (when glitch starts)
        colorTimeout = setTimeout(() => {
          console.log('ColorSlider: Updating color to:', color);
          setCurrentColor(color);
        }, 1200); // Match glitch start timing
      }
    };

    // Initial color
    updateColor();

    // Update every 50ms to catch color changes more precisely
    const interval = setInterval(updateColor, 50);

    return () => {
      clearInterval(interval);
      if (colorTimeout) {
        clearTimeout(colorTimeout);
      }
    };
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
