import * as React from "react";
import { RotateCcw } from "react-feather";
import { cn, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { CopyChip } from "@/components/ui/copy-chip";

const COLS = 32;
const ROWS = 14;
/** Once this share of the foil is gone, the rest lets go by itself. */
const LETS_GO_AT = 0.56;
const BRUSH = 15;
const GRAVITY = 1500;
const MAX_CRUMBS = 150;
/** The flake layer reaches past the ticket by this much at the sides and top, within the page gutter. */
const BLEED = 12;
const FALL = 130;

// grey-ok: the foil is printed material, a silver that stays the same in both themes
const FOIL_STOPS = ["#c4c8d0", "#eef0f4", "#b6bac4", "#e6e8ed", "#bfc3cc"];
// grey-ok: loose crumbs of the same silver
const CRUMBS = ["#d9dce2", "#b9bdc6", "#eceef2", "#a7abb5"];

// grey-ok: a coin for a cursor, artwork
const COIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Ccircle cx='14' cy='14' r='12' fill='%23e3c67c'/%3E%3Ccircle cx='14' cy='14' r='8.5' fill='%23c9a557'/%3E%3C/svg%3E") 14 14, crosshair`;

const CSS = `
.ad-scratch-ticket {
  mask-image: radial-gradient(circle 9px at 0 58px, transparent 96%, #000), radial-gradient(circle 9px at 100% 58px, transparent 96%, #000);
  mask-composite: intersect; -webkit-mask-composite: source-in;
}
/* grey-ok: the ticket's shadow, cast through its cut-out shape */
.ad-scratch-lift { filter: drop-shadow(0 10px 22px rgb(0 0 0 / 0.24)); }
.ad-scratch-foil { cursor: ${COIN}; touch-action: none; transition: opacity 200ms var(--ad-ease); }
.ad-scratch-foil[data-state="done"] { opacity: 0; pointer-events: none; touch-action: auto; }
.ad-scratch-foil:focus-visible canvas { filter: brightness(0.9); }
`;

interface Flake {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  flip: number;
  vf: number;
  w: number;
  h: number;
  age: number;
  life: number;
  delay: number;
  tone?: string;
  sx?: number;
  sy?: number;
  /** A torn outline around the piece's centre, as x, y pairs. */
  shard?: number[];
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function paintFoil(ctx: CanvasRenderingContext2D, w: number, h: number, label: string, font: string) {
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, w, h);
  FOIL_STOPS.forEach((c, i) => g.addColorStop(i / (FOIL_STOPS.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // A faint oil-slick across the silver.
  const oil = ctx.createLinearGradient(w, 0, 0, h);
  oil.addColorStop(0, "oklch(0.8 0.09 340 / 0.16)"); // grey-ok: foil
  oil.addColorStop(0.5, "oklch(0.86 0.08 120 / 0.1)"); // grey-ok: foil
  oil.addColorStop(1, "oklch(0.8 0.09 230 / 0.18)"); // grey-ok: foil
  ctx.fillStyle = oil;
  ctx.fillRect(0, 0, w, h);
  // The printed security pattern, then the grain.
  ctx.fillStyle = "rgb(60 64 74 / 0.07)"; // grey-ok: foil print
  for (let y = 0, row = 0; y < h + 14; y += 14, row++) {
    for (let x = row % 2 ? 7 : 0; x < w + 14; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, y - 3);
      ctx.lineTo(x + 3, y);
      ctx.lineTo(x, y + 3);
      ctx.lineTo(x - 3, y);
      ctx.fill();
    }
  }
  let seed = 7;
  const next = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0, count = Math.round((w * h) / 60); i < count; i++) {
    ctx.fillStyle = next() > 0.5 ? "rgb(255 255 255 / 0.22)" : "rgb(40 44 52 / 0.07)"; // grey-ok: foil grain
    ctx.fillRect(next() * w, next() * h, 1, 1);
  }
  ctx.font = `600 15px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#4d515a"; // grey-ok: printed on the foil
  ctx.fillText(label, w / 2, h / 2);
}

/**
 * The foil: a canvas that strokes cut through, and a second, larger one for the crumbs that fall. Coverage is counted
 * on a coarse grid. Past the threshold, the cells still covered become real pieces of the foil's picture and drop away
 * outward from where the last stroke ended. Nothing runs while nothing is falling.
 */
function attachFoil(host: HTMLElement, foil: HTMLCanvasElement, fx: HTMLCanvasElement, label: string, onScratch: () => void, onDone: () => void) {
  const ctx = foil.getContext("2d")!;
  const fxCtx = fx.getContext("2d")!;
  let w = 0, h = 0, dpr = 1, ox = 0, oy = 0;
  let cleared = new Uint8Array(COLS * ROWS);
  let count = 0;
  let segs: number[][] = [];
  let done = false, touched = false, onScreen = true;
  let flakes: Flake[] = [];
  let snapshot: HTMLCanvasElement | null = null;
  let raf = 0, last = 0;
  let stroke: { id: number; x: number; y: number } | null = null;
  const ac = new AbortController();

  const font = () => getComputedStyle(host).fontFamily;

  const mark = (x: number, y: number) => {
    const r = BRUSH * 0.9;
    const c0 = Math.max(0, Math.floor(((x - r) / w) * COLS));
    const c1 = Math.min(COLS - 1, Math.floor(((x + r) / w) * COLS));
    const r0 = Math.max(0, Math.floor(((y - r) / h) * ROWS));
    const r1 = Math.min(ROWS - 1, Math.floor(((y + r) / h) * ROWS));
    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) {
        const cx = ((col + 0.5) / COLS) * w;
        const cy = ((row + 0.5) / ROWS) * h;
        if (Math.hypot(cx - x, cy - y) > r) continue;
        const at = row * COLS + col;
        if (!cleared[at]) {
          cleared[at] = 1;
          count++;
        }
      }
    }
  };

  const cut = (x0: number, y0: number, x1: number, y1: number) => {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = BRUSH * 2;
    ctx.strokeStyle = "#000"; // grey-ok: an eraser, never shown
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1 + 0.01, y1);
    ctx.stroke();
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(dist / 6));
    ctx.fillStyle = "#000"; // grey-ok: an eraser, never shown
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = x0 + (x1 - x0) * t;
      const py = y0 + (y1 - y0) * t;
      mark(px, py);
      // A ragged edge: foil tears, it isn't cut by a clean circle.
      const a = Math.random() * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(px + Math.cos(a) * BRUSH * 0.98, py + Math.sin(a) * BRUSH * 0.98, rand(1, 3.4), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  };

  const paintFx = () => {
    fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fxCtx.clearRect(0, 0, fx.width / dpr, fx.height / dpr);
    for (const f of flakes) {
      if (f.age < 0) continue;
      const fade = Math.min(1, (f.life - f.age) / (f.life * 0.35));
      fxCtx.globalAlpha = Math.max(0, fade);
      fxCtx.save();
      fxCtx.translate(f.x + ox, f.y + oy);
      fxCtx.rotate(f.rot);
      fxCtx.scale(1, Math.cos(f.flip) || 0.05);
      if (snapshot && f.sx !== undefined && f.sy !== undefined && f.shard) {
        fxCtx.beginPath();
        for (let i = 0; i < f.shard.length; i += 2) fxCtx.lineTo(f.shard[i], f.shard[i + 1]);
        fxCtx.closePath();
        fxCtx.clip();
        fxCtx.drawImage(snapshot, f.sx * dpr, f.sy * dpr, f.w * dpr, f.h * dpr, -f.w / 2, -f.h / 2, f.w, f.h);
      } else {
        fxCtx.fillStyle = f.tone ?? CRUMBS[0];
        fxCtx.fillRect(-f.w / 2, -f.h / 2, f.w, f.h);
      }
      fxCtx.restore();
    }
    fxCtx.globalAlpha = 1;
  };

  const frame = (t: number) => {
    raf = 0;
    const dt = Math.min(Math.max(t - last, 1) / 1000, 1 / 30);
    last = t;
    for (const f of flakes) {
      f.age += dt;
      if (f.age < 0) continue;
      f.vy += GRAVITY * dt;
      f.vx *= Math.exp(-dt * 1.4);
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.rot += f.vr * dt;
      f.flip += f.vf * dt;
    }
    flakes = flakes.filter((f) => f.age < f.life);
    paintFx();
    if (flakes.length) raf = requestAnimationFrame(frame);
    else snapshot = null;
  };
  const kick = () => {
    if (raf || !onScreen) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const crumbs = (x: number, y: number, dx: number, dy: number) => {
    if (prefersReducedMotion()) return;
    const n = Math.min(4, 1 + Math.floor(Math.hypot(dx, dy) / 9));
    for (let i = 0; i < n && flakes.length < MAX_CRUMBS; i++) {
      const size = rand(1.6, 4.4);
      flakes.push({
        x: x + rand(-BRUSH, BRUSH) * 0.7,
        y: y + rand(-BRUSH, BRUSH) * 0.7,
        vx: dx * rand(1.5, 5) + rand(-50, 50),
        vy: dy * rand(1, 3) - rand(40, 150),
        rot: rand(0, Math.PI),
        vr: rand(-9, 9),
        flip: rand(0, Math.PI),
        vf: rand(-14, 14),
        w: size,
        h: size * rand(0.5, 1),
        age: 0,
        life: rand(0.45, 0.8),
        delay: 0,
        tone: CRUMBS[Math.floor(Math.random() * CRUMBS.length)],
      });
    }
    kick();
  };

  /** The rest of the foil lets go, cell by cell, spreading from the point the scratching stopped. */
  const letGo = (fromX: number, fromY: number) => {
    if (done) return;
    done = true;
    stroke = null;
    if (!prefersReducedMotion() && onScreen) {
      const copy = document.createElement("canvas");
      copy.width = foil.width;
      copy.height = foil.height;
      copy.getContext("2d")!.drawImage(foil, 0, 0);
      snapshot = copy;
      const cw = w / COLS;
      const ch = h / ROWS;
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (cleared[row * COLS + col]) continue;
          const x = (col + 0.5) * cw + rand(-1.5, 1.5);
          const y = (row + 0.5) * ch + rand(-1.5, 1.5);
          // Each piece is a torn shard a bit larger than its cell, so together they still cover the foil when it lets go.
          const pw = Math.ceil(cw * 1.8);
          const ph = Math.ceil(ch * 1.8);
          const sx = x - pw / 2;
          const sy = y - ph / 2;
          const corners = 5 + Math.floor(Math.random() * 3);
          const start = rand(0, Math.PI * 2);
          const shard: number[] = [];
          for (let i = 0; i < corners; i++) {
            const t = start + (i / corners) * Math.PI * 2;
            const reach = rand(0.8, 1);
            shard.push(Math.cos(t) * (pw / 2) * reach, Math.sin(t) * (ph / 2) * reach);
          }
          const d = Math.hypot(x - fromX, y - fromY);
          const a = Math.atan2(y - fromY, x - fromX);
          flakes.push({
            x,
            y,
            vx: Math.cos(a) * rand(30, 150),
            vy: Math.sin(a) * rand(10, 80) - rand(120, 260),
            rot: 0,
            vr: rand(-7, 7),
            flip: 0,
            vf: rand(-11, 11),
            w: pw,
            h: ph,
            age: -d * 0.0011,
            life: rand(0.62, 0.92),
            delay: 0,
            sx,
            sy,
            shard,
          });
        }
      }
      ctx.clearRect(0, 0, w, h);
      kick();
    }
    onDone();
  };

  const place = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = host.getBoundingClientRect();
    if (!r.width) return;
    w = r.width;
    h = r.height;
    foil.width = Math.round(w * dpr);
    foil.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const fr = (fx.parentElement as HTMLElement).getBoundingClientRect();
    fx.width = Math.round((fr.width + BLEED * 2) * dpr);
    fx.height = Math.round((fr.height + BLEED + FALL) * dpr);
    ox = r.left - fr.left + BLEED;
    oy = r.top - fr.top + BLEED;
    if (done) return;
    paintFoil(ctx, w, h, label, font());
    const kept = segs;
    cleared = new Uint8Array(COLS * ROWS);
    count = 0;
    for (const s of kept) cut(s[0] * w, s[1] * h, s[2] * w, s[3] * h);
  };

  const at = (e: PointerEvent) => {
    const r = foil.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const scratchTo = (x: number, y: number, fromX: number, fromY: number) => {
    cut(fromX, fromY, x, y);
    segs.push([fromX / w, fromY / h, x / w, y / h]);
    if (!touched) {
      touched = true;
      onScratch();
    }
    crumbs(x, y, x - fromX, y - fromY);
    if (count / (COLS * ROWS) >= LETS_GO_AT) letGo(x, y);
  };

  foil.addEventListener(
    "pointerdown",
    (e) => {
      if (done || e.button !== 0) return;
      e.preventDefault();
      foil.setPointerCapture(e.pointerId);
      const p = at(e);
      stroke = { id: e.pointerId, ...p };
      scratchTo(p.x, p.y, p.x, p.y);
    },
    { signal: ac.signal },
  );
  foil.addEventListener(
    "pointermove",
    (e) => {
      if (stroke?.id !== e.pointerId || done) return;
      for (const ev of e.getCoalescedEvents?.() ?? [e]) {
        if (done || !stroke) break;
        const p = at(ev);
        scratchTo(p.x, p.y, stroke.x, stroke.y);
        if (stroke) {
          stroke.x = p.x;
          stroke.y = p.y;
        }
      }
    },
    { signal: ac.signal },
  );
  const end = (e: PointerEvent) => {
    if (stroke?.id === e.pointerId) stroke = null;
  };
  foil.addEventListener("pointerup", end, { signal: ac.signal });
  foil.addEventListener("pointercancel", end, { signal: ac.signal });

  const ro = new ResizeObserver(place);
  ro.observe(host);
  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) return;
    cancelAnimationFrame(raf);
    raf = 0;
    flakes = [];
    snapshot = null;
    paintFx();
  });
  io.observe(host);
  place();

  return {
    reveal: () => letGo(w / 2, h / 2),
    reset: () => {
      done = false;
      touched = false;
      stroke = null;
      segs = [];
      cleared = new Uint8Array(COLS * ROWS);
      count = 0;
      flakes = [];
      snapshot = null;
      cancelAnimationFrame(raf);
      raf = 0;
      paintFx();
      paintFoil(ctx, w, h, label, font());
    },
    destroy: () => {
      ac.abort();
      ro.disconnect();
      io.disconnect();
      cancelAnimationFrame(raf);
    },
  };
}

export interface ScratchVoucherProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  shop?: string;
  /** Printed at the top right of the ticket, e.g. how long it's valid. */
  validity?: string;
  /** The prize under the foil. */
  offer?: string;
  code?: string;
  /** Printed on the foil. */
  label?: string;
  /** Fires once when the foil has come off. */
  onReveal?: (code: string) => void;
}

/**
 * A voucher with a scratch-off panel. Scratch with a mouse or finger and foil crumbs fly; once most of it is gone the
 * rest flakes away by itself, leaving the code ready to copy. Enter or Space takes it all off at once.
 */
export function ScratchVoucher({ shop = "Rimba Kemang", validity = "Until 31 Dec", offer = "25% off", code = "RIMBA-7K2Q", label = "Scratch here", onReveal, className, ...props }: ScratchVoucherProps) {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const foilRef = React.useRef<HTMLCanvasElement>(null);
  const fxRef = React.useRef<HTMLCanvasElement>(null);
  const prizeRef = React.useRef<HTMLDivElement>(null);
  const engine = React.useRef<ReturnType<typeof attachFoil> | null>(null);
  const viaKeys = React.useRef(false);
  const revealRef = React.useRef(onReveal);
  const codeRef = React.useRef(code);
  const [state, setState] = React.useState<"idle" | "scratching" | "done">("idle");
  React.useEffect(() => {
    revealRef.current = onReveal;
    codeRef.current = code;
  });

  React.useEffect(() => {
    if (!hostRef.current || !foilRef.current || !fxRef.current) return;
    const e = attachFoil(
      hostRef.current,
      foilRef.current,
      fxRef.current,
      label,
      () => setState((s) => (s === "idle" ? "scratching" : s)),
      () => {
        setState("done");
        revealRef.current?.(codeRef.current);
      },
    );
    engine.current = e;
    return () => {
      e.destroy();
      engine.current = null;
    };
  }, [label]);

  // After a reveal from the keyboard, focus goes to the code, since the foil it was on is gone.
  React.useEffect(() => {
    if (state !== "done" || !viaKeys.current) return;
    viaKeys.current = false;
    prizeRef.current?.querySelector("button")?.focus();
  }, [state]);

  const done = state === "done";

  return (
    <div className={cn("grid w-full justify-items-center gap-gap", className)} {...props}>
      <style href="ad-scratch-voucher" precedence="default">
        {CSS}
      </style>
      <div className="relative w-full">
        <div className="ad-scratch-lift">
          <div className="ad-scratch-ticket grid gap-pad rounded-card bg-surface p-pad">
            <div className="flex h-[26px] items-center justify-between gap-4 text-body">
              <span className="truncate font-semibold">{shop}</span>
              <span className="shrink-0 tabular-nums text-ink-muted">{validity}</span>
            </div>
            <div className="relative h-[152px] overflow-hidden rounded-control bg-fill">
              <div ref={prizeRef} inert={!done} aria-hidden={!done} className="grid h-full content-center justify-items-center gap-2.5">
                <span className="text-[40px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{offer}</span>
                <CopyChip value={code}>{code}</CopyChip>
              </div>
              <div
                ref={hostRef}
                role="button"
                tabIndex={done ? -1 : 0}
                aria-hidden={done}
                aria-label={`${label} to reveal the code`}
                data-state={done ? "done" : "live"}
                onKeyDown={(e) => {
                  if (done || (e.key !== "Enter" && e.key !== " ")) return;
                  e.preventDefault();
                  viaKeys.current = true;
                  engine.current?.reveal();
                }}
                className="ad-scratch-foil absolute inset-0"
              >
                <canvas ref={foilRef} className="block size-full" />
              </div>
            </div>
          </div>
        </div>
        <canvas ref={fxRef} aria-hidden className="pointer-events-none absolute z-10" style={{ left: -BLEED, right: -BLEED, top: -BLEED, bottom: -FALL, width: `calc(100% + ${BLEED * 2}px)`, height: `calc(100% + ${BLEED + FALL}px)` }} />
      </div>
      <Button
        variant="ghost"
        icon
        aria-label="New voucher"
        tabIndex={state === "idle" ? -1 : 0}
        onClick={() => {
          engine.current?.reset();
          setState("idle");
          hostRef.current?.focus({ preventScroll: true });
        }}
        className={cn("transition-[opacity,background-color,scale] duration-[160ms]", state === "idle" && "pointer-events-none opacity-0")}
      >
        <RotateCcw strokeWidth={1.75} />
      </Button>
      <span aria-live="polite" className="sr-only">
        {done ? `${offer}, code ${code}` : ""}
      </span>
    </div>
  );
}
