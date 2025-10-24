"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import "./Hero.css";

export default function Hero() {
  const [isGlitching, setIsGlitching] = useState(false);
  const [currentImage, setCurrentImage] = useState("/images/hendo/4.png");

  useEffect(() => {
    let lastColor = "";
    let glitchTimeout: NodeJS.Timeout;

    const updateColor = () => {
      const root = document.documentElement;
      const color = getComputedStyle(root).getPropertyValue('--theme-color').trim();

      if (color && color !== lastColor) {
        console.log('Hero glitch triggered by color change to:', color);
        lastColor = color;

        if (glitchTimeout) {
          clearTimeout(glitchTimeout);
        }

        glitchTimeout = setTimeout(() => {
          setIsGlitching(true);

          // Glitch sequence
          const glitchImages = [
            "/images/hendo/glitch1.png",
            "/images/hendo/glitch2.png",
            "/images/hendo/glitch3.png",
            "/images/hendo/glitch1.png",
            "/images/hendo/glitch2.png",
            "/images/hendo/glitch3.png"
          ];

          let glitchIndex = 0;
          const glitchInterval = setInterval(() => {
            if (glitchIndex < glitchImages.length) {
              setCurrentImage(glitchImages[glitchIndex]);
              glitchIndex++;
            } else {
              clearInterval(glitchInterval);
              setCurrentImage("/images/hendo/4.png");
              setIsGlitching(false);
            }
          }, 100);

          setTimeout(() => {
            setIsGlitching(false);
            setCurrentImage("/images/hendo/4.png");
          }, 1000);
        }, 1200);
      }
    };

    updateColor();
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
            <span style={{ zIndex: "-2" }}>U</span>
            <span id="letter_p">P</span>
          </div>
        </div>
        <div className={`hendoImageDiv ${isGlitching ? 'glitch-trigger' : ''}`}>
          <Image
            src={currentImage}
            alt="Hendo"
            width={800}
            height={600}
            priority
            className="hendo-image"
          />
        </div>
        <div className="void"></div>
      </div>
    </div>
  )
}


