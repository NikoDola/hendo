"use client";

import { useEffect, useState, useCallback } from "react";

import "./ZoomingStars.css";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number; // Final size (15-28px)
  appearDelay: number; // 3-5 seconds in ms
  scaleDuration: number; // 4-7 seconds in ms
  stayDuration: number; // 1-3 seconds in ms
  disappearDuration: number; // 1-2 seconds in ms
  cycleCount: number; // Track how many times this instance has cycled
}

export default function ZoomingStars() {

  const [stars, setStars] = useState<Star[]>([]);

  // Generate a new random star
  const generateStar = useCallback((id: number, cycleCount: number = 0): Star => {
    return {
      id,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 15 + Math.random() * 13, // 15-28px
      appearDelay: 3000 + Math.random() * 2000, // 3-5 seconds
      scaleDuration: 4000 + Math.random() * 3000, // 4-7 seconds
      stayDuration: 1000 + Math.random() * 2000, // 1-3 seconds
      disappearDuration: 1000 + Math.random() * 1000, // 1-2 seconds
      cycleCount,
    };
  }, []);

  // Initialize stars
  useEffect(() => {
    const starCount = 15;
    const newStars: Star[] = [];
    
    for (let i = 0; i < starCount; i++) {
      newStars.push(generateStar(i));
    }
    
    setStars(newStars);
  }, [generateStar]);

  // Handle star reset after complete animation cycle
  const handleAnimationIteration = useCallback((starId: number) => {
    setStars(prev => prev.map(star => {
      if (star.id === starId) {
        // Generate new position and timing for the next cycle
        return generateStar(starId, star.cycleCount + 1);
      }
      return star;
    }));
  }, [generateStar]);

  return (
    <div className="zooming-stars-container">
      {stars.map((star) => {
        const initialScale = 0.5 / star.size; // Start from 0.5px
        const totalDuration = star.scaleDuration + star.stayDuration + star.disappearDuration;
        const totalDelay = star.appearDelay;
        
        return (
          <div
            key={`${star.id}-${star.cycleCount}`}
            className="zooming-star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
            
              // CSS custom properties for the animation
              '--initial-scale': initialScale,
              '--final-scale': '1',
              // Single animation that includes all phases
              animation: `starLifecycle ${totalDuration}ms ease-in-out ${totalDelay}ms 1 forwards`,
            } as React.CSSProperties}
            onAnimationEnd={(e) => {
              // Only handle the main animation end, not any child animations
              if (e.animationName === 'starLifecycle') {
                // Animation completed, now reset the star
                setTimeout(() => {
                  handleAnimationIteration(star.id);
                }, 50); // Small delay before resetting
              }
            }}
          >
            <svg
              viewBox="0 0 52 52"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                width: '100%',
                height: '100%',
              }}
            >
              <path
                d="M52,26c-23.9,1.2-24.8,2.1-26,26c-1.2-23.9-2.1-24.8-26-26c23.9-1.2,24.8-2.1,26-26C27.2,23.9,28.1,24.8,52,26z"
                fill="currentColor"
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
}