// ================================================================
//  T.HENDO — Branding Post Creator
//  Colour system ported from ColorToggleContext.tsx
//  Star animations from ParallaxStars.tsx + ZoomingStars.tsx
// ================================================================
'use strict';

// ── Colour palette — identical to ColorToggleContext.tsx ──────
const GRADIENT_PAIRS = [
  { c1: 'hsl(220,100%,50%)',  c2: 'hsl(120,100%,50%)' },  // blue → green
  { c1: 'hsl(30,100%,55%)',   c2: 'hsl(0,100%,60%)'   },  // orange → red
  { c1: 'hsl(320,100%,55%)',  c2: 'hsl(270,100%,60%)' },  // pink → purple
  { c1: 'hsl(190,100%,50%)',  c2: 'hsl(140,100%,50%)' },  // cyan → teal
  { c1: 'hsl(240,100%,55%)',  c2: 'hsl(320,100%,60%)' },  // indigo → pink
];
const COLOR_CYCLE_MS = 8000; // match main site (8 s)

// ── Canvas ────────────────────────────────────────────────────
const canvas = document.getElementById('postCanvas');
const ctx    = canvas.getContext('2d');

// 4-point star path (52×52, from ZoomingStars.tsx)
const STAR_PATH = new Path2D(
  'M52,26c-23.9,1.2-24.8,2.1-26,26' +
  'c-1.2-23.9-2.1-24.8-26-26' +
  'c23.9-1.2,24.8-2.1,26-26' +
  'C27.2,23.9,28.1,24.8,52,26z'
);

// ── Formats ───────────────────────────────────────────────────
const FORMATS = { feed: { w: 1080, h: 1080 }, story: { w: 1080, h: 1920 } };

// ── App state ─────────────────────────────────────────────────
const S = {
  // canvas size
  format:  'feed',
  cW: 1080, cH: 1080,

  // playback
  playing: true,

  // global hue offset for gradient text animation
  hue: 0,

  // colour palette cycling
  pairIndex:    0,
  pairProgress: 0, // 0..1 lerp between current and next pair

  // star settings
  shootingCount:  8,
  blinkingCount:  20,
  speed:          1.0,
  shootColorMode: 'white',  // 'white' | 'cycle' | 'mixed'
  blinkColorMode: 'white',  // 'white' | 'cycle' | 'mixed'
  dropMode:       'top',    // 'top' | 'all'

  // text settings
  text:          '',
  fontSize:      60,
  fontFamily:    'LemonMilk',
  textColorMode: 'gradient', // 'gradient' | 'cycle' | 'white' | 'solid'
  solidColor:    '#ffffff',
  textPosY:      50,

  // star arrays
  bgStars:      [],
  blinkStars:   [],
  shootStars:   [],

  // saved moments
  moments: [],
};

// ── Utilities ─────────────────────────────────────────────────
const rand    = (a, b) => a + Math.random() * (b - a);
const lerp    = (a, b, t) => a + (b - a) * t;

/** Parse "hsl(H,S%,L%)" → [h, s, l] */
function parseHSL(str) {
  const m = str.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/);
  return m ? [+m[1], +m[2], +m[3]] : [0, 100, 50];
}

/** Interpolate two hsl() strings and return hsl() string */
function lerpHSL(strA, strB, t) {
  const [h1, s1, l1] = parseHSL(strA);
  const [h2, s2, l2] = parseHSL(strB);
  // shortest-path hue interpolation
  let dh = h2 - h1;
  if (dh > 180)  dh -= 360;
  if (dh < -180) dh += 360;
  return `hsl(${(h1 + dh * t + 360) % 360},${lerp(s1,s2,t)}%,${lerp(l1,l2,t)}%)`;
}

/** Current interpolated accent colours */
function accentColors() {
  const cur  = GRADIENT_PAIRS[S.pairIndex];
  const next = GRADIENT_PAIRS[(S.pairIndex + 1) % GRADIENT_PAIRS.length];
  const t    = S.pairProgress;
  return {
    c1: lerpHSL(cur.c1, next.c1, t),
    c2: lerpHSL(cur.c2, next.c2, t),
  };
}

