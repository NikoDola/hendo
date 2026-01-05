"use client";
import { useEffect, useRef } from "react";
import { useColorToggle } from "@/context/ColorToggleContext";

export default function ParallaxStars() {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Track dimensions
  const lastWidthRef = useRef<number>(0);
  const lastHeightRef = useRef<number>(0);

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
    let resizeTimeout: NodeJS.Timeout | null = null;

    const clamp = (n: number, min: number, max: number) =>
      Math.max(min, Math.min(max, n));

    const resizeCanvas = () => {
      // Use window dimensions
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      
      // Store previous dimensions for comparison
      const prevWidth = lastWidthRef.current;
      const prevHeight = lastHeightRef.current;
      
      // Update current dimensions
      width = newWidth;
      height = newHeight;
      lastWidthRef.current = width;
      lastHeightRef.current = height;

      const dpr = Math.max(1, window.devicePixelRatio || 1);
      bgCanvas.width = Math.floor(width * dpr);
      bgCanvas.height = Math.floor(height * dpr);
      bgCanvas.style.width = `${width}px`;
      bgCanvas.style.height = `${height}px`;

      bg.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Return previous dimensions for star redistribution
      return { prevWidth, prevHeight };
    };

    const FADE_DURATION = 3000;

    // Star class
    class Star {
      size: number;
      speed: number;
      x: number;
      y: number;
      opacity: number;

      constructor(options: { x?: number; y?: number; opacity?: number } = {}) {
        this.size = Math.random() * 2;
        this.speed = Math.random() * 0.1;
        this.x = options.x !== undefined ? options.x : Math.random() * width;
        this.y = options.y !== undefined ? options.y : Math.random() * height;
        this.opacity = options.opacity || 0;
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
      
      // Method to redistribute star when canvas resizes
      redistribute(oldWidth: number, oldHeight: number, newWidth: number, newHeight: number) {
        // Scale x position proportionally to new width
        this.x = (this.x / oldWidth) * newWidth;
        
        // Scale y position proportionally to new height
        this.y = (this.y / oldHeight) * newHeight;
        
        // Ensure star is within new bounds
        if (this.x > newWidth) this.x = newWidth * Math.random();
        if (this.y > newHeight) this.y = newHeight * Math.random();
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
      
      // Reset shooting star completely on resize
      redistribute() {
        this.reset();
      }
    }

    // Initialize entities
    let entities: (Star | ShootingStar)[] = [];
    
    const createEntities = () => {
      const newEntities: (Star | ShootingStar)[] = [];

      // Scale star count with viewport area
      const starCount = clamp(Math.floor((width * height) / 1500), 200, 1200);
      
      for (let i = 0; i < starCount; i++) {
        newEntities.push(new Star());
      }

      // Shooting stars
      for (let i = 0; i < 8; i++) {
        newEntities.push(new ShootingStar());
      }
      
      return newEntities;
    };

    // Redistribute all entities based on new dimensions
    const redistributeEntities = (oldWidth: number, oldHeight: number) => {
      entities.forEach(entity => {
        if (entity instanceof Star) {
          // Scale star positions proportionally
          entity.redistribute(oldWidth, oldHeight, width, height);
        } else if (entity instanceof ShootingStar) {
          // Reset shooting stars completely
          entity.redistribute();
        }
      });
    };

    // Adjust star count based on new viewport area
    const adjustStarCount = () => {
      const targetStarCount = clamp(Math.floor((width * height) / 1500), 200, 1200);
      const currentStars = entities.filter(e => e instanceof Star);
      const currentShootingStars = entities.filter(e => e instanceof ShootingStar);
      const currentStarCount = currentStars.length;
      
      if (targetStarCount > currentStarCount) {
        // Add more stars
        const starsToAdd = targetStarCount - currentStarCount;
        for (let i = 0; i < starsToAdd; i++) {
          entities.push(new Star());
        }
      } else if (targetStarCount < currentStarCount) {
        // Remove excess stars
        const starsToRemove = currentStarCount - targetStarCount;
        entities = [...currentStars.slice(0, targetStarCount), ...currentShootingStars];
      }
    };

    // Animation loop
    const MAX_STAR_OPACITY = 0.8;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const globalOpacity = Math.min(elapsed / FADE_DURATION, 1) * MAX_STAR_OPACITY;

      // Clear canvas
      bg.fillStyle = '#000000';
      bg.fillRect(0, 0, width, height);

      // Set opacity for stars
      bg.globalAlpha = globalOpacity;
      bg.fillStyle = '#ffffff';
      bg.strokeStyle = '#ffffff';

      // Update and draw entities
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
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      resizeTimeout = setTimeout(() => {
        const { prevWidth, prevHeight } = resizeCanvas();
        
        // Always redistribute entities on resize to account for dimension changes
        if (prevWidth > 0 && prevHeight > 0) {
          redistributeEntities(prevWidth, prevHeight);
          adjustStarCount();
        }
        
        startTime = Date.now(); // Reset fade animation
        resizeTimeout = null;
      }, 200);
    };

    // Handle orientation change - more aggressive reset
    const handleOrientationChange = () => {
      // Clear any pending resize timeout
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      // Wait a bit longer for orientation to fully complete
      resizeTimeout = setTimeout(() => {
        const { prevWidth, prevHeight } = resizeCanvas();
        
        if (prevWidth > 0 && prevHeight > 0) {
          // On orientation change, completely recreate entities for better distribution
          entities = createEntities();
        }
        
        startTime = Date.now();
        resizeTimeout = null;
      }, 350); // Longer delay for orientation
    };

    // Initial setup
    resizeCanvas(); // Set initial dimensions
    entities = createEntities(); // Create initial entities
    
    // Start animation
    animate();

    // Event listeners
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleOrientationChange, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);

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