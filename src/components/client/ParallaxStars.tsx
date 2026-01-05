"use client";
import { useEffect, useRef } from "react";
import { useColorToggle } from "@/context/ColorToggleContext";

export default function ParallaxStars() {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Use refs to track dimensions and prevent unnecessary re-seeding
  const lastWidthRef = useRef<number>(0);
  const lastHeightRef = useRef<number>(0);

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
    if (!bgCanvas) return;

    const bgCtx = bgCanvas.getContext("2d");
    if (!bgCtx) return;

    const bg: CanvasRenderingContext2D = bgCtx;

    let width = 0;
    let height = 0;
    let startTime = Date.now();
    let resizeRaf: number | null = null;

    const clamp = (n: number, min: number, max: number) =>
      Math.max(min, Math.min(max, n));

    const resizeCanvas = (resetFade: boolean = false) => {
      // Get actual rendered size
      const rect = bgCanvas.getBoundingClientRect();
      const newWidth = Math.max(1, Math.floor(rect.width || window.innerWidth));
      const newHeight = Math.max(1, Math.floor(rect.height || window.innerHeight));

      // Check if dimensions have actually changed
      const dimensionsChanged = 
        newWidth !== lastWidthRef.current || 
        newHeight !== lastHeightRef.current;

      // Update dimensions
      width = newWidth;
      height = newHeight;
      lastWidthRef.current = width;
      lastHeightRef.current = height;

      const dpr = Math.max(1, window.devicePixelRatio || 1);
      bgCanvas.width = Math.floor(width * dpr);
      bgCanvas.height = Math.floor(height * dpr);
      bgCanvas.style.width = `${width}px`;
      bgCanvas.style.height = `${height}px`;

      // Draw in CSS pixels; backing store is scaled by DPR
      bg.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (resetFade) startTime = Date.now();
      
      return dimensionsChanged;
    };

    const FADE_DURATION = 3000; // 3 seconds fade-in

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
        this.x = Math.random() * width;
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
    let entities: (Star | ShootingStar)[] = [];
    
    const reseedEntities = () => {
      // Clear existing entities
      entities = [];

      // Scale star count with viewport area, but keep it bounded
      const starCount = clamp(Math.floor((width * height) / 1500), 200, 1200);
      for (let i = 0; i < starCount; i++) {
        entities.push(new Star({ 
          x: Math.random() * width, 
          y: Math.random() * height, 
          opacity: 0 
        }));
      }

      // Shooting stars
      for (let i = 0; i < 8; i++) {
        entities.push(new ShootingStar());
      }
    };

    // Reinitialize stars based on new dimensions
    const reinitializeStars = () => {
      // Scale star count with viewport area, but keep it bounded
      const starCount = clamp(Math.floor((width * height) / 1500), 200, 1200);
      
      // Update existing stars or create new ones
      const newEntities: (Star | ShootingStar)[] = [];
      
      // Regular stars
      for (let i = 0; i < starCount; i++) {
        newEntities.push(new Star({ 
          x: Math.random() * width, 
          y: Math.random() * height, 
          opacity: 0 
        }));
      }

      // Shooting stars
      for (let i = 0; i < 8; i++) {
        newEntities.push(new ShootingStar());
      }
      
      return newEntities;
    };

    // Animation loop
    const MAX_STAR_OPACITY = 0.8; // 20% lower than full opacity
    const animate = () => {
      // Calculate fade-in opacity (0 to MAX_STAR_OPACITY over 3 seconds)
      const elapsed = Date.now() - startTime;
      const globalOpacity = Math.min(elapsed / FADE_DURATION, 1) * MAX_STAR_OPACITY;

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

    const scheduleResize = () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = null;
        const dimensionsChanged = resizeCanvas(true);
        
        // Only re-seed entities if dimensions actually changed
        if (dimensionsChanged) {
          entities = reinitializeStars();
        }
      });
    };

    // Initial setup
    resizeCanvas(true);
    reseedEntities();

    // Start animation
    animate();

    // Keep canvas in sync with viewport changes
    const resizeObserver = new ResizeObserver(() => {
      scheduleResize();
    });
    
    resizeObserver.observe(bgCanvas);
    window.addEventListener("resize", scheduleResize, { passive: true });
    window.addEventListener("orientationchange", scheduleResize, { passive: true });

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleResize);
      window.removeEventListener("orientationchange", scheduleResize);

      if (resizeRaf) {
        cancelAnimationFrame(resizeRaf);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []); // Only run once on mount

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      zIndex: 0, 
      pointerEvents: 'none' 
    }}>
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