/** Pick a colour for a star given a mode string and per-star index */
function resolveStarColor(mode, mixedIndex) {
  if (mode === 'white') return 'rgba(255,255,255,0.92)';
  if (mode === 'cycle') return accentColors().c1;
  // mixed — each star gets a different palette colour
  return GRADIENT_PAIRS[mixedIndex % GRADIENT_PAIRS.length].c1;
}

const shootColor = idx => resolveStarColor(S.shootColorMode, idx);
const blinkColor = idx => resolveStarColor(S.blinkColorMode, idx);

// ── UI accent update (CSS vars → header, buttons, sliders) ─────
function applyAccentToUI() {
  const { c1, c2 } = accentColors();
  const root = document.documentElement;
  root.style.setProperty('--ac1', c1);
  root.style.setProperty('--ac2', c2);
}

// ── Colour cycling timer (matches site behaviour) ─────────────
let lastColorTick = Date.now();

function tickColors(dt) {
  // dt in ms
  S.pairProgress += dt / COLOR_CYCLE_MS;
  if (S.pairProgress >= 1) {
    S.pairProgress -= 1;
    S.pairIndex = (S.pairIndex + 1) % GRADIENT_PAIRS.length;
  }
  applyAccentToUI();
}

// ── Load Lemon Milk into canvas font system ───────────────────
(function loadLemonMilk() {
  // Paths are relative to the HTML document location
  [
    { url: '../../public/fonts/LEMONMILK-Medium.woff2', weight: '500' },
    { url: '../../public/fonts/LEMONMILK-Bold.woff2',   weight: '700' },
  ].forEach(({ url, weight }) => {
    const f = new FontFace('LemonMilk', `url(${url})`, { weight, style: 'normal' });
    f.load().then(loaded => document.fonts.add(loaded)).catch(() => {/* fallback silently */});
  });
})();

// ── Background tiny stars (ParallaxStars style) ───────────────
function initBgStars() {
  const count = Math.min(Math.floor((S.cW * S.cH) / 2500), 700);
  S.bgStars = Array.from({ length: count }, () => ({
    x: rand(0, S.cW), y: rand(0, S.cH),
    size: rand(0.5, 2), opacity: rand(0.12, 0.7),
  }));
}

function drawBgStars() {
  for (const s of S.bgStars) {
    ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }
}

// ── Blinking / zooming stars (ZoomingStars style) ─────────────
function makeBlink(idx) {
  return {
    idx,
    x: rand(0, S.cW), y: rand(0, S.cH),
    size: rand(12, 30),
    phase: Math.random(),
    spd:   rand(0.0015, 0.004),
  };
}

function setBlinkCount(n) {
  while (S.blinkStars.length < n)
    S.blinkStars.push(makeBlink(S.blinkStars.length));
  S.blinkStars.length = n;
}

/** ZoomingStars lifecycle: grow → stay → shrink */
function blinkPhase(p) {
  if      (p < 0.50) { const t = p/0.50; return { s: t,   o: t   }; }
  else if (p < 0.70) {                   return { s: 1,   o: 1   }; }
  else if (p < 0.95) { const t = (p-0.70)/0.25; return { s:1-t, o:1-t }; }
  return { s: 0, o: 0 };
}

function drawBlink(star) {
  const { s, o } = blinkPhase(star.phase);
  if (s <= 0.01 || o <= 0.01) return;

  const col = blinkColor(star.idx);
  const px  = star.size * s;
  const k   = px / 52;

  ctx.save();
  ctx.globalAlpha = o;
  ctx.fillStyle   = col;
  ctx.shadowColor = col;
  ctx.shadowBlur  = 10;
  ctx.translate(star.x, star.y);
  ctx.scale(k, k);
  ctx.translate(-26, -26);
  ctx.fill(STAR_PATH);
  ctx.restore();
}

// ── Shooting / falling stars (ParallaxStars ShootingStar) ─────

