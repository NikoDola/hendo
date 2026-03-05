"use client";

import { useEffect, useState, useCallback, useRef } from "react";

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
  const MIN_STARS = 15;
  const STAR_DENSITY = 150000; // pixels per star
  const [stars, setStars] = useState<Star[]>([]);
  const nextIdRef = useRef(0);

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

  const getTargetStarCount = useCallback((): number => {
    if (typeof window === "undefined") return MIN_STARS;
    const area = window.innerWidth * window.innerHeight;
    return Math.max(MIN_STARS, Math.ceil(area / STAR_DENSITY));
  }, []);

  // Initialize stars
  useEffect(() => {
    const starCount = getTargetStarCount();
    const newStars: Star[] = [];
    
    for (let i = 0; i < starCount; i++) {
      newStars.push(generateStar(nextIdRef.current++));
    }
    
    setStars(newStars);
  }, [generateStar, getTargetStarCount]);

  useEffect(() => {
    const handleResize = () => {
      const targetCount = getTargetStarCount();

      setStars((prev) => {
        if (prev.length === targetCount) return prev;
        if (prev.length > targetCount) return prev.slice(0, targetCount);

        const additional: Star[] = [];
        for (let i = prev.length; i < targetCount; i++) {
          additional.push(generateStar(nextIdRef.current++));
        }
        return [...prev, ...additional];
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [generateStar, getTargetStarCount]);

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
                handleAnimationIteration(star.id);
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
