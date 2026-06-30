// Theme Gradient Playground — component gallery
// ---------------------------------------------------------------------------
// Mirrors the real site's themed components (headline, button, input, view-more
// link, music card) and drives them all from ONE moving gradient instead of the
// JS-cycled --theme-color* variables:
//
//   - text (headline, price)         -> gradient clipped to the text
//   - fills (button, purchase, play, -> moving gradient background
//     progress)
//   - glows (box-shadow)             -> a single color that cycles through the
//                                       palette IN SYNC with the gradient motion
//
// No borders on buttons (matches the real site). The music card keeps its WHITE
// edge border. Hover on buttons flips to black + glow, like the real site.
//
// Each stop's color is HEX (canonical, exact). `pos` is px; the last stop's
// position is the loop period.

// Seeded from colors-01.svg.
const state = {
  angleDeg: 180,
  holdSec: 3,   // hold on each step's color for this long
  transSec: 1,  // glide to the next step over this long
  steps: 4,     // number of holds per loop (0%, 25%, 50%, 75% -> 4)
  glowBlur: 10,     // px — box-shadow blur radius
  glowStrength: 100, // % — box-shadow color opacity
  outlineBlur: 10,   // px — blur of the card's cycling gradient outline
  outlineThick: 3,   // px — thickness of that outline ring
  outlineStrength: 100, // % — opacity of the outline
  stops: [
    { hex: "#6BBF5F", pos: 0 },   // green
    { hex: "#45C7F0", pos: 120 }, // blue
    { hex: "#8455A2", pos: 259 }, // purple
    { hex: "#BA499B", pos: 394 }, // pink
    { hex: "#EF3835", pos: 500 }, // red
    { hex: "#F26831", pos: 612 }, // orange
    { hex: "#6BBF5F", pos: 698 }, // green again — seamless seam
  ],
};

const $ = (id) => document.getElementById(id);

// Star field — same hand-picked spread/timings as the real ZoomingStars.
const STARS = [
  { x: 6, y: 14, size: 22, delay: 0, duration: 9 },
  { x: 17, y: 70, size: 16, delay: 2.4, duration: 11 },
  { x: 27, y: 33, size: 26, delay: 5.1, duration: 8 },
  { x: 38, y: 82, size: 14, delay: 1.2, duration: 12 },
  { x: 46, y: 21, size: 20, delay: 3.7, duration: 10 },
  { x: 55, y: 58, size: 24, delay: 6.3, duration: 9 },
  { x: 63, y: 9, size: 15, delay: 0.8, duration: 13 },
  { x: 71, y: 44, size: 27, delay: 4.5, duration: 8 },
  { x: 79, y: 76, size: 18, delay: 2.0, duration: 11 },
  { x: 88, y: 28, size: 21, delay: 5.8, duration: 10 },
  { x: 93, y: 62, size: 16, delay: 1.6, duration: 12 },
  { x: 12, y: 47, size: 19, delay: 7.0, duration: 9 },
  { x: 33, y: 6, size: 23, delay: 3.1, duration: 10 },
  { x: 50, y: 90, size: 17, delay: 6.8, duration: 8 },
  { x: 67, y: 86, size: 25, delay: 0.4, duration: 13 },
  { x: 84, y: 52, size: 14, delay: 4.0, duration: 11 },
  { x: 22, y: 90, size: 20, delay: 2.7, duration: 9 },
  { x: 58, y: 35, size: 18, delay: 5.4, duration: 12 },
  { x: 76, y: 18, size: 22, delay: 1.0, duration: 10 },
  { x: 3, y: 84, size: 15, delay: 6.0, duration: 11 },
];
function renderStars() {
  const c = $("stars");
  c.innerHTML = STARS.map(
    (s) => `<div class="zooming-star" style="left:${s.x}%;top:${s.y}%;width:${s.size}px;height:${s.size}px;animation-delay:${s.delay}s;animation-duration:${s.duration}s">
      <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
        <path d="M52,26c-23.9,1.2-24.8,2.1-26,26c-1.2-23.9-2.1-24.8-26-26c23.9-1.2,24.8-2.1,26-26C27.2,23.9,28.1,24.8,52,26z" fill="currentColor"/>
      </svg>
    </div>`
  ).join("");
}