/**
 * Pick a spawn edge and return starting position + unit direction vector.
 * Stars always travel *downward* (vy = +1) so they never come from the bottom.
 *  top   → falls diagonally left or right
 *  left  → enters from left, travels right-down
 *  right → enters from right, travels left-down
 */
function spawnEdge(randomInit) {
  const { cW, cH, dropMode } = S;
  const edge = dropMode === 'all'
    ? ['top', 'left', 'right'][Math.floor(Math.random() * 3)]
    : 'top';

  if (randomInit) {
    // Top-only keeps original left-down direction; all-sides uses random direction
    const vx = dropMode === 'all' ? (Math.random() > 0.5 ? -1 : 1) : -1;
    return { x: rand(0, cW), y: rand(0, cH * 0.5), vx, vy: 1 };
  }

  if (edge === 'left')  return { x: rand(-20, 0),      y: rand(0, cH * 0.8), vx:  1, vy: 1 };
  if (edge === 'right') return { x: rand(cW, cW + 20), y: rand(0, cH * 0.8), vx: -1, vy: 1 };
  // top — always left-down, matching the original ParallaxStars behaviour
  return { x: rand(0, cW), y: -20, vx: -1, vy: 1 };
}

function makeShoot(randomInit, idx) {
  const { x, y, vx, vy } = spawnEdge(randomInit);
  return {
    idx, x, y, vx, vy,
    len:    rand(50, 130),
    spd:    rand(6, 16),
    sz:     rand(0.5, 2.0),
    active: randomInit ? Math.random() > 0.4 : false,
    waitMs: Date.now() + rand(300, 3500),
  };
}

function setShootCount(n) {
  while (S.shootStars.length < n)
    S.shootStars.push(makeShoot(false, S.shootStars.length));
  S.shootStars.length = n;
}

function updateShoot(s) {
  if (s.active) {
    const v = s.spd * S.speed;
    s.x += s.vx * v;
    s.y += s.vy * v;

    const gone =
      s.y > S.cH + s.len ||
      (s.vx < 0 && s.x < -s.len) ||
      (s.vx > 0 && s.x > S.cW + s.len);

    if (gone) Object.assign(s, makeShoot(false, s.idx));
  } else if (Date.now() >= s.waitMs) {
    s.active = true;
  }
}

