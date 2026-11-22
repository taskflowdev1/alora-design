import * as React from "react";
import { RefreshCw } from "react-feather";
import { cn, formatRp, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------ a small QR encoder (byte mode, level M, versions 1–6) */

/** [error-correction bytes per block, blocks], by version. Blocks are equal at level M up to version 6. */
const VERSIONS: [number, number][] = [[10, 1], [16, 1], [26, 1], [18, 2], [24, 2], [16, 4]];
const TOTAL_BYTES = [26, 44, 70, 100, 134, 172];
const ALIGN = [0, 18, 22, 26, 30, 34];
/** The longest value the built-in encoder takes, in UTF-8 bytes. */
const MAX_BYTES = 106;

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = x;
  LOG[x] = i;
  x = (x << 1) ^ (x & 0x80 ? 0x11d : 0);
}
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
const gfMul = (a: number, b: number) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

function reedSolomon(data: number[], ecLen: number) {
  let gen = [1];
  for (let i = 0; i < ecLen; i++) {
    const next = new Array<number>(gen.length + 1).fill(0);
    gen.forEach((c, j) => {
      next[j] ^= c;
      next[j + 1] ^= gfMul(c, EXP[i]);
    });
    gen = next;
  }
  const rem = new Array<number>(ecLen).fill(0);
  for (const byte of data) {
    const factor = byte ^ rem[0];
    rem.shift();
    rem.push(0);
    for (let j = 0; j < ecLen; j++) rem[j] ^= gfMul(gen[j + 1], factor);
  }
  return rem;
}

const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

/** Runs, 2×2 blocks and dark balance: enough of the standard's score to avoid the masks that scan badly. */
function maskPenalty(m: boolean[][]) {
  const n = m.length;
  let score = 0;
  let dark = 0;
  for (let a = 0; a < n; a++) {
    let runH = 1;
    let runV = 1;
    for (let b = 0; b < n; b++) {
      if (m[a][b]) dark++;
      if (b > 0) {
        runH = m[a][b] === m[a][b - 1] ? runH + 1 : 1;
        runV = m[b][a] === m[b - 1][a] ? runV + 1 : 1;
        if (runH === 5) score += 3;
        else if (runH > 5) score += 1;
        if (runV === 5) score += 3;
        else if (runV > 5) score += 1;
      }
      if (a > 0 && b > 0 && m[a][b] === m[a - 1][b] && m[a][b] === m[a][b - 1] && m[a][b] === m[a - 1][b - 1]) score += 3;
    }
  }
  return score + Math.floor(Math.abs((dark * 100) / (n * n) - 50) / 5) * 10;
}