const stopsEl = $("stops");
const styleEl = document.createElement("style");
document.head.appendChild(styleEl);

const periodPx = () => state.stops[state.stops.length - 1].pos || 1;

// HEX <-> HSL so the sliders and the hex picker stay in sync.
function hslToHex(h, s, l) {
  const s1 = s / 100, l1 = l / 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s1 * Math.min(l1, 1 - l1);
  const f = (n) => l1 - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  const hex = (x) => Math.round(255 * x).toString(16).padStart(2, "0");
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
}
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function gradientCSS() {
  const stops = state.stops.map((c) => `${c.hex} ${c.pos}px`).join(", ");
  return `repeating-linear-gradient(${state.angleDeg}deg, ${stops})`;
}

// The exact gradient color at a position (px) along the period — lets us read
// "which color is showing" at each held step and reuse it for the outline/glow.
const hexToRgb = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
const rgbToHex = (r, g, b) => {
  const t = (x) => Math.round(x).toString(16).padStart(2, "0");
  return `#${t(r)}${t(g)}${t(b)}`;
};
function sampleAt(pos) {
  const s = state.stops;
  if (pos <= s[0].pos) return s[0].hex;
  for (let i = 0; i < s.length - 1; i++) {
    if (pos >= s[i].pos && pos <= s[i + 1].pos) {
      const span = s[i + 1].pos - s[i].pos || 1;
      const t = (pos - s[i].pos) / span;
      const a = hexToRgb(s[i].hex);
      const b = hexToRgb(s[i + 1].hex);
      return rgbToHex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
    }
  }
  return s[s.length - 1].hex;
}

