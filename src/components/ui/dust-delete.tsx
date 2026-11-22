import * as React from "react";
import { RotateCcw, Trash2 } from "react-feather";
import { cn, prefersReducedMotion } from "@/lib/ad";
import { buttonClass } from "@/components/ui/button";

const PAD = 96; // how far past the card the dust may drift, in px
const MAX_PARTICLES = 26000;
const REPEL_RADIUS = 86;

const CSS = `
.ad-dust-shadow { transition: opacity 260ms var(--ad-ease); }
.ad-dust[data-gone] .ad-dust-shadow { opacity: 0; }
.ad-dust-undo {
  opacity: 0; transform: scale(0.96); pointer-events: none;
  transition: opacity 180ms var(--ad-ease), transform 220ms var(--ad-ease);
}
.ad-dust[data-gone] .ad-dust-undo { opacity: 1; transform: none; pointer-events: auto; transition-delay: 760ms; }
@media (prefers-reduced-motion: reduce) {
  .ad-dust-undo { transform: none; }
  .ad-dust[data-gone] .ad-dust-undo { transition-delay: 0ms; }
}`;

const subscribeMotion = (fn: () => void) => {
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function drawSvg(ctx: CanvasRenderingContext2D, svg: SVGSVGElement) {
  const r = svg.getBoundingClientRect();
  const box = svg.viewBox.baseVal;
  const cs = getComputedStyle(svg);
  const scale = box?.width ? r.width / box.width : 1;
  ctx.save();
  ctx.translate(r.left, r.top);
  ctx.scale(scale, scale);
  ctx.strokeStyle = cs.color;
  ctx.lineWidth = parseFloat(cs.strokeWidth) || 1.75;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const n of svg.querySelectorAll("path,line,polyline,circle,rect")) {
    const a = (k: string) => Number(n.getAttribute(k) ?? 0);
    let d: string;
    if (n.tagName === "path") d = n.getAttribute("d") ?? "";
    else if (n.tagName === "line") d = `M${a("x1")} ${a("y1")}L${a("x2")} ${a("y2")}`;
    else if (n.tagName === "polyline") d = `M${(n.getAttribute("points") ?? "").trim().replace(/\s+/g, "L")}`;
    else if (n.tagName === "circle") d = `M${a("cx") - a("r")} ${a("cy")}a${a("r")} ${a("r")} 0 1 0 ${a("r") * 2} 0a${a("r")} ${a("r")} 0 1 0 ${-a("r") * 2} 0`;
    else d = `M${a("x")} ${a("y")}h${a("width")}v${a("height")}h${-a("width")}z`;
    ctx.stroke(new Path2D(d));
  }
  ctx.restore();
}

function drawImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, radius: number) {
  if (!img.complete || !img.naturalWidth) return;
  const r = img.getBoundingClientRect();
  const k = Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight);
  const sw = r.width / k;
  const sh = r.height / k;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(r.left, r.top, r.width, r.height, radius);
  ctx.clip();
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, r.left, r.top, r.width, r.height);
  ctx.restore();
}

function drawText(ctx: CanvasRenderingContext2D, node: Text, cs: CSSStyleDeclaration) {
  const text = node.textContent?.trim();
  if (!text) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  const r = range.getBoundingClientRect();
  if (!r.width) return;
  ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  ctx.fillStyle = cs.color;
  ctx.textBaseline = "alphabetic";
  ctx.fontKerning = "normal";
  const m = ctx.measureText(text);
  ctx.fillText(text, r.left, r.top + (r.height + m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2);
}

function drawTree(ctx: CanvasRenderingContext2D, el: Element) {
  const cs = getComputedStyle(el);
  if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") return;
  const r = el.getBoundingClientRect();
  const radius = parseFloat(cs.borderTopLeftRadius) || 0;
  if (cs.backgroundColor !== "transparent" && !/[,/] ?0\)$/.test(cs.backgroundColor)) {
    ctx.fillStyle = cs.backgroundColor;
    ctx.beginPath();
    ctx.roundRect(r.left, r.top, r.width, r.height, Math.min(radius, r.height / 2));
    ctx.fill();
  }
  if (el instanceof HTMLImageElement) return drawImage(ctx, el, radius || parseFloat(getComputedStyle(el.parentElement!).borderTopLeftRadius) || 0);
  if (el instanceof SVGSVGElement) return drawSvg(ctx, el);
  for (const n of el.childNodes) {
    if (n.nodeType === Node.TEXT_NODE) drawText(ctx, n as Text, cs);
    else if (n.nodeType === Node.ELEMENT_NODE) drawTree(ctx, n as Element);
  }
}