function encodeQr(text: string): boolean[][] {
  const bytes = [...new TextEncoder().encode(text)];
  if (bytes.length > MAX_BYTES) throw new RangeError(`QrPaymentTile: value is ${bytes.length} bytes, the built-in encoder takes ${MAX_BYTES}. Pass \`modules\` from your own encoder.`);
  const v = TOTAL_BYTES.findIndex((total, i) => total - VERSIONS[i][0] * VERSIONS[i][1] - 2 >= bytes.length);
  const [ecLen, blocks] = VERSIONS[v];
  const dataLen = TOTAL_BYTES[v] - ecLen * blocks;
  const size = 21 + v * 4;

  // Mode, length, data, terminator, then the standard pad bytes.
  const bits: number[] = [];
  const push = (value: number, count: number) => {
    for (let i = count - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };
  push(4, 4);
  push(bytes.length, 8);
  bytes.forEach((b) => push(b, 8));
  push(0, Math.min(4, dataLen * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  for (let pad = 0xec; data.length < dataLen; pad ^= 0xec ^ 0x11) data.push(pad);

  const blockLen = dataLen / blocks;
  const dataBlocks = Array.from({ length: blocks }, (_, i) => data.slice(i * blockLen, (i + 1) * blockLen));
  const ecBlocks = dataBlocks.map((b) => reedSolomon(b, ecLen));
  const stream: number[] = [];
  for (let i = 0; i < blockLen; i++) dataBlocks.forEach((b) => stream.push(b[i]));
  for (let i = 0; i < ecLen; i++) ecBlocks.forEach((b) => stream.push(b[i]));

  // The function patterns.
  const base = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const fixed = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const put = (x: number, y: number, on: boolean) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    base[y][x] = on;
    fixed[y][x] = true;
  };
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        put(cx + dx, cy + dy, d !== 2 && d !== 4);
      }
    }
  }
  for (let i = 8; i < size - 8; i++) {
    put(i, 6, i % 2 === 0);
    put(6, i, i % 2 === 0);
  }
  if (v > 0) {
    const c = ALIGN[v];
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) put(c + dx, c + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }
  // Reserve the format bits; the dark module is fixed by the standard.
  const formatCells = (bit: (i: number) => boolean) => {
    for (let i = 0; i <= 5; i++) put(8, i, bit(i));
    put(8, 7, bit(6));
    put(8, 8, bit(7));
    put(7, 8, bit(8));
    for (let i = 9; i < 15; i++) put(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) put(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) put(8, size - 15 + i, bit(i));
    put(8, size - 8, true);
  };
  formatCells(() => false);

  // The data, in the standard's two-wide zigzag from the bottom right.
  let bit = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    const upward = ((right + 1) & 2) === 0;
    for (let step = 0; step < size; step++) {
      const y = upward ? size - 1 - step : step;
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        if (fixed[y][x]) continue;
        base[y][x] = bit < stream.length * 8 ? ((stream[bit >> 3] >> (7 - (bit & 7))) & 1) === 1 : false;
        bit++;
      }
    }
  }

  let best: boolean[][] = base;
  let bestScore = Infinity;
  MASKS.forEach((mask, k) => {
    const grid = base.map((row, y) => row.map((on, x) => (fixed[y][x] ? on : on !== mask(x, y))));
    // Level M is 00, then the mask, protected by the format's BCH code and XOR pattern.
    let rem = k;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
    const format = ((k << 10) | rem) ^ 0x5412;
    const set = (x: number, y: number, i: number) => {
      grid[y][x] = ((format >> i) & 1) === 1;
    };
    for (let i = 0; i <= 5; i++) set(8, i, i);
    set(8, 7, 6);
    set(8, 8, 7);
    set(7, 8, 8);
    for (let i = 9; i < 15; i++) set(14 - i, 8, i);
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, i);
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, i);
    grid[size - 8][8] = true;
    const score = maskPenalty(grid);
    if (score < bestScore) {
      bestScore = score;
      best = grid;
    }
  });
  return best;
}

/* ------------------------------------------------------------ the tile */

/** The white margin a scanner needs, in modules. */
const QUIET = 4;
const ASSEMBLE_MS = 620;
const MODULE_MS = 200;
const COLLAPSE_MS = 380;
const COLLAPSE_STAGGER = 160;
const DRAW_MS = 150;
const FADE_MS = 220;
/** The check, as shares of the code's box. */
const CHECK: [number, number][] = [[0.442, 0.505], [0.485, 0.548], [0.562, 0.458]];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** The point `f` of the way along the check, 0 to 1. */
function alongCheck(f: number): [number, number] {
  const [a, b, c] = CHECK;
  const ab = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const bc = Math.hypot(c[0] - b[0], c[1] - b[1]);
  const at = f * (ab + bc);
  if (at <= ab) return [a[0] + ((b[0] - a[0]) * at) / ab, a[1] + ((b[1] - a[1]) * at) / ab];
  const u = (at - ab) / bc;
  return [b[0] + (c[0] - b[0]) * u, b[1] + (c[1] - b[1]) * u];
}

/** The degrees around a square for a share of its perimeter, clockwise from the top middle: the drain keeps an even pace along the edges. */
function perimeterAngle(share: number) {
  const s = clamp01(share) * 8;
  const side = Math.floor((s + 1) / 2);
  return side * 90 + (Math.atan(s - side * 2) * 180) / Math.PI;
}

interface Dot {
  x: number;
  y: number;
  eye: boolean;
  delay: number;
  out: number;
  tx: number;
  ty: number;
}

/**
 * The code on a canvas: it assembles module by module, runs the countdown, and on `pay` flies every module onto a check.
 * The loop only runs while something moves and the tile is on screen; the deadline itself is a timer, so it holds
 * off screen too.
 */
