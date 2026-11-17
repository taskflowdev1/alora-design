import * as React from "react";
import { cn } from "@/lib/ad";

export type OrbTone = "ink" | "accent" | "muted";

export interface ThinkingOrbsProps {
  /** Animates while true; false hides the orbs but keeps their space. */
  active?: boolean;
  /** The box, in px. The orbs overflow it a little so the larger ones never clip. */
  size?: number;
  /** How many orbs ride the ring. */
  count?: number;
  /** 1 = the Board's pace. */
  speed?: number;
  /** Each orb's radius at the ring's centre depth, as a fraction of the box. */
  orb?: number;
  /** The ring's radius, as a fraction of the box. */
  ring?: number;
  /** Text colour, accent, or muted text. */
  tone?: OrbTone;
  className?: string;
}

/** Perspective distance in ring radii; nearer orbs grow as p^1.6. */
const F = 4;
const TONE: Record<OrbTone, string> = { ink: "text-ink", accent: "text-brand", muted: "text-ink-muted" };

// One point of the ring: it spins in its own plane while the plane tilts, yaws and rolls at unrelated speeds,
// so the path never visibly repeats.
function project(a: number, t: number) {
  const x = Math.cos(a);
  const y = Math.sin(a);
  const tilt = 0.95 + 0.65 * Math.sin(t * 0.53) + 0.25 * Math.sin(t * 1.37);
  const yaw = t * 0.8 + 0.9 * Math.sin(t * 0.31);
  const roll = 0.6 * Math.sin(t * 0.23 + 1);
  const y1 = y * Math.cos(tilt);
  const z1 = y * Math.sin(tilt);
  const x2 = x * Math.cos(yaw) + z1 * Math.sin(yaw);
  const z2 = -x * Math.sin(yaw) + z1 * Math.cos(yaw);
  const p = F / (F + z2);
  const sx = x2 * p;
  const sy = y1 * p;
  return { x: sx * Math.cos(roll) - sy * Math.sin(roll), y: sx * Math.sin(roll) + sy * Math.cos(roll), z: z2, p };
}

/** How far the largest, nearest orb reaches past the box, in box sizes. */
const overflow = (orb: number, ring: number) => Math.max(0, ring * (F / (F - 1)) + orb * (F / (F - 1)) ** 1.6 - 0.5);

// Flat orbs in the current text colour, no shading or outline: depth comes only from size and draw order.
function draw(canvas: HTMLCanvasElement, box: number, t: number, count: number, orb: number, ring: number) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const c = canvas.getContext("2d");
  if (!c) return;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, w, h);
  const R = box * ring;
  const base = box * orb;
  const spin = t * 2.2;
  const orbs = Array.from({ length: count }, (_, i) => project(spin + (i * 2 * Math.PI) / count, t)).sort((u, v) => v.z - u.z);
  c.fillStyle = getComputedStyle(canvas).color;
  for (const o of orbs) {
    c.beginPath();
    c.arc(w / 2 + o.x * R, h / 2 + o.y * R, base * o.p ** 1.6, 0, Math.PI * 2);
    c.fill();
  }
}

/**
 * The thinking loader from the Alora Board assistant: a ring of orbs turning in 3D.
 * Animates only while `active` and on screen; with reduced motion it draws one still frame.
 * A still frame follows theme and accent changes.
 */
export function ThinkingOrbs({ active = true, size = 22, count = 3, speed = 1, orb = 0.154, ring = 0.32, tone = "ink", className }: ThinkingOrbsProps) {
  const boxRef = React.useRef<HTMLSpanElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const n = Math.max(1, Math.round(count));
  React.useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!active || !box || !canvas || typeof window.matchMedia !== "function") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const t0 = performance.now();
    let frame = 0;
    let onScreen = true;
    const paint = (now: number) => draw(canvas, box.clientHeight, reduce.matches ? 0.6 : ((now - t0) / 1000) * speed, n, orb, ring);
    const loop = (now: number) => {
      paint(now);
      frame = requestAnimationFrame(loop);
    };
    const restart = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (reduce.matches || !onScreen) paint(performance.now());
      else frame = requestAnimationFrame(loop);
    };
    const visibility =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver((entries) => {
            onScreen = entries[entries.length - 1].isIntersecting;
            restart();
          });
    visibility?.observe(box);
    const theme = new MutationObserver(restart);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });
    const sized = new ResizeObserver(restart);
    sized.observe(box);
    reduce.addEventListener("change", restart);
    restart();
    return () => {
      cancelAnimationFrame(frame);
      visibility?.disconnect();
      theme.disconnect();
      sized.disconnect();
      reduce.removeEventListener("change", restart);
    };
  }, [active, speed, n, orb, ring, tone, size]);
  const pad = Math.ceil(overflow(orb, ring) * size) + 2;
  return (
    <span
      ref={boxRef}
      aria-hidden="true"
      data-active={active ? "" : undefined}
      className={cn("relative inline-block shrink-0 align-middle", TONE[tone], !active && "invisible", className)}
      style={{ width: size, height: size }}
    >
      <canvas ref={canvasRef} className="pointer-events-none absolute" style={{ inset: -pad, width: size + pad * 2, height: size + pad * 2 }} />
    </span>
  );
}
