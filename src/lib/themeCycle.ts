// Single source of truth for the auto theme-color cycle.
//
// The cycle is driven by a throttled JS loop (see ColorToggleContext) that
// writes plain --theme-color* variables to :root. We deliberately do NOT use a
// CSS @property animation: on iOS Safari a long-running registered-property
// animation leaks engine memory until the tab is reloaded ("significant
// memory"). Writing a plain custom property is a one-shot value change with no
// persistent animation state, so it doesn't accumulate.
//
// This module computes the exact color for any timestamp so both the writer and
// the canvas consumers (ParallaxStars) stay in sync from one schedule: 5 pairs,
// `slotMs` each, holding 5/8 of the slot then cross-fading the final 3/8.

export interface GradientPair {
  color1: string;
  color2: string;
  solid: string;
}

// The five color pairs cycled through, in order.
export const gradientPairs: GradientPair[] = [
  { color1: "hsl(220, 100%, 50%)", color2: "hsl(120, 100%, 50%)", solid: "hsl(220, 100%, 50%)" },
  { color1: "hsl(30, 100%, 55%)", color2: "hsl(0, 100%, 60%)", solid: "hsl(30, 100%, 55%)" },
  { color1: "hsl(320, 100%, 55%)", color2: "hsl(270, 100%, 60%)", solid: "hsl(320, 100%, 55%)" },
  { color1: "hsl(190, 100%, 50%)", color2: "hsl(140, 100%, 50%)", solid: "hsl(190, 100%, 50%)" },
  { color1: "hsl(240, 100%, 55%)", color2: "hsl(320, 100%, 60%)", solid: "hsl(240, 100%, 55%)" },
];

type Hsl = [number, number, number];

// Each pair's [solid, color1, color2] as HSL tuples for interpolation.
const PAIRS_HSL: { solid: Hsl; color1: Hsl; color2: Hsl }[] = [
  { solid: [220, 100, 50], color1: [220, 100, 50], color2: [120, 100, 50] },
  { solid: [30, 100, 55], color1: [30, 100, 55], color2: [0, 100, 60] },
  { solid: [320, 100, 55], color1: [320, 100, 55], color2: [270, 100, 60] },
  { solid: [190, 100, 50], color1: [190, 100, 50], color2: [140, 100, 50] },
  { solid: [240, 100, 55], color1: [240, 100, 55], color2: [320, 100, 60] },
];

// Default schedule (also the values ColorSlider reads).
export const SLOT_MS = 8000; // time per pair
export const THEME_CYCLE_MS = SLOT_MS * gradientPairs.length; // 40s full period
const HOLD_FRACTION = 5 / 8; // steady portion of each slot; fade is the rest

// Active slot duration. Mutable so the ?fast test flag can shorten the cycle.
// ParallaxStars and the writer both read this, so they stay in sync.
let slotMs = SLOT_MS;
export function setSlotMs(ms: number) {
  slotMs = ms;
}
export function getCycleMs() {
  return slotMs * PAIRS_HSL.length;
}

// Interpolate hue the short way so the color tracks browser-like hsl blending.
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

function mix(a: Hsl, b: Hsl, t: number): string {
  const h = lerpHue(a[0], b[0], t);
  const s = lerp(a[1], b[1], t);
  const l = lerp(a[2], b[2], t);
  return `hsl(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`;
}

const hsl = (c: Hsl) => `hsl(${c[0]}, ${c[1]}%, ${c[2]}%)`;

export interface ThemeColors {
  color: string;
  color1: string;
  color2: string;
}

// All three theme colors for a given timestamp (e.g. performance.now()).
export function themeColorsAt(now: number): ThemeColors {
  const n = PAIRS_HSL.length;
  const cycle = slotMs * n;
  const pos = ((now % cycle) + cycle) % cycle;
  const index = Math.floor(pos / slotMs);
  const within = pos - index * slotMs;
  const hold = slotMs * HOLD_FRACTION;

  const cur = PAIRS_HSL[index];
  if (within <= hold) {
    return { color: hsl(cur.solid), color1: hsl(cur.color1), color2: hsl(cur.color2) };
  }

  const next = PAIRS_HSL[(index + 1) % n];
  const t = (within - hold) / (slotMs - hold);
  return {
    color: mix(cur.solid, next.solid, t),
    color1: mix(cur.color1, next.color1, t),
    color2: mix(cur.color2, next.color2, t),
  };
}

// Just the solid theme color for a timestamp.
export function themeColorAt(now: number): string {
  return themeColorsAt(now).color;
}

// The latest solid color the theme driver wrote. Canvas consumers read this so
// they match whatever the page is currently showing — cycling while music
// plays, or frozen on the last color when it stops. Avoids any DOM read.
let liveSolid = hsl(PAIRS_HSL[0].solid);
export function setLiveSolid(c: string) {
  liveSolid = c;
}
export function getLiveSolid() {
  return liveSolid;
}
