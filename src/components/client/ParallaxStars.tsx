"use client";
import { useEffect, useRef } from "react";
import { useColorToggle } from "@/context/ColorToggleContext";

export default function ParallaxStars() {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Track dimensions and orientation
  const lastWidthRef = useRef<number>(0);
  const lastHeightRef = useRef<number>(0);
  const lastOrientationRef = useRef<number>(window.orientation || 0);

  // Get color from context
  const { color } = useColorToggle();
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
    let resizeTimeout: NodeJS.Timeout | null = null;

    const clamp = (n: number, min: number, max: number) =>
      Math.max(min, Math.min(max, n));

    const getCanvasDimensions = () => {
      // Use window dimensions for mobile orientation changes
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      return { width: newWidth, height: newHeight };
    };

    const resizeCanvas = () => {
      const { width: newWidth, height: newHeight } = getCanvasDimensions();
      
      // Check if dimensions have significantly changed (more than 10 pixels)
      const widthChanged = Math.abs(newWidth - lastWidthRef.current) > 10;
      const heightChanged = Math.abs(newHeight - lastHeightRef.current) > 10;
      const orientationChanged = window.orientation !== lastOrientationRef.current;
      
      const shouldReseed = widthChanged || heightChanged || orientationChanged;

      // Update dimensions
      width = newWidth;
      height = newHeight;
      lastWidthRef.current = width;
      lastHeightRef.current = height;
      lastOrientationRef.current = window.orientation || 0;

      const dpr = Math.max(1, window.devicePixelRatio || 1);
      bgCanvas.width = Math.floor(width * dpr);
      bgCanvas.height = Math.floor(height * dpr);
      bgCanvas.style.width = `${width}px`;
      bgCanvas.style.height = `${height}px`;

      // Draw in CSS pixels; backing store is scaled by DPR
      bg.setTransform(dpr, 0, 0, dpr, 0, 0);

      return shouldReseed;
    };

    const FADE_DURATION = 3000;

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

    // Initialize entities
    let entities: (Star | ShootingStar)[] = [];
    
    const reseedEntities = () => {
      entities = [];

      // Scale star count with viewport area
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

    // Animation loop
    const MAX_STAR_OPACITY = 0.8;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const globalOpacity = Math.min(elapsed / FADE_DURATION, 1) * MAX_STAR_OPACITY;

      bg.fillStyle = '#000000';
      bg.fillRect(0, 0, width, height);

      bg.globalAlpha = globalOpacity;
      bg.fillStyle = '#ffffff';
      bg.strokeStyle = '#ffffff';

      entities.forEach(entity => {
        if (entity instanceof ShootingStar) {
          entity.update(colorRef.current);
        } else {
          entity.update();
        }
      });

      bg.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    // Handle resize with debouncing
    const handleResize = () => {
      if (resizeRaf) {
        cancelAnimationFrame(resizeRaf);
      }
      
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      // Use both RAF and timeout for mobile compatibility
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = null;
        
        const shouldReseed = resizeCanvas();
        
        if (shouldReseed) {
          // Small delay to ensure dimensions are stable on mobile
          resizeTimeout = setTimeout(() => {
            resizeCanvas(); // Check dimensions again
            reseedEntities();
            startTime = Date.now(); // Reset fade animation
            resizeTimeout = null;
          }, 100);
        }
      });
    };

    // Handle orientation change specifically
    const handleOrientationChange = () => {
      // Force reseed on orientation change
      setTimeout(() => {
        resizeCanvas();
        reseedEntities();
        startTime = Date.now();
      }, 150); // Longer delay for orientation changes
    };

    // Initial setup
    const shouldReseed = resizeCanvas();
    if (shouldReseed) {
      reseedEntities();
    }

    // Start animation
    animate();

    // Event listeners
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleOrientationChange, { passive: true });
    
    // Also use ResizeObserver for container changes
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    
    resizeObserver.observe(bgCanvas);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);

      if (resizeRaf) {
        cancelAnimationFrame(resizeRaf);
      }
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      zIndex: 0, 
      pointerEvents: 'none',
      overflow: 'hidden'
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