interface Dust {
  n: number;
  s: number;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  hx: Float32Array;
  hy: Float32Array;
  delay: Float32Array;
  life: Float32Array;
  age: Float32Array;
  rgb: Uint32Array;
  image: ImageData;
  pixels: Uint32Array;
}

/** Reads the drawn card into particles, one per small cell, each remembering where it belongs. */
function makeDust(card: HTMLElement, canvas: HTMLCanvasElement, offX: number, offY: number, origin: { x: number; y: number }, dpr: number): Dust | null {
  const r = card.getBoundingClientRect();
  const source = document.createElement("canvas");
  source.width = Math.ceil(r.width * dpr);
  source.height = Math.ceil(r.height * dpr);
  const sctx = source.getContext("2d", { willReadFrequently: true });
  const ctx = canvas.getContext("2d");
  if (!sctx || !ctx) return null;
  sctx.scale(dpr, dpr);
  sctx.translate(-r.left, -r.top);
  drawTree(sctx, card);
  const { data } = sctx.getImageData(0, 0, source.width, source.height);

  let s = Math.max(2, Math.round(1.25 * dpr));
  while ((source.width * source.height) / (s * s) > MAX_PARTICLES) s++;
  const cells: number[] = [];
  for (let y = 0; y < source.height; y += s) {
    for (let x = 0; x < source.width; x += s) {
      const i = (y * source.width + x) * 4;
      if (data[i + 3] > 40) cells.push(x, y, i);
    }
  }
  const n = cells.length / 3;
  const f = () => new Float32Array(n);
  const dust: Dust = { n, s, x: f(), y: f(), vx: f(), vy: f(), hx: f(), hy: f(), delay: f(), life: f(), age: f(), rgb: new Uint32Array(n), image: ctx.createImageData(canvas.width, canvas.height), pixels: new Uint32Array(0) };
  dust.pixels = new Uint32Array(dust.image.data.buffer);
  const reach = Math.hypot(Math.max(origin.x, r.width - origin.x), Math.max(origin.y, r.height - origin.y)) || 1;
  for (let p = 0; p < n; p++) {
    const hx = cells[p * 3] + offX * dpr;
    const hy = cells[p * 3 + 1] + offY * dpr;
    const i = cells[p * 3 + 2];
    dust.x[p] = dust.hx[p] = hx;
    dust.y[p] = dust.hy[p] = hy;
    dust.rgb[p] = (data[i + 2] << 16) | (data[i + 1] << 8) | data[i];
    const d = Math.hypot(cells[p * 3] / dpr - origin.x, cells[p * 3 + 1] / dpr - origin.y) / reach;
    dust.delay[p] = d * 0.42 + Math.random() * 0.1;
    dust.life[p] = 0.8 + Math.random() * 0.9;
  }
  return dust;
}

export interface DustDeleteProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  title?: string;
  price?: string;
  /** A photo URL; without one the card shows only its text. */
  image?: string;
  deleteLabel?: string;
  undoLabel?: string;
  /** The card's fill: "surface" on a page, "fill" when it already sits on a card. */
  tone?: "surface" | "fill";
  onDelete?: () => void;
  onUndo?: () => void;
}

/**
 * A card that breaks into fine dust when deleted. The dust drifts away from the cursor, and Undo pulls every grain back
 * to where it came from. The slot keeps its size, so nothing around it moves. Under reduced motion it simply fades.
 */