function runCode(canvas: HTMLCanvasElement, root: HTMLElement, grid: boolean[][], seconds: number, paidAtStart: boolean, onSecond: (s: number) => void, onExpire: () => void) {
  const ctx = canvas.getContext("2d");
  const n = grid.length;
  const reduced = prefersReducedMotion();
  const success = getComputedStyle(root).getPropertyValue("--ad-success").trim();
  const INK = "#14161a"; // grey-ok: a QR code stays dark on white in both themes

  const dots: Dot[] = [];
  const isEye = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  const mid = (n - 1) / 2;
  const far = Math.hypot(mid, mid);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!grid[y][x]) continue;
      const eye = isEye(x, y);
      const d = Math.hypot(x - mid, y - mid);
      // A little scatter on the way out from the middle, so it builds up module by module instead of as a ring.
      const jitter = (((x * 73 + y * 151) % 97) / 97) * 0.32;
      dots.push({ x, y, eye, delay: eye ? 0 : 120 + (d / far) * 0.68 * (ASSEMBLE_MS - 120) + jitter * (ASSEMBLE_MS - 120) * 0.5, out: (1 - d / far) * COLLAPSE_STAGGER, tx: 0, ty: 0 });
    }
  }
  // Left modules go to the start of the check and right ones to its end, so paths don't cross.
  [...dots].sort((a, b) => a.x - b.x || a.y - b.y).forEach((dot, i, all) => {
    [dot.tx, dot.ty] = alongCheck(i / Math.max(all.length - 1, 1));
  });
  const eyes = [[0, 0, 0], [n - 7, 0, 60], [0, n - 7, 120]];

  let S = 0;
  let dpr = 1;
  let cell = 0;
  let off = 0;
  const measure = () => {
    S = canvas.clientWidth;
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(S * dpr);
    canvas.height = Math.round(S * dpr);
    // Whole device pixels per module keep the code crisp and scannable.
    cell = Math.floor((S * dpr) / (n + QUIET * 2)) / dpr;
    off = (S - cell * n) / 2;
  };
  measure();

  const startedAt = performance.now();
  const assembledFrom = reduced || paidAtStart ? -1e9 : startedAt;
  const deadline = startedAt + seconds * 1000;
  let paidAt: number | null = paidAtStart ? -1e9 : null;
  let expiredAt: number | null = null;
  let shown = seconds;
  let raf = 0;
  let onScreen = true;
  let stopped = false;

  const roundRect = (x: number, y: number, w: number, r: number) => {
    ctx?.roundRect(x, y, w, w, r);
  };

  const drawEye = (ex: number, ey: number, t: number) => {
    if (!ctx || t <= 0) return;
    const s = 0.72 + 0.28 * t;
    const size = cell * 7;
    const cx = off + (ex + 3.5) * cell;
    const cy = off + (ey + 3.5) * cell;
    ctx.globalAlpha = t;
    ctx.fillStyle = INK;
    ctx.beginPath();
    roundRect(cx - (size * s) / 2, cy - (size * s) / 2, size * s, cell * 1.7 * s);
    const hole = cell * 5 * s;
    roundRect(cx - hole / 2, cy - hole / 2, hole, cell * 0.9 * s);
    ctx.fill("evenodd");
    ctx.beginPath();
    const core = cell * 3 * s;
    roundRect(cx - core / 2, cy - core / 2, core, cell * 0.8 * s);
    ctx.fill();
  };

  const draw = (now: number) => {
    if (!ctx || !S) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, S, S);
    const dim = expiredAt === null ? 1 : 1 - 0.86 * clamp01((now - expiredAt) / FADE_MS);
    if (paidAt === null) {
      const since = now - assembledFrom;
      eyes.forEach(([x, y, delay]) => drawEye(x, y, easeOut(clamp01((since - delay) / MODULE_MS)) * dim));
      ctx.fillStyle = INK;
      const r = cell * 0.2;
      for (const d of dots) {
        if (d.eye) continue;
        const t = easeOut(clamp01((since - d.delay) / MODULE_MS));
        if (t <= 0) continue;
        const size = cell * (0.4 + 0.6 * t);
        ctx.globalAlpha = t * dim;
        ctx.beginPath();
        roundRect(off + (d.x + 0.5) * cell - size / 2, off + (d.y + 0.5) * cell - size / 2, size, r * t);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      return;
    }
    const since = now - paidAt;
    const stroke = Math.max(2.5, S * 0.014);
    const line = clamp01((since - (COLLAPSE_MS + COLLAPSE_STAGGER)) / DRAW_MS);
    if (line < 1) {
      for (const d of dots) {
        const t = easeInOut(clamp01((since - d.out) / COLLAPSE_MS));
        const x = off + (d.x + 0.5) * cell + (d.tx * S - (off + (d.x + 0.5) * cell)) * t;
        const y = off + (d.y + 0.5) * cell + (d.ty * S - (off + (d.y + 0.5) * cell)) * t;
        const size = cell + (stroke - cell) * t;
        ctx.globalAlpha = 1 - line;
        ctx.fillStyle = INK;
        ctx.beginPath();
        roundRect(x - size / 2, y - size / 2, size, (size / 2) * (0.4 + 0.6 * t));
        ctx.fill();
        // The modules take the check's colour on the last part of the way.
        const tint = clamp01((t - 0.55) / 0.45);
        if (tint > 0) {
          ctx.globalAlpha = tint * (1 - line);
          ctx.fillStyle = success;
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
    if (line > 0) {
      const [[ax, ay], [bx, by], [cx, cy]] = CHECK;
      const ab = Math.hypot(bx - ax, by - ay);
      const bc = Math.hypot(cx - bx, cy - by);
      const reach = easeOut(line) * (ab + bc);
      ctx.strokeStyle = success;
      ctx.lineWidth = stroke;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(ax * S, ay * S);
      if (reach <= ab) ctx.lineTo((ax + ((bx - ax) * reach) / ab) * S, (ay + ((by - ay) * reach) / ab) * S);
      else {
        ctx.lineTo(bx * S, by * S);
        const u = (reach - ab) / bc;
        ctx.lineTo((bx + (cx - bx) * u) * S, (by + (cy - by) * u) * S);
      }
      ctx.stroke();
    }
  };

  const moving = (now: number) => {
    if (paidAt !== null) return now - paidAt < COLLAPSE_MS + COLLAPSE_STAGGER + DRAW_MS + 40;
    if (expiredAt !== null) return now - expiredAt < FADE_MS + 40;
    return now - assembledFrom < ASSEMBLE_MS + MODULE_MS + 160;
  };

  const setRing = (now: number) => {
    const left = Math.max(0, deadline - now);
    root.style.setProperty("--qr-a", `${perimeterAngle(left / (seconds * 1000)).toFixed(2)}deg`);
    const whole = Math.ceil(left / 1000);
    if (whole !== shown) {
      shown = whole;
      onSecond(whole);
    }
  };

  const frame = (now: number) => {
    raf = 0;
    if (stopped) return;
    const live = paidAt === null && expiredAt === null;
    if (live) setRing(now);
    if (moving(now)) draw(now);
    if (onScreen && (live || moving(now))) raf = requestAnimationFrame(frame);
    else if (!moving(now)) draw(now);
  };
  const kick = () => {
    if (!raf && onScreen && !stopped) raf = requestAnimationFrame(frame);
  };

  const timeout = paidAtStart
    ? 0
    : window.setTimeout(() => {
        if (paidAt !== null) return;
        setRing(deadline);
        expiredAt = reduced ? -1e9 : performance.now();
        onExpire();
        kick();
        if (!onScreen) draw(performance.now());
      }, seconds * 1000);

  const ro = new ResizeObserver(() => {
    measure();
    draw(performance.now());
  });
  ro.observe(canvas);
  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) {
      setRing(performance.now());
      draw(performance.now());
      kick();
    } else {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  io.observe(root);
  setRing(startedAt);
  draw(startedAt);
  kick();

  return {
    pay() {
      if (paidAt !== null) return;
      clearTimeout(timeout);
      paidAt = reduced ? -1e9 : performance.now();
      draw(performance.now());
      kick();
    },
    stop() {
      stopped = true;
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    },
  };
}

/*
 * The countdown is a conic gradient on a ring-shaped mask, so it keeps the card's true corner shape. The white paper is
 * the code's quiet zone in both themes; when paid it closes in around the check along with the modules.
 */
const CSS = `
.ad-qr { --qr-a: 360deg; }
.ad-qr-ring { background: conic-gradient(var(--qr-tone, var(--ad-brand)) var(--qr-a), var(--ad-fill) 0); padding: 3px; transition: opacity 240ms var(--ad-ease); mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); }
.ad-qr[data-urgent="true"] { --qr-tone: var(--ad-danger); }
.ad-qr[data-state="paid"] .ad-qr-ring { opacity: 0; }
.ad-qr-paper { background: #fff; transition: scale 420ms var(--ad-ease), background-color 420ms var(--ad-ease), border-radius 420ms var(--ad-ease); } /* grey-ok: a scanner needs a white quiet zone in both themes */
/* The radius grows as the scale shrinks, so the small tile still has a control's corners. */
.ad-qr[data-state="paid"] .ad-qr-paper { scale: 0.3; background: var(--ad-fill); border-radius: calc(var(--ad-radius-control) / 0.3); transition-delay: 60ms; }
.ad-qr-time { transition: opacity 200ms var(--ad-ease); }
.ad-qr[data-state="paid"] .ad-qr-time { opacity: 0; }
.ad-qr-new { animation: ad-fade-in 200ms var(--ad-ease); }
@media (prefers-reduced-motion: reduce) {
  .ad-qr-ring, .ad-qr-paper, .ad-qr-time { transition: none !important; }
}`;

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export interface QrPaymentTileProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  merchant?: string;
  /** The amount in rupiah. */
  amount?: number;
  reference?: string;
  /** The text the code carries, up to 106 bytes. A longer one (a full QRIS string) goes through `modules`. */
  value?: string;
  /** A ready QR matrix from your own encoder, dark = true. Wins over `value`. */
  modules?: boolean[][];
  /** How long the code stays valid. */
  seconds?: number;
  /** Set when the payment lands: the modules collapse into a check. Back to false starts a fresh code. */
  paid?: boolean;
  onExpire?: () => void;
  /** The expired code's "New code" was pressed; the countdown has restarted. Pass a fresh `value` here. */
  onRefresh?: () => void;
}

/**
 * A payment QR that assembles module by module while a countdown drains around it. When `paid` turns true the modules
 * collapse inward and become a drawn check; when the time runs out the code fades and offers a new one.
 */
export function QrPaymentTile({ merchant = "Rimba Kemang", amount = 1250000, reference = "INV-20418", value, modules, seconds = 90, paid = false, onExpire, onRefresh, className, ...props }: QrPaymentTileProps) {
  const root = React.useRef<HTMLDivElement>(null);
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const engine = React.useRef<ReturnType<typeof runCode> | null>(null);
  const [run, setRun] = React.useState(0);
  const [left, setLeft] = React.useState(seconds);
  const [expired, setExpired] = React.useState(false);
  const text = value ?? `PAY:${merchant.replace(/\s+/g, "-").toUpperCase()}:${reference}:${amount}`;
  const grid = React.useMemo(() => modules ?? encodeQr(text), [modules, text]);

  const paidRef = React.useRef(paid);
  const expireRef = React.useRef(onExpire);
  React.useEffect(() => {
    expireRef.current = onExpire;
  }, [onExpire]);

  React.useEffect(() => {
    const c = canvas.current;
    const r = root.current;
    if (!c || !r) return;
    setExpired(false);
    setLeft(seconds);
    // The code assembles, and its time starts, the first time it's on screen: further down a page it would be over unseen.
    let e: ReturnType<typeof runCode> | null = null;
    const first = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      first.disconnect();
      e = runCode(c, r, grid, seconds, paidRef.current, setLeft, () => {
        setExpired(true);
        expireRef.current?.();
      });
      engine.current = e;
    });
    first.observe(r);
    return () => {
      first.disconnect();
      e?.stop();
      engine.current = null;
    };
  }, [grid, seconds, run]);

  React.useEffect(() => {
    const was = paidRef.current;
    paidRef.current = paid;
    if (paid) engine.current?.pay();
    else if (was) setRun((n) => n + 1);
  }, [paid]);

  const state = paid ? "paid" : expired ? "expired" : "live";

  return (
    <div ref={root} data-state={state} data-urgent={state === "live" && left <= 10} className={cn("ad-qr grid w-full min-w-0 gap-4", className)} {...props}>
      <style href="ad-qr-payment-tile" precedence="default">
        {CSS}
      </style>
      <div className="flex items-baseline justify-between gap-3 text-body">
        <span translate="no" className="min-w-0 truncate font-medium text-ink">
          {merchant}
        </span>
        <span className="ad-qr-time shrink-0 tabular-nums text-ink-muted">
          <span className="sr-only">Expires in </span>
          {clock(left)}
        </span>
      </div>
      <div className="relative aspect-square w-full">
        <div aria-hidden className="ad-qr-ring absolute inset-0 rounded-sheet" />
        <div aria-hidden className="ad-qr-paper absolute inset-pad rounded-control" />
        <canvas ref={canvas} role="img" aria-label={paid ? `Paid ${formatRp(amount)}` : `QR code to pay ${formatRp(amount)} to ${merchant}`} className="absolute inset-pad size-[calc(100%-var(--ad-pad)*2)]" />
        {state === "expired" && (
          <div className="ad-qr-new absolute inset-0 grid place-items-center">
            <Button
              onClick={() => {
                setRun((n) => n + 1);
                onRefresh?.();
              }}
            >
              <RefreshCw strokeWidth={1.75} />
              New code
            </Button>
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="whitespace-nowrap text-heading font-semibold tabular-nums tracking-[-0.02em] text-ink">{formatRp(amount)}</span>
        <span translate="no" className="min-w-0 truncate text-body tabular-nums text-ink-muted">
          {reference}
        </span>
      </div>
      <span role="status" className="sr-only">
        {state === "paid" ? `Paid ${formatRp(amount)}` : state === "expired" ? "Code expired" : ""}
      </span>
    </div>
  );
}
