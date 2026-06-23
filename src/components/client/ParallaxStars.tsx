"use client";
import { useEffect, useRef } from "react";

// Default color fallback
const DEFAULT_COLOR = "hsl(220, 100%, 50%)";

// Helper to get current theme color from CSS variable
const getThemeColor = (): string => {
  if (typeof document === 'undefined') return DEFAULT_COLOR;
  
  // Try inline style first (set by JavaScript)
  const inlineColor = document.documentElement.style.getPropertyValue('--theme-color').trim();
  if (inlineColor) return inlineColor;
  
  // Fallback to computed style
  const computedColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--theme-color')
    .trim();
  
  return computedColor || DEFAULT_COLOR;
};

export default function ParallaxStars() {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Use ref to track color - reads from CSS variable
  const colorRef = useRef(DEFAULT_COLOR);

  // Poll the CSS variable for color changes (every 300ms for smoother updates)
  useEffect(() => {
    const updateColor = () => {
      const newColor = getThemeColor();
      colorRef.current = newColor;
    };
    
    // Initial read after a small delay to ensure ColorToggleContext has set the colors
    const initialTimeout = setTimeout(updateColor, 200);
    
    const interval = setInterval(updateColor, 300);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;



    if (!bgCanvas) { return };

    // alpha:false lets Safari/WebKit skip per-frame alpha compositing for this
    // opaque, full-screen background canvas (it already paints solid black each
    // frame) — a cheap, meaningful win on Safari.
    const bgCtx = bgCanvas.getContext("2d", { alpha: false });

    if (!bgCtx) return;

    const bg: CanvasRenderingContext2D = bgCtx;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const updateDimensions = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      bgCanvas.width = width;
      bgCanvas.height = height;
    };
    updateDimensions();

    // Track start time for fade-in effect
    const startTime = Date.now();
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
    let entities: (Star | ShootingStar)[] = [];

    const initEntities = () => {
      const nextEntities: (Star | ShootingStar)[] = [];
      // Original (denser) starfield restored — the drifting stars are the effect
      // the client likes. The Safari wins (30fps throttle, alpha:false canvas,
      // visibility pause) below keep this affordable even at the higher count.
      const starCount = Math.min(Math.floor((width * height) / 2500), 700);

      for (let i = 0; i < starCount; i++) {
        nextEntities.push(new Star({ x: Math.random() * width, y: Math.random() * height, opacity: 0 }));
      }

      for (let i = 0; i < 8; i++) {
        nextEntities.push(new ShootingStar());
      }

      entities = nextEntities;
    };
    initEntities();

    // Animation loop
    const MAX_STAR_OPACITY = 0.8; // 20% lower than full opacity

    const drawFrame = (forceFullOpacity = false) => {
      // Calculate fade-in opacity (0 to MAX_STAR_OPACITY over 3 seconds).
      // forceFullOpacity skips the fade for the single static reduced-motion
      // frame — otherwise it would draw at opacity 0 (invisible) and never
      // advance, hiding the whole starfield.
      const elapsed = Date.now() - startTime;
      const globalOpacity = forceFullOpacity
        ? MAX_STAR_OPACITY
        : Math.min(elapsed / FADE_DURATION, 1) * MAX_STAR_OPACITY;

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
    };

    // Throttle to ~30fps. The stars drift at most ~0.1px/frame, so 30fps looks
    // identical to 60fps but roughly halves the canvas work — the biggest lever
    // for Safari/WebKit, whose 2D canvas is slower than Chrome's.
    const TARGET_FPS = 30;
    const frameInterval = 1000 / TARGET_FPS;
    let lastFrameTime = 0;

    const animate = (now: number) => {
      animationRef.current = requestAnimationFrame(animate);
      if (now - lastFrameTime < frameInterval) return;
      lastFrameTime = now;
      drawFrame();
    };

    // Respect reduced-motion: draw one static frame and skip the loop entirely.
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      drawFrame(true);
    } else {
      animationRef.current = requestAnimationFrame(animate);
    }

    const handleResize = () => {
      updateDimensions();
      initEntities();
    };
    window.addEventListener("resize", handleResize);

    // Pause the loop when the tab is hidden — saves battery and avoids the jank
    // Safari can produce when a backgrounded rAF loop resumes.
    const handleVisibility = () => {
      if (prefersReducedMotion) return;
      if (document.hidden) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      } else if (animationRef.current === null) {
        lastFrameTime = 0;
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
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