function apply() {
  const grad = gradientCSS();
  const period = periodPx();
  const steps = state.steps;
  const unit = state.holdSec + state.transSec; // one step = hold + transition
  const dur = steps * unit;                     // full loop time
  const total = dur;

  // Stepped timing: at each step i, hold for holdSec, then glide to the next
  // quarter over transSec. The SAME keyframe %s drive every animation, so the
  // background, glows and outline all hold and move together.
  const stepped = (declAt, endDecl) => {
    const rows = [];
    for (let i = 0; i < steps; i++) {
      const tStart = ((i * unit) / total) * 100;
      const tEnd = ((i * unit + state.holdSec) / total) * 100;
      rows.push(`${tStart.toFixed(2)}% { ${declAt(i)} }`);
      rows.push(`${tEnd.toFixed(2)}% { ${declAt(i)} }`);
    }
    rows.push(`100% { ${endDecl} }`);
    return rows.join("\n      ");
  };

  const posOf = (i) => (i / steps) * period;   // background-position held at step i
  const colorOf = (i) => sampleAt(posOf(i));   // the gradient color showing there
  const alpha = Math.round((state.glowStrength / 100) * 255)
    .toString(16)
    .padStart(2, "0");

  // Negative position so the color shown at the element's TOP equals
  // sampleAt(posOf(i)) — the same value the outline/glow use, keeping them in sync.
  const flowY = stepped(
    (i) => `background-position: 0 ${(-posOf(i)).toFixed(1)}px;`,
    `background-position: 0 ${(-period).toFixed(1)}px;`
  );
  const bgCycle = stepped(
    (i) => `background-color: ${colorOf(i)};`,
    `background-color: ${sampleAt(period)};`
  );
  const borderCycle = stepped(
    (i) => `border-color: ${colorOf(i)};`,
    `border-color: ${sampleAt(period)};`
  );
  const glowCycle = stepped(
    (i) => `box-shadow: 0 0 ${state.glowBlur}px ${colorOf(i)}${alpha};`,
    `box-shadow: 0 0 ${state.glowBlur}px ${sampleAt(period)}${alpha};`
  );
  const cardGlowCycle = stepped(
    (i) => `box-shadow: 0 0 16px ${colorOf(i)}, 0 0 34px ${colorOf(i)}80;`,
    `box-shadow: 0 0 16px ${sampleAt(period)}, 0 0 34px ${sampleAt(period)}80;`
  );

  // Buttons / text / fills KEEP the moving gradient ("color background effect").
  const fill = `
      background-image: ${grad};
      background-size: 100% ${period}px;
      background-repeat: repeat;
      background-position: 0 0;`;

  const a = `${dur}s ease-in-out infinite`; // shared timing for everything

  styleEl.textContent = `
    @keyframes flowY        { ${flowY} }
    @keyframes bgCycle      { ${bgCycle} }
    @keyframes borderCycle  { ${borderCycle} }
    @keyframes glowCycle    { ${glowCycle} }
    @keyframes cardGlowCycle { ${cardGlowCycle} }

    /* moving-gradient reference */
    #preview-bg {${fill}
      animation: flowY ${a};
    }

    /* gradient TEXT: headline, price, view-more hover, playing title */
    .pg-headline, .pg-price, .pg-viewmore:hover, .pg-card-playing .pg-card-title {${fill}
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      -webkit-text-fill-color: transparent;
      animation: flowY ${a};
    }

    /* gradient FILLS + synced glow: buttons, play */
    .pg-btn, .pg-purchase, .pg-play {${fill}
      animation: flowY ${a}, glowCycle ${a};
    }
    .pg-progress-fill {${fill}
      animation: flowY ${a};
    }

    /* hover flips to black but keeps the (synced) glow. We DON'T touch the
       animation here: flowY keeps running underneath (no-op on a solid color)
       and glowCycle keeps the glow going, so leaving hover doesn't restart the
       cycle back to the first color. .pg-btn-hover is a frozen hover copy. */
    .pg-btn:hover, .pg-btn-hover, .pg-purchase:hover {
      background-image: none;
      background-color: #000;
      color: #cfcfcf;
    }

    /* "playing" card: bigger pulsing glow, synced to the held color */
    .pg-card-playing {
      animation: cardGlowCycle ${a};
    }

    /* card outline: SOLID, equal to the color held at each step, blurred */
    .pg-card-glow {
      filter: blur(${state.outlineBlur}px);
      opacity: ${state.outlineStrength / 100};
    }
    .pg-card-glow::before {
      padding: ${state.outlineThick}px;
      background-color: ${colorOf(0)};
      animation: bgCycle ${a};
    }

    /* view-more underline: moving gradient */
    .pg-viewmore::before {${fill}
      animation: flowY ${a};
    }
    .pg-viewmore:hover::before { width: 100%; }

    /* input focus: synced border + glow */
    .pg-input:focus {
      animation: borderCycle ${a}, glowCycle ${a};
      background: rgba(255,255,255,.08);
    }
  `;

  state.stops.forEach((c, i) => {
    const sw = document.querySelector(`.stop[data-i="${i}"] .swatch`);
    if (sw) sw.value = c.hex;
  });
  updateJSON();
}

function updateJSON() {
  const period = periodPx();
  const holdColors = [];
  for (let i = 0; i < state.steps; i++) holdColors.push(sampleAt((i / state.steps) * period));
  const out = {
    angleDeg: state.angleDeg,
    timing: { holdSec: state.holdSec, transSec: state.transSec, steps: state.steps, loopSec: state.steps * (state.holdSec + state.transSec) },
    periodPx: period,
    holdColors, // the color held at each step (0%, 25%, ...) — used for the outline
    glow: { blur: state.glowBlur, strength: state.glowStrength },
    outline: {
      blur: state.outlineBlur,
      thickness: state.outlineThick,
      strength: state.outlineStrength,
    },
    stops: state.stops.map((c) => ({ hex: c.hex, pos: c.pos })),
  };
  $("json").value = JSON.stringify(out, null, 2);
}