function drawShoot(s) {
  if (!s.active) return;
  const col = shootColor(s.idx);

  // Trail extends opposite to travel direction
  const trailX = s.x - s.vx * s.len;
  const trailY = s.y - s.vy * s.len;

  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = col;
  ctx.lineWidth   = s.sz;
  ctx.shadowColor = col;
  ctx.shadowBlur  = 8;
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);       // tip  (leading edge)
  ctx.lineTo(trailX, trailY); // tail (fading behind)
  ctx.stroke();

  // bright tip
  ctx.fillStyle   = 'rgba(255,255,255,0.95)';
  ctx.shadowColor = '#fff';
  ctx.shadowBlur  = 14;
  ctx.beginPath();
  ctx.arc(s.x, s.y, s.sz * 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Text rendering ────────────────────────────────────────────
function drawText() {
  if (!S.text.trim()) return;

  const scale = S.cW / 1080;
  const px    = S.fontSize * scale;
  const font  = `700 ${px}px ${S.fontFamily},sans-serif`;

  ctx.font         = font;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  const lines  = S.text.split('\n');
  const lineH  = px * 1.3;
  const blockH = lines.length * lineH;
  const baseY  = (S.cH * S.textPosY / 100) - blockH / 2 + lineH / 2;

  lines.forEach((line, i) => {
    if (!line.trim()) return;
    const y   = baseY + i * lineH;
    const x   = S.cW / 2;
    const mW  = ctx.measureText(line).width;

    // shadow pass for legibility
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur  = px * 0.55;
    ctx.fillStyle   = 'rgba(0,0,0,0.35)';
    ctx.font        = font;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(line, x, y);
    ctx.restore();

    // colour pass
    let fill;
    if (S.textColorMode === 'gradient') {
      const g = ctx.createLinearGradient(x - mW/2, y, x + mW/2, y);
      g.addColorStop(0.00, `hsl(${S.hue},100%,65%)`);
      g.addColorStop(0.33, `hsl(${(S.hue+110)%360},100%,65%)`);
      g.addColorStop(0.66, `hsl(${(S.hue+220)%360},100%,65%)`);
      g.addColorStop(1.00, `hsl(${(S.hue+330)%360},100%,65%)`);
      fill = g;
    } else if (S.textColorMode === 'cycle') {
      const { c1, c2 } = accentColors();
      const g = ctx.createLinearGradient(x - mW/2, y, x + mW/2, y);
      g.addColorStop(0, c1);
      g.addColorStop(1, c2);
      fill = g;
    } else if (S.textColorMode === 'white') {
      fill = '#ffffff';
    } else {
      fill = S.solidColor;
    }

    ctx.save();
    ctx.font         = font;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = fill;
    ctx.shadowColor  = (S.textColorMode === 'white' || S.textColorMode === 'solid')
      ? 'rgba(0,0,0,0.5)'
      : accentColors().c1;
    ctx.shadowBlur   = px * 0.35;
    ctx.fillText(line, x, y);
    ctx.restore();
  });
}

// ── Main loop ─────────────────────────────────────────────────
let lastFrame = performance.now();

function loop(now) {
  const dt = now - lastFrame;
  lastFrame = now;

  // Always tick colours so UI stays live
  tickColors(dt);

  if (S.playing) {
    // advance animations
    S.hue = (S.hue + 0.25 * S.speed) % 360;
    for (const s of S.blinkStars) s.phase = (s.phase + s.spd * S.speed) % 1;
    for (const s of S.shootStars) updateShoot(s);
  }

  // render
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, S.cW, S.cH);
  drawBgStars();
  for (const s of S.blinkStars) drawBlink(s);
  for (const s of S.shootStars) drawShoot(s);
  drawText();

  requestAnimationFrame(loop);
}

// ── Canvas display fit ────────────────────────────────────────
function fitCanvas() {
  const wrap = document.getElementById('canvasContainer');
  const maxW = wrap.clientWidth   - 4;
  const maxH = window.innerHeight * 0.68;
  const ratio = S.cW / S.cH;

  let dW = maxW;
  let dH = dW / ratio;
  if (dH > maxH) { dH = maxH; dW = dH * ratio; }

  canvas.style.width  = `${Math.round(dW)}px`;
  canvas.style.height = `${Math.round(dH)}px`;
}

// ── Segmented controls helper ─────────────────────────────────
function initSegCtrl(id, onChange) {
  const el = document.getElementById(id);
  el.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(btn.dataset.value);
    });
  });
}

// ── Saved moments ─────────────────────────────────────────────
function renderMoments() {
  const list = document.getElementById('momentsList');
  list.innerHTML = '';
  S.moments.forEach((m, idx) => {
    const item = document.createElement('div');
    item.className = 'moment-item';

    const img = document.createElement('img');
    img.src = m.dataURL; img.className = 'moment-thumb'; img.title = m.label;

    const info = document.createElement('div');
    info.className = 'moment-info';

    const lbl = document.createElement('span');
    lbl.className = 'moment-label'; lbl.textContent = m.label;

    const btns = document.createElement('div');
    btns.className = 'moment-btns';

    const dl = document.createElement('button');
    dl.className = 'action-btn small'; dl.textContent = '⬇ Download';
    dl.addEventListener('click', () => {
      const a = document.createElement('a');
      a.download = `thendo-moment-${m.id}.png`; a.href = m.dataURL; a.click();
    });

    const del = document.createElement('button');
    del.className = 'action-btn small danger'; del.textContent = '✕';
    del.addEventListener('click', () => { S.moments.splice(idx, 1); renderMoments(); });

    btns.appendChild(dl); btns.appendChild(del);
    info.appendChild(lbl); info.appendChild(btns);
    item.appendChild(img); item.appendChild(info);
    list.appendChild(item);
  });
}