export function DustDelete({ title = "Gelas kopi tanah liat", price = "Rp 89.000", image, deleteLabel = "Delete", undoLabel = "Undo", tone = "surface", onDelete, onUndo, className, ...props }: DustDeleteProps) {
  const [gone, setGone] = React.useState(false);
  const [dusting, setDusting] = React.useState(false);
  const reduced = React.useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const delRef = React.useRef<HTMLButtonElement>(null);
  const undoRef = React.useRef<HTMLButtonElement>(null);
  const sim = React.useRef({ dust: null as Dust | null, mode: "rest" as "rest" | "out" | "back", raf: 0, last: 0, time: 0, px: -1e4, py: -1e4, ox: 0, oy: 0, stir: 0, dpr: 1, onScreen: true });

  const frame = React.useCallback((t: number) => {
    const m = sim.current;
    m.raf = 0;
    const d = m.dust;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!d || !canvas || !ctx) return;
    const dt = Math.min(Math.max(t - m.last, 1) / 1000, 1 / 30);
    m.last = t;
    m.time += dt;
    m.stir *= Math.exp(-5 * dt);
    const { width: W, height: H } = canvas;
    const R = REPEL_RADIUS * m.dpr;
    const px = m.px * m.dpr;
    const py = m.py * m.dpr;
    d.pixels.fill(0);
    let busy = false;
    for (let i = 0; i < d.n; i++) {
      let a = 1;
      if (m.mode === "out") {
        d.age[i] += dt;
        const since = d.age[i] - d.delay[i];
        if (since > 0) {
          const u = since / d.life[i];
          if (u < 1) busy = true;
          a = 1 - smooth(0.35, 1, u);
          // A slow curling flow with a little lift, so the dust reads as drifting and not exploding.
          const angle = Math.sin(d.x[i] * 0.006 / m.dpr + m.time * 0.9) + Math.cos(d.y[i] * 0.008 / m.dpr - m.time * 0.7) * 2.2;
          d.vx[i] += Math.cos(angle) * 150 * m.dpr * dt;
          d.vy[i] += (Math.sin(angle) * 150 - 70) * m.dpr * dt;
          // A steady drift away from where the delete happened, plus a stronger part wherever the cursor is moving.
          const ox = d.x[i] - m.ox * m.dpr;
          const oy = d.y[i] - m.oy * m.dpr;
          const away = Math.sqrt(ox * ox + oy * oy) || 1;
          d.vx[i] += (ox / away) * 62 * m.dpr * dt;
          d.vy[i] += (oy / away) * 62 * m.dpr * dt;
          if (m.stir > 0.01) {
            const dx = d.x[i] - px;
            const dy = d.y[i] - py;
            const q = dx * dx + dy * dy;
            if (q < R * R && q > 1) {
              const dist = Math.sqrt(q);
              const fall = 1 - dist / R;
              const push = fall * fall * m.stir * (1500 + d.life[i] * 1500) * m.dpr * dt;
              d.vx[i] += (dx / dist) * push;
              d.vy[i] += (dy / dist) * push;
            }
          }
          const drag = Math.exp(-2.1 * dt);
          d.vx[i] *= drag;
          d.vy[i] *= drag;
          d.x[i] += d.vx[i] * dt;
          d.y[i] += d.vy[i] * dt;
        } else busy = true;
      } else if (m.mode === "back") {
        d.age[i] += dt;
        const since = d.age[i] - d.delay[i] * 0.5;
        a = smooth(0, 0.22, since);
        if (since > 0) {
          d.vx[i] += ((d.hx[i] - d.x[i]) * 190 - d.vx[i] * 25) * dt;
          d.vy[i] += ((d.hy[i] - d.y[i]) * 190 - d.vy[i] * 25) * dt;
          d.x[i] += d.vx[i] * dt;
          d.y[i] += d.vy[i] * dt;
        }
        if (since <= 0 || Math.abs(d.hx[i] - d.x[i]) > 0.4 || Math.abs(d.hy[i] - d.y[i]) > 0.4 || Math.abs(d.vx[i]) > 3 || Math.abs(d.vy[i]) > 3) busy = true;
        else {
          d.x[i] = d.hx[i];
          d.y[i] = d.hy[i];
          d.vx[i] = d.vy[i] = 0;
        }
      }
      if (a <= 0.01) continue;
      const ix = Math.round(d.x[i]);
      const iy = Math.round(d.y[i]);
      if (ix < 0 || iy < 0 || ix + d.s > W || iy + d.s > H) continue;
      const c = d.rgb[i] | (Math.round(a * 255) << 24);
      for (let yy = 0; yy < d.s; yy++) {
        const row = (iy + yy) * W;
        for (let xx = 0; xx < d.s; xx++) d.pixels[row + ix + xx] = c;
      }
    }
    ctx.putImageData(d.image, 0, 0);
    if (busy) {
      if (m.onScreen) m.raf = requestAnimationFrame(frameRef.current);
      return;
    }
    if (m.mode === "back") {
      // Every grain is home: the real card takes over on the same frame.
      m.mode = "rest";
      m.dust = null;
      ctx.clearRect(0, 0, W, H);
      setDusting(false);
    }
  }, []);
  const frameRef = React.useRef(frame);

  const kick = () => {
    const m = sim.current;
    if (m.raf || !m.onScreen) return;
    m.last = performance.now();
    m.raf = requestAnimationFrame(frameRef.current);
  };

  React.useEffect(() => {
    const m = sim.current;
    const root = rootRef.current;
    if (!root) return;
    const move = (e: PointerEvent) => {
      const c = canvasRef.current?.getBoundingClientRect();
      if (!c) return;
      const x = e.clientX - c.left;
      const y = e.clientY - c.top;
      // Only a moving cursor parts the dust; one resting where it clicked leaves no hole.
      if (m.px > -1e3) m.stir = Math.min(1, m.stir + Math.hypot(x - m.px, y - m.py) / 40);
      m.px = x;
      m.py = y;
    };
    window.addEventListener("pointermove", move, { passive: true });
    const io = new IntersectionObserver(([entry]) => {
      m.onScreen = entry.isIntersecting;
      if (m.onScreen && m.mode !== "rest") {
        m.last = performance.now();
        if (!m.raf) m.raf = requestAnimationFrame(frameRef.current);
      } else if (!m.onScreen) {
        cancelAnimationFrame(m.raf);
        m.raf = 0;
      }
    });
    io.observe(root);
    return () => {
      window.removeEventListener("pointermove", move);
      io.disconnect();
      cancelAnimationFrame(m.raf);
      m.raf = 0;
    };
  }, []);

  const remove = (e: React.MouseEvent) => {
    const m = sim.current;
    const card = cardRef.current;
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (gone || !card || !canvas || !root) return;
    setGone(true);
    onDelete?.();
    undoRef.current?.focus({ preventScroll: true });
    if (reduced) return;

    if (!m.dust) {
      const r = root.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // The canvas reaches past the card, but never past the page's edges: that would add a sideways scroll.
      const pageW = document.documentElement.clientWidth;
      const left = Math.min(PAD, Math.max(0, r.left));
      const right = Math.min(PAD, Math.max(0, pageW - r.right));
      canvas.style.left = `${-left}px`;
      canvas.style.top = `${-PAD}px`;
      canvas.style.width = `${r.width + left + right}px`;
      canvas.style.height = `${r.height + PAD * 2}px`;
      canvas.width = Math.ceil((r.width + left + right) * dpr);
      canvas.height = Math.ceil((r.height + PAD * 2) * dpr);
      const fromKeys = e.detail === 0;
      const b = delRef.current?.getBoundingClientRect();
      const origin = fromKeys && b ? { x: b.left + b.width / 2 - r.left, y: b.top + b.height / 2 - r.top } : { x: e.clientX - r.left, y: e.clientY - r.top };
      m.dpr = dpr;
      m.dust = makeDust(card, canvas, left, PAD, origin, dpr);
      m.px = m.ox = origin.x + left;
      m.py = m.oy = origin.y + PAD;
      m.stir = 0;
      setDusting(true);
    }
    if (m.dust) {
      m.mode = "out";
      m.dust.age.fill(0);
      kick();
    }
  };

  const undo = () => {
    const m = sim.current;
    if (!gone) return;
    setGone(false);
    onUndo?.();
    delRef.current?.focus({ preventScroll: true });
    if (!m.dust || reduced) {
      m.mode = "rest";
      m.dust = null;
      setDusting(false);
      return;
    }
    m.mode = "back";
    m.dust.age.fill(0);
    kick();
  };

  const hidden = dusting || (gone && reduced);

  return (
    <div ref={rootRef} data-gone={gone ? "" : undefined} className={cn("ad-dust relative w-full max-w-[420px]", className)} {...props}>
      <style href="ad-dust-delete" precedence="default">
        {CSS}
      </style>
      {tone === "surface" && <div aria-hidden className="ad-dust-shadow absolute inset-0 rounded-card shadow-card" />}
      <div
        ref={cardRef}
        aria-hidden={gone}
        className={cn("relative flex items-center gap-4 rounded-card p-pad", tone === "fill" ? "bg-fill" : "bg-surface", hidden && "opacity-0", gone && "pointer-events-none")}
      >
        {image ? <img src={image} alt="" draggable={false} className="size-16 shrink-0 rounded-control object-cover" /> : null}
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate text-title font-medium text-ink">{title}</span>
          <span className="text-body tabular-nums text-ink-muted">{price}</span>
        </div>
        <button ref={delRef} type="button" className={tone === "fill" ? cn(buttonClass({ icon: true, variant: "ghost" }), "hover:bg-fill-strong focus-visible:bg-fill-strong") : buttonClass({ icon: true })} aria-label={`${deleteLabel} ${title}`} tabIndex={gone ? -1 : undefined} onClick={remove}>
          <Trash2 strokeWidth={1.75} aria-hidden />
        </button>
      </div>
      <canvas ref={canvasRef} aria-hidden className={cn("pointer-events-none absolute", !dusting && "hidden")} />
      <div className="ad-dust-undo absolute inset-0 grid place-items-center">
        <button ref={undoRef} type="button" className={buttonClass()} tabIndex={gone ? undefined : -1} onClick={undo}>
          <RotateCcw strokeWidth={1.75} aria-hidden />
          {undoLabel}
        </button>
      </div>
      <span role="status" className="sr-only">
        {gone ? `${title} deleted` : ""}
      </span>
    </div>
  );
}