function makeStopRow(c, i) {
  const row = document.createElement("div");
  row.className = "stop";
  row.dataset.i = i;

  const { h, s, l } = hexToHsl(c.hex);
  const vals = { h, s, l };

  const slider = (label, key, min, max, suffix) => `
    <div class="mini">
      <label>${label} <span data-out="${key}">${vals[key]}${suffix}</span></label>
      <input type="range" data-key="${key}" min="${min}" max="${max}" value="${vals[key]}" />
    </div>`;

  row.innerHTML = `
    <div class="stop-head">
      <input type="color" class="swatch" value="${c.hex}" title="Pick / paste a hex color" />
      <strong style="font-size:12px;">Stop ${i + 1}</strong>
      <span class="pos">pos <input type="number" data-key="pos" value="${c.pos}" /> px</span>
      <button class="remove" title="Remove">×</button>
    </div>
    ${slider("Hue", "h", 0, 360, "°")}
    ${slider("Saturation", "s", 0, 100, "%")}
    ${slider("Lightness", "l", 0, 100, "%")}
  `;

  const readHsl = () => ({
    h: Number(row.querySelector('input[data-key="h"]').value),
    s: Number(row.querySelector('input[data-key="s"]').value),
    l: Number(row.querySelector('input[data-key="l"]').value),
  });
  const setOut = (key, val, suffix) => {
    const out = row.querySelector(`[data-out="${key}"]`);
    if (out) out.textContent = val + suffix;
  };

  row.querySelectorAll('input[data-key="h"], input[data-key="s"], input[data-key="l"]')
    .forEach((input) => {
      input.addEventListener("input", () => {
        const key = input.dataset.key;
        setOut(key, input.value, key === "h" ? "°" : "%");
        const { h, s, l } = readHsl();
        state.stops[i].hex = hslToHex(h, s, l);
        apply();
      });
    });

  row.querySelector('input[data-key="pos"]').addEventListener("input", (e) => {
    state.stops[i].pos = Number(e.target.value);
    apply();
  });

  row.querySelector(".swatch").addEventListener("input", (e) => {
    state.stops[i].hex = e.target.value;
    const next = hexToHsl(e.target.value);
    row.querySelector('input[data-key="h"]').value = next.h;
    row.querySelector('input[data-key="s"]').value = next.s;
    row.querySelector('input[data-key="l"]').value = next.l;
    setOut("h", next.h, "°");
    setOut("s", next.s, "%");
    setOut("l", next.l, "%");
    apply();
  });

  row.querySelector(".remove").addEventListener("click", () => {
    if (state.stops.length <= 2) return;
    state.stops.splice(i, 1);
    renderStops();
    apply();
  });

  return row;
}

function renderStops() {
  stopsEl.innerHTML = "";
  state.stops.forEach((c, i) => stopsEl.appendChild(makeStopRow(c, i)));
}

// ---- global controls ----
$("angle").addEventListener("input", (e) => {
  state.angleDeg = Number(e.target.value);
  $("angleVal").textContent = state.angleDeg + "°";
  apply();
});
$("hold").addEventListener("input", (e) => {
  state.holdSec = Number(e.target.value);
  $("holdVal").textContent = state.holdSec + "s";
  apply();
});
$("trans").addEventListener("input", (e) => {
  state.transSec = Number(e.target.value);
  $("transVal").textContent = state.transSec + "s";
  apply();
});
$("steps").addEventListener("input", (e) => {
  state.steps = Number(e.target.value);
  $("stepsVal").textContent = state.steps;
  apply();
});
$("glowBlur").addEventListener("input", (e) => {
  state.glowBlur = Number(e.target.value);
  $("glowBlurVal").textContent = state.glowBlur + "px";
  apply();
});
$("glowStrength").addEventListener("input", (e) => {
  state.glowStrength = Number(e.target.value);
  $("glowStrengthVal").textContent = state.glowStrength + "%";
  apply();
});
$("outlineBlur").addEventListener("input", (e) => {
  state.outlineBlur = Number(e.target.value);
  $("outlineBlurVal").textContent = state.outlineBlur + "px";
  apply();
});
$("outlineThick").addEventListener("input", (e) => {
  state.outlineThick = Number(e.target.value);
  $("outlineThickVal").textContent = state.outlineThick + "px";
  apply();
});
$("outlineStrength").addEventListener("input", (e) => {
  state.outlineStrength = Number(e.target.value);
  $("outlineStrengthVal").textContent = state.outlineStrength + "%";
  apply();
});
$("add").addEventListener("click", () => {
  const last = state.stops[state.stops.length - 1];
  state.stops.push({ hex: last.hex, pos: last.pos + 80 });
  renderStops();
  apply();
});
$("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("json").value);
    const btn = $("copy");
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = "Copy"), 1200);
  } catch {
    $("json").select();
  }
});

// init
renderStars();
renderStops();
apply();
