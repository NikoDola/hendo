"use client";
import { useEffect, useState } from "react";
import "./Hero.css";

export default function Hero2() {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    let lastColor = "";
    let glitchTimeout: NodeJS.Timeout;

    // Listen for color changes from the ColorProvider
    const updateColor = () => {
      const root = document.documentElement;
      const color = getComputedStyle(root).getPropertyValue('--theme-color').trim();

      if (color && color !== lastColor) {
        console.log('Hero2 glitch triggered by color change to:', color);
        lastColor = color;

        // Clear any existing glitch timeout
        if (glitchTimeout) {
          clearTimeout(glitchTimeout);
        }

        // Trigger glitch effect after a short delay (after color transition)
        glitchTimeout = setTimeout(() => {
          setIsGlitching(true);

          // Reset glitch state after animation completes
          setTimeout(() => {
            setIsGlitching(false);
          }, 1000); // 1-second glitch animation
        }, 1200); // Start glitch 1.2 seconds after color change
      }
    };

    // Initial check
    updateColor();

    // Update every 50ms to catch color changes more precisely
    const interval = setInterval(updateColor, 50);

    return () => {
      clearInterval(interval);
      if (glitchTimeout) {
        clearTimeout(glitchTimeout);
      }
    };
  }, []);

  return (
    <div className="hero__wrapper">
      <div className="imageWrapper">
        <div className="headline">
          <div>
            <span id="letter_l">L</span>
            <span id="letter_e">E</span>
            <span id="letter_v">V</span>
            <span id="letter_e2">E</span>
            <span id="letter_l2">L</span>
          </div>
          <div>
            <span className="heroHiddenU">U</span>
            <span id="letter_p">P</span>
          </div>
        </div>
       
      </div>
    </div>
  )
}