// ── Controls wiring ───────────────────────────────────────────
function setupControls() {

  // Format buttons
  document.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fmt = btn.dataset.format;
      S.format = fmt; S.cW = FORMATS[fmt].w; S.cH = FORMATS[fmt].h;
      canvas.width = S.cW; canvas.height = S.cH;
      initBgStars();
      S.blinkStars = []; setBlinkCount(S.blinkingCount);
      S.shootStars = []; setShootCount(S.shootingCount);
      document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      fitCanvas();
    });
  });

  // Play / Pause — single toggle button
  const ppBtn   = document.getElementById('playPauseBtn');
  const ppLabel = document.getElementById('ppLabel');
  const iconPause = ppBtn.querySelector('.icon-pause');
  const iconPlay  = ppBtn.querySelector('.icon-play');

  ppBtn.addEventListener('click', () => {
    S.playing = !S.playing;
    if (S.playing) {
      iconPause.style.display = '';
      iconPlay.style.display  = 'none';
      ppLabel.textContent     = 'Pause';
    } else {
      iconPause.style.display = 'none';
      iconPlay.style.display  = '';
      ppLabel.textContent     = 'Play';
    }
  });

  // Save PNG
  document.getElementById('saveBtn').addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = `thendo-post-${Date.now()}.png`;
    a.href = canvas.toDataURL('image/png'); a.click();
  });

  // Falling stars
  document.getElementById('shootingCount').addEventListener('input', e => {
    S.shootingCount = +e.target.value;
    document.getElementById('shootingVal').textContent = S.shootingCount;
    setShootCount(S.shootingCount);
  });

  // Blinking stars
  document.getElementById('blinkingCount').addEventListener('input', e => {
    S.blinkingCount = +e.target.value;
    document.getElementById('blinkingVal').textContent = S.blinkingCount;
    setBlinkCount(S.blinkingCount);
  });

  // Speed
  document.getElementById('speedControl').addEventListener('input', e => {
    S.speed = +e.target.value;
    document.getElementById('speedVal').textContent = `${S.speed.toFixed(1)}×`;
  });

  // Drop direction
  initSegCtrl('dropMode', val => { S.dropMode = val; });

  // Star colour modes — independent for falling and blinking
  initSegCtrl('shootColorMode', val => { S.shootColorMode = val; });
  initSegCtrl('blinkColorMode', val => { S.blinkColorMode = val; });

  // Text
  document.getElementById('postText').addEventListener('input', e => {
    S.text = e.target.value;
  });

  // Font size
  document.getElementById('fontSize').addEventListener('input', e => {
    S.fontSize = +e.target.value;
    document.getElementById('fontSizeVal').textContent = S.fontSize;
  });

  // Font family
  document.getElementById('fontSelect').addEventListener('change', e => {
    S.fontFamily = e.target.value;
  });

  // Text colour mode
  initSegCtrl('textColorMode', val => {
    S.textColorMode = val;
    document.getElementById('solidColorRow').style.display = val === 'solid' ? 'flex' : 'none';
  });

  // Custom colour
  document.getElementById('textColor').addEventListener('input', e => {
    S.solidColor = e.target.value;
  });

  // Vertical position
  document.getElementById('textPosY').addEventListener('input', e => {
    S.textPosY = +e.target.value;
  });

  // Save moment
  document.getElementById('saveMomentBtn').addEventListener('click', () => {
    S.moments.push({
      id:     Date.now(),
      dataURL: canvas.toDataURL('image/png'),
      label:  `Moment ${S.moments.length + 1} · ${S.format}`,
    });
    renderMoments();
  });
}

// ── Bootstrap ─────────────────────────────────────────────────
function init() {
  canvas.width = S.cW; canvas.height = S.cH;
  applyAccentToUI();
  initBgStars();
  setBlinkCount(S.blinkingCount);
  setShootCount(S.shootingCount);
  setupControls();
  fitCanvas();
  requestAnimationFrame(loop);
}

window.addEventListener('load', init);
window.addEventListener('resize', fitCanvas);
