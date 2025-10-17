"use client";
import { useEffect, useState } from "react";
import "./AnimatedStars.css";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  blur: number;
  duration: number;
  delay: number;
  isFalling: boolean;
}



export default function AnimatedStars() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const generateStars = () => {
      const newStars: Star[] = [];
      const starCount = 30; // Number of stars

      for (let i = 0; i < starCount; i++) {
        const isFalling = Math.random() < 0.1; // Only 10% of stars will fall
        newStars.push({
          id: i,
          x: Math.random() * 100, // Random horizontal position (0-100%)
          y: Math.random() * 100, // Random vertical position (0-100%)
          size: Math.random() * 8 + 3, // Random size between 3-11px
          opacity: Math.random() * 0.4 + 0.6, // Random opacity between 0.6-1
          blur: Math.random() * 3 + 0.5, // Random blur between 0.5-3.5px (more variation)
          duration: Math.random() * 5 + 3, // Random animation duration 2-5 seconds
          delay: Math.random() * 5, // Random delay 0-5 seconds for random pop-out
          isFalling: isFalling, // Track if this star should fall
        });
      }

      setStars(newStars);
    };

    generateStars();
  }, []);


  return (
    <div className="stars-container">
      {stars.map((star) => (
        <div
          key={star.id}
          className={`star ${star.isFalling ? 'falling' : 'static'}`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            filter: `blur(${star.blur}px)`,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
