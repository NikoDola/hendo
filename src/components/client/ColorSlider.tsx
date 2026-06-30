"use client";

import React, { useState } from "react";
import "./ColorSlider.css";

interface ColorSliderProps {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  className?: string;
}

function ColorSliderInner({
  min = 0,
  max = 100,
  step = 1,
  defaultValue = 50,
  onChange,
  className = "",
}: ColorSliderProps) {
  const [value, setValue] = useState(defaultValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setValue(newValue);
    onChange?.(newValue);
  };

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
          className="color-slider"
          style={{ "--slider-fill": `${percentage}%` } as React.CSSProperties}
        />
        <div className="slider-labels">
          <span className="slider-min">{min}</span>
          <span className="slider-value">{value}</span>
          <span className="slider-max">{max}</span>
        </div>
      </div>
    </div>
  );
}

export default function ColorSlider(props: ColorSliderProps) {
  return <ColorSliderInner {...props} />;
}
