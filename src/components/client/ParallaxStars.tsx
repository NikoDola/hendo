"use client";
import { useEffect, useRef, useState } from "react";

export default function ParallaxStars() {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  // Drives the CSS opacity fade-in of the whole canvas layer on first load.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;



    if (!bgCanvas) { return };

    // alpha:false lets Safari/WebKit skip per-frame alpha compositing for this
    // opaque, full-screen background canvas (it already paints solid black each
    // frame) — a cheap, meaningful win on Safari.
    const bgCtx = bgCanvas.getContext("2d", { alpha: false });

    if (!bgCtx) return;

    const bg: CanvasRenderingContext2D = bgCtx;

    // ---- Theme color sync for the falling comets --------------------------
    // The comets cycle through the SAME palette on the SAME 16s rhythm as the
    // CSS `themeFlowY` gradient that themes the UI and the floating bit-particles.
    // We replay that keyframe purely from the document timeline — no
    // getComputedStyle, no extra timers, no @property <color> animation (the
    // three things that leaked WebKit memory) — so it stays leak-free on Safari.
    const THEME_PERIOD_MS = 16000;
    const GRADIENT_H = 698;
    // Same stops, same order, as the repeating-linear-gradient used everywhere.
    const THEME_STOPS: { pos: number; rgb: [number, number, number] }[] = [
      { pos: 0, rgb: [0x6b, 0xbf, 0x5f] },
      { pos: 120, rgb: [0x45, 0xc7, 0xf0] },
      { pos: 259, rgb: [0x84, 0x55, 0xa2] },
      { pos: 394, rgb: [0xba, 0x49, 0x9b] },
      { pos: 500, rgb: [0xef, 0x38, 0x35] },
      { pos: 612, rgb: [0xf2, 0x68, 0x31] },
      { pos: 698, rgb: [0x6b, 0xbf, 0x5f] },
    ];
    const smoothstep = (t: number) => t * t * (3 - 2 * t); // ≈ ease-in-out

    // Replays themeFlowY's background-position.y: 4 eased steps of 174.5px down
    // the gradient, each preceded by a hold (18.75% of each quarter), looping.
    const themeShift = (timeMs: number) => {
      const t = (timeMs % THEME_PERIOD_MS) / THEME_PERIOD_MS; // 0..1
      const quarter = 0.25;
      const holdFrac = 0.75; // 18.75% hold within each 25% quarter
      const i = Math.min(Math.floor(t / quarter), 3); // step 0..3
      const local = (t - i * quarter) / quarter; // 0..1 within the step
      const eased =
        local <= holdFrac ? 0 : smoothstep((local - holdFrac) / (1 - holdFrac));
      return (i + eased) * (GRADIENT_H / 4); // 0..698
    };

    // Linear-interpolated gradient color at a given y (0..698), wrapping.
    const colorAt = (y: number) => {
      const p = ((y % GRADIENT_H) + GRADIENT_H) % GRADIENT_H;
      for (let k = 0; k < THEME_STOPS.length - 1; k++) {
        const a = THEME_STOPS[k];
        const b = THEME_STOPS[k + 1];
        if (p >= a.pos && p <= b.pos) {
          const f = (p - a.pos) / (b.pos - a.pos);
          const r = Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * f);
          const g = Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * f);
          const bl = Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * f);
          return `rgb(${r}, ${g}, ${bl})`;
        }
      }
      return "#ffffff";
    };

    // The document timeline is the same clock CSS animations run on, so the
    // comets stay phase-aligned with the CSS gradient — not just same-tempo.
    const themeNow = () => {
      const t = typeof document !== "undefined" ? document.timeline?.currentTime : null;
      return t != null ? Number(t) : performance.now();
    };

    let width = window.innerWidth;
    let height = window.innerHeight;

    const updateDimensions = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      bgCanvas.width = width;
      bgCanvas.height = height;
    };
    updateDimensions();

    // Fade-in is handled by a CSS opacity transition on the canvas element (the
    // `visible` state below). The canvas paints opaque every frame, so fading the
    // pixels does nothing visible — fading the ELEMENT is what eases it in.

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

    const drawFrame = () => {
      // Stars/comets draw at a constant alpha; the smooth fade-IN of the whole
      // layer is the CSS opacity transition on the canvas element (see below).
      const globalOpacity = MAX_STAR_OPACITY;

      bg.fillStyle = '#000000';
      bg.fillRect(0, 0, width, height);

      // Apply fade-in opacity to all stars
      bg.globalAlpha = globalOpacity;
      bg.fillStyle = '#ffffff';
      bg.strokeStyle = '#ffffff';

      // Comets pick up the live theme color (synced to the CSS gradient cycle);
      // the drifting dots stay white. Computed once per frame, shared by all.
      const shootingStarColor = colorAt(themeShift(themeNow()));
      entities.forEach(entity => {
        if (entity instanceof ShootingStar) {
          entity.update(shootingStarColor);
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
      drawFrame();
    } else {
      animationRef.current = requestAnimationFrame(animate);
    }

    // Reveal the canvas only after the first frame is painted, so the CSS
    // opacity transition eases the real starfield in (no instant pop on load).
    const revealId = requestAnimationFrame(() => setVisible(true));

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
      cancelAnimationFrame(revealId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []); // Only run once on mount

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none',
      opacity: visible ? 1 : 0, transition: 'opacity 2s ease-in-out' }}>
      <canvas ref={bgCanvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />

    </div>
  );
}
