"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import "./Hero.css";

export default function Hero() {
  const [isGlitching, setIsGlitching] = useState(false);
  const [currentImage, setCurrentImage] = useState("/images/Hendo/4.png");

  useEffect(() => {
    const triggerGlitch = () => {
      setIsGlitching(true);

      // Glitch sequence
      const glitchImages = [
        "/images/Hendo/glitch1.png",
        "/images/Hendo/glitch2.png",
        "/images/Hendo/glitch3.png",
        "/images/Hendo/glitch1.png",
        "/images/Hendo/glitch2.png",
        "/images/Hendo/glitch3.png"
      ];

      let glitchIndex = 0;
      const glitchInterval = setInterval(() => {
        if (glitchIndex < glitchImages.length) {
          setCurrentImage(glitchImages[glitchIndex]);
          glitchIndex++;
        } else {
          clearInterval(glitchInterval);
          setCurrentImage("/images/Hendo/4.png");
          setIsGlitching(false);
        }
      }, 100);

      setTimeout(() => {
        setIsGlitching(false);
        setCurrentImage("/images/Hendo/4.png");
      }, 1000);
    };

    // Trigger glitch every 3 seconds
    const glitchInterval = setInterval(triggerGlitch, 3000);

    return () => {
      clearInterval(glitchInterval);
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

      </div>
    </div>
  )
}


