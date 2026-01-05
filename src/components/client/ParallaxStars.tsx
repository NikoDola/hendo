"use client";
import { useEffect, useRef } from "react";
import { useColorToggle } from "@/context/ColorToggleContext";

export default function ParallaxStars() {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Track previous container width
  const prevWidthRef = useRef<number>(0);

  // Get color from context
  const { color } = useColorToggle();
  const colorRef = useRef(color);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    const container = containerRef.current;
    
    if (!bgCanvas || !container) return;

    const bgCtx = bgCanvas.getContext("2d");
    if (!bgCtx) return;

    const bg: CanvasRenderingContext2D = bgCtx;

    let width = 0;
    let height = 0;
    let startTime = Date.now();
    let isInitialized = false;

    const clamp = (n: number, min: number, max: number) =>
      Math.max(min, Math.min(max, n));

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
            bg.strokeStyle = shootingStarColor;
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

    // Initialize entities array
    const entities: (Star | ShootingStar)[] = [];
    
    // Function to create new stars
    const reseedEntities = () => {
      // Clear existing entities
      entities.length = 0;

      // Scale star count with viewport area, but keep it bounded
      const starCount = clamp(Math.floor((width * height) / 1500), 200, 1200);
      
      // Create regular stars
      for (let i = 0; i < starCount; i++) {
        entities.push(new Star({ 
          x: Math.random() * width, 
          y: Math.random() * height, 
          opacity: 0 
        }));
      }

      // Create shooting stars
      for (let i = 0; i < 8; i++) {
        entities.push(new ShootingStar());
      }
    };

    const FADE_DURATION = 3000;
    const MAX_STAR_OPACITY = 0.8;

    // Animation loop
    const animate = () => {
      // Calculate fade-in opacity
      const elapsed = Date.now() - startTime;
      const globalOpacity = Math.min(elapsed / FADE_DURATION, 1) * MAX_STAR_OPACITY;

      // Clear canvas with black background
      bg.fillStyle = '#000000';
      bg.fillRect(0, 0, width, height);

      // Apply fade-in opacity to all stars
      bg.globalAlpha = globalOpacity;
      bg.fillStyle = '#ffffff';
      bg.strokeStyle = '#ffffff';

      // Update entities
      entities.forEach(entity => {
        if (entity instanceof ShootingStar) {
          entity.update(colorRef.current);
        } else {
          entity.update();
        }
      });

      // Reset alpha for next frame
      bg.globalAlpha = 1;

      animationRef.current = requestAnimationFrame(animate);
    };

    const updateCanvasSize = () => {
      // Get container dimensions - this is stable and doesn't change on scroll
      const containerRect = container.getBoundingClientRect();
      const newWidth = Math.max(1, Math.floor(containerRect.width));
      const newHeight = Math.max(1, Math.floor(containerRect.height));

      // Only update if dimensions actually changed
      if (newWidth === width && newHeight === height && isInitialized) {
        return;
      }

      width = newWidth;
      height = newHeight;

      // Set canvas size
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      bgCanvas.width = Math.floor(width * dpr);
      bgCanvas.height = Math.floor(height * dpr);
      bgCanvas.style.width = `${width}px`;
      bgCanvas.style.height = `${height}px`;

      // Scale context for high DPI displays
      bg.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Reseed entities on significant width change OR initial load
      const widthChangedSignificantly = Math.abs(prevWidthRef.current - width) > 50;
      
      if (widthChangedSignificantly || !isInitialized) {
        reseedEntities();
        prevWidthRef.current = width;
        startTime = Date.now(); // Reset fade on reseed
      }

      if (!isInitialized) {
        isInitialized = true;
      }
    };

    // Initial setup
    updateCanvasSize();
    animate();

    // Use ResizeObserver on the CONTAINER (parent div)
    // This only fires when the actual layout changes, not on scroll
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === container) {
          // Use requestAnimationFrame to batch updates
          requestAnimationFrame(() => {
            updateCanvasSize();
          });
        }
      }
    });

    // Observe the container div
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        zIndex: 0, 
        pointerEvents: 'none' 
      }}
    >
      <canvas 
        ref={bgCanvasRef} 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%',
          display: 'block'
        }} 
      />
    </div>
  );
}