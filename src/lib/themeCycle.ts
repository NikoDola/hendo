// Single source of truth for the auto theme-color cycle.
//
// This module defines the cycle schedule in JS. ColorToggleContext drives the
// page from it (writing plain `--theme-color*` custom properties on :root each
// frame); canvas consumers (ParallaxStars shooting stars, the ColorSlider
// readout) also derive the current color from `performance.now()` WITHOUT
// reading the DOM (`getComputedStyle`) — the forced style flushes were part of
// what pushed iOS Safari into its "significant memory" self-reload. There is no
// CSS @keyframes animation of the theme vars anymore (it leaked WebKit memory).
//
// The schedule: 5 pairs, 8s each (40s period). Within each 8s slot the color
// holds for 5s then cross-fades to the next over 3s.

export interface GradientPair {
  color1: string;
  color2: string;
  solid: string;
}

// The five color pairs cycled through, in order. These are the canonical
// values the CSS keyframes also encode.
export const gradientPairs: GradientPair[] = [
  { color1: "hsl(220, 100%, 50%)", color2: "hsl(120, 100%, 50%)", solid: "hsl(220, 100%, 50%)" },
  { color1: "hsl(30, 100%, 55%)", color2: "hsl(0, 100%, 60%)", solid: "hsl(30, 100%, 55%)" },
  { color1: "hsl(320, 100%, 55%)", color2: "hsl(270, 100%, 60%)", solid: "hsl(320, 100%, 55%)" },
  { color1: "hsl(190, 100%, 50%)", color2: "hsl(140, 100%, 50%)", solid: "hsl(190, 100%, 50%)" },
  { color1: "hsl(240, 100%, 55%)", color2: "hsl(320, 100%, 60%)", solid: "hsl(240, 100%, 55%)" },
];

// Solid theme color of each pair as [h, s, l] for interpolation.
const SOLID_HSL: [number, number, number][] = [
  [220, 100, 50],
  [30, 100, 55],
  [320, 100, 55],
  [190, 100, 50],
  [240, 100, 55],
];

export const SLOT_MS = 8000; // time per pair
export const HOLD_MS = 5000; // steady portion of each slot
export const FADE_MS = SLOT_MS - HOLD_MS; // 3s cross-fade, matches the old transition
export const THEME_CYCLE_MS = SLOT_MS * gradientPairs.length; // 40s full period

// Interpolate hue the short way around the wheel so the canvas color tracks the
// browser's hsl() interpolation closely.
function lerpHue(a: number, b: number, t: number): number {
  let d = b - a;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  let h = a + d * t;
  if (h < 0) h += 360;
  if (h >= 360) h -= 360;
  return h;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Current solid theme color for a given timestamp (e.g. performance.now()),
// mirroring the CSS keyframe schedule. Returns an `hsl(...)` string.
export function themeColorAt(now: number): string {
  const n = gradientPairs.length;
  const pos = ((now % THEME_CYCLE_MS) + THEME_CYCLE_MS) % THEME_CYCLE_MS;
  const index = Math.floor(pos / SLOT_MS);
  const within = pos - index * SLOT_MS;

  const cur = SOLID_HSL[index];

  // Holding the current color.
  if (within <= HOLD_MS) {
    return `hsl(${cur[0]}, ${cur[1]}%, ${cur[2]}%)`;
  }

  // Cross-fading into the next pair over FADE_MS.
  const next = SOLID_HSL[(index + 1) % n];
  const t = (within - HOLD_MS) / FADE_MS;
  const h = lerpHue(cur[0], next[0], t);
  const s = lerp(cur[1], next[1], t);
  const l = lerp(cur[2], next[2], t);
  return `hsl(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`;
}

// color1 / color2 of each pair as [h, s, l] for the full-gradient JS driver
// (the Safari low-fps loop writes all three theme variables).
const COLOR1_HSL: [number, number, number][] = [
  [220, 100, 50],
  [30, 100, 55],
  [320, 100, 55],
  [190, 100, 50],
  [240, 100, 55],
];
const COLOR2_HSL: [number, number, number][] = [
  [120, 100, 50],
  [0, 100, 60],
  [270, 100, 60],
  [140, 100, 50],
  [320, 100, 60],
];

const hslStr = (c: [number, number, number]) => `hsl(${c[0]}, ${c[1]}%, ${c[2]}%)`;

function mixHsl(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): string {
  const h = lerpHue(a[0], b[0], t);
  const s = lerp(a[1], b[1], t);
  const l = lerp(a[2], b[2], t);
  return `hsl(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`;
}

export interface ThemeColors {
  color: string;
  color1: string;
  color2: string;
}

// All three theme colors for a timestamp, mirroring the same schedule as
// themeColorAt. Used by the Safari JS driver so the whole gradient stays in sync.
export function themeColorsAt(now: number): ThemeColors {
  const n = gradientPairs.length;
  const pos = ((now % THEME_CYCLE_MS) + THEME_CYCLE_MS) % THEME_CYCLE_MS;
  const index = Math.floor(pos / SLOT_MS);
  const within = pos - index * SLOT_MS;

  if (within <= HOLD_MS) {
    return {
      color: hslStr(SOLID_HSL[index]),
      color1: hslStr(COLOR1_HSL[index]),
      color2: hslStr(COLOR2_HSL[index]),
    };
  }

  const ni = (index + 1) % n;
  const t = (within - HOLD_MS) / FADE_MS;
  return {
    color: mixHsl(SOLID_HSL[index], SOLID_HSL[ni], t),
    color1: mixHsl(COLOR1_HSL[index], COLOR1_HSL[ni], t),
    color2: mixHsl(COLOR2_HSL[index], COLOR2_HSL[ni], t),
  };
}
