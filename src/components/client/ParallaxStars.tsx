"use client";
import { useEffect, useRef } from "react";

// The same colors from ColorProvider
const colors = [
  "hsl(317 100% 54%)", // neon pink
  "hsl(190 100% 50%)", // neon cyan
  "hsl(120 100% 45%)", // neon green
  "hsl(50 100% 50%)",  // neon yellow
  "hsl(280 100% 60%)", // neon purple
  "hsl(0 100% 60%)",   // neon red
  "hsl(30 100% 55%)"   // neon orange
];

export default function ParallaxStars() {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const terCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    const terCanvas = terCanvasRef.current;

    if (!bgCanvas || !terCanvas) return;

    const bgCtx = bgCanvas.getContext("2d");
    const terCtx = terCanvas.getContext("2d");

    if (!bgCtx || !terCtx) return;

    const width = window.innerWidth;
    const height = Math.max(document.body.offsetHeight, 400);

    // Set canvas dimensions
    bgCanvas.width = terCanvas.width = width;
    bgCanvas.height = terCanvas.height = height;

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
    terCtx.beginPath();
    for (let i = 0; i <= width; i++) {
      if (i === 0) {
        terCtx.moveTo(0, points[0]);
      } else if (points[i] !== undefined) {
        terCtx.lineTo(i, points[i]);
      }
    }
    terCtx.lineTo(width, height);
    terCtx.lineTo(0, height);
    terCtx.lineTo(0, points[0]);
    terCtx.fill();

    // Star class
    class Star {
      size: number;
      speed: number;
      x: number;
      y: number;

      constructor(options: { x: number; y: number }) {
        this.size = Math.random() * 2;
        this.speed = Math.random() * 0.1;
        this.x = options.x;
        this.y = options.y;
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
          bgCtx.fillRect(this.x, this.y, this.size, this.size);
        }
      }
    }

    // Shooting star class
    class ShootingStar {
      x: number;
      y: number;
      len: number;
      speed: number;
      size: number;
      waitTime: number;
      active: boolean;

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

      update() {
        if (this.active) {
          this.x -= this.speed;
          this.y += this.speed;
          if (this.x < 0 || this.y >= height) {
            this.reset();
          } else {
            bgCtx.lineWidth = this.size;
            bgCtx.beginPath();
            bgCtx.moveTo(this.x, this.y);
            bgCtx.lineTo(this.x + this.len, this.y - this.len);
            bgCtx.stroke();
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
      entities.push(new Star({ x: Math.random() * width, y: Math.random() * height }));
    }

    // Add shooting stars
    entities.push(new ShootingStar());
    entities.push(new ShootingStar());

    // Color cycling
    let colorIndex = 0;
    const updateColor = () => {
      const newColor = colors[colorIndex];
      bgCtx.fillStyle = newColor;
      bgCtx.strokeStyle = newColor;
      colorIndex = (colorIndex + 1) % colors.length;
    };

    // Animation loop
    const animate = () => {
      bgCtx.fillStyle = '#000000';
      bgCtx.fillRect(0, 0, width, height);
      bgCtx.fillStyle = '#ffffff';
      bgCtx.strokeStyle = '#ffffff';

      // Update color every 3 seconds
      if (Math.floor(Date.now() / 3000) !== Math.floor((Date.now() - 16) / 3000)) {
        updateColor();
      }

      // Update entities
      entities.forEach(entity => entity.update());

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
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}>
      <canvas ref={bgCanvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
      <canvas ref={terCanvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
    </div>
  );
}
