"use client";
import { useEffect, useRef } from "react";
import { useColorToggle } from "@/context/ColorToggleContext";

export default function ParallaxStars() {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Get color from context
  const { color } = useColorToggle();

  // Use ref to track color without causing re-renders
  const colorRef = useRef(color);

  // Update the ref when color changes
  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;



    if (!bgCanvas) { return }
    else {
      bgCanvas.width = window.innerWidth;
      bgCanvas.height = window.innerHeight;
    };

    const bgCtx = bgCanvas.getContext("2d");

    if (!bgCtx) return;

    const bg: CanvasRenderingContext2D = bgCtx;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Track start time for fade-in effect
    const startTime = Date.now();
    const FADE_DURATION = 3000; // 3 seconds fade-in

    // Terrain generation
    const points: number[] = [];
    let displacement = 140;
    const power = Math.pow(2, Math.ceil(Math.log(width) / Math.log(2)));

    // Set start and end heights
    points[0] = (height - (Math.random() * height / 2)) - displacement;
    points[power] = (height - (Math.random() * height / 2)) - displacement;

    // Create terrain points using midpoint displacement
    for (let i = 1; i < power; i *= 2) {
      for (let j = (power / i) / 2; j < power; j += power / i) {
        points[j] = ((points[j - (power / i) / 2] + points[j + (power / i) / 2]) / 2) +
          Math.floor(Math.random() * -displacement + displacement);
      }
      displacement *= 0.6;
    }

    // Draw terrain

    // Star class
    class Star {
      size: number;
      speed: number;
      x: number;
      y: number;
      opacity: number;

      constructor(options: { x: number; y: number; opacity: number }) {
        this.size = Math.random() * 2;
        this.speed = Math.random() * 0.1;
        this.x = options.x;
        this.y = options.y;
        this.opacity = 0;
      }

      reset() {
        this.size = Math.random() * 2;
        this.speed = Math.random() * 0.1;
        this.x = width;
        this.y = Math.random() * height;
      }

      update() {
        this.x -= this.speed;
        if (this.x < 0) {
          this.reset();
        } else {
          bg.fillRect(this.x, this.y, this.size, this.size);
        }
      }
    }

    // Shooting star class
    class ShootingStar {
      x!: number;
      y!: number;
      len!: number;
      speed!: number;
      size!: number;
      waitTime!: number;
      active!: boolean;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = 0;
        this.len = Math.random() * 80 + 10;
        this.speed = Math.random() * 10 + 6;
        this.size = Math.random() * 1 + 0.1;
        this.waitTime = new Date().getTime() + Math.random() * 3000 + 500;
        this.active = false;
      }

      update(shootingStarColor: string) {
        if (this.active) {
          this.x -= this.speed;
          this.y += this.speed;
          if (this.x < 0 || this.y >= height) {
            this.reset();
          } else {
            bg.lineWidth = this.size;
            bg.strokeStyle = shootingStarColor; // Use dynamic color
            bg.beginPath();
            bg.moveTo(this.x, this.y);
            bg.lineTo(this.x + this.len, this.y - this.len);
            bg.stroke();
          }
        } else {
          if (this.waitTime < new Date().getTime()) {
            this.active = true;
          }
        }
      }
    }

    // Initialize entities
    const entities: (Star | ShootingStar)[] = [];

    // Add stars
    for (let i = 0; i < height; i++) {
      entities.push(new Star({ x: Math.random() * width, y: Math.random() * height, opacity: 0 }));
    }

    // Add shooting stars (temporarily increased for testing)
    for (let i = 0; i < 8; i++) {
      entities.push(new ShootingStar());
    }

    // Animation loop
    const animate = () => {
      // Calculate fade-in opacity (0 to 1 over 3 seconds)
      const elapsed = Date.now() - startTime;
      const globalOpacity = Math.min(elapsed / FADE_DURATION, 1);

      bg.fillStyle = '#000000';
      bg.fillRect(0, 0, width, height);

      // Apply fade-in opacity to all stars
      bg.globalAlpha = globalOpacity;
      bg.fillStyle = '#ffffff';
      bg.strokeStyle = '#ffffff';

      // Update entities with color from context
      entities.forEach(entity => {
        if (entity instanceof ShootingStar) {
          entity.update(colorRef.current); // Pass color to shooting stars
        } else {
          entity.update();
        }
      });

      // Reset alpha for next frame
      bg.globalAlpha = 1;

      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []); // Only run once on mount

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}>
      <canvas ref={bgCanvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />

    </div>
  );
}
