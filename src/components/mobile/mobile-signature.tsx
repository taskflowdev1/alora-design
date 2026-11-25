import * as React from "react";
import { CornerUpLeft, Trash2 } from "react-feather";
import { cn } from "@/lib/ad";

type Pt = { x: number; y: number; w: number };

export interface MobileSignaturePadProps {
  /** Called after every stroke: a PNG data URL of the signature, or null once it is cleared. */
  onValueChange?: (png: string | null) => void;
  /** @deprecated Use `onValueChange` (the name every other component uses). */
  onChange?: (png: string | null) => void;
  /** The faint word in the empty pad. */
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}

/**
 * Proof of delivery: sign with a finger. The ink follows the finger with no lag (touch-action none, so the page doesn't
 * scroll under it), thins a little on fast strokes like a real pen, and is redrawn in the current ink colour when the
 * theme or size changes. Undo removes the last stroke, Clear removes all; both are real buttons, never a gesture.
 */
export function MobileSignaturePad({ onValueChange, onChange, placeholder = "Sign here", className, ...aria }: MobileSignaturePadProps) {
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const strokes = React.useRef<Pt[][]>([]);
  const live = React.useRef<Pt[] | null>(null);
  const [count, setCount] = React.useState(0);
  const [drawing, setDrawing] = React.useState(false);
  const changed = React.useRef(onValueChange ?? onChange);
  changed.current = onValueChange ?? onChange;

  const draw = React.useCallback(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const dpr = c.width / c.offsetWidth || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, c.offsetWidth, c.offsetHeight);
    ctx.strokeStyle = getComputedStyle(c).color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const s of [...strokes.current, ...(live.current ? [live.current] : [])]) {
      if (s.length === 1) {
        ctx.beginPath();
        ctx.arc(s[0].x, s[0].y, s[0].w / 2, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
        continue;
      }
      for (let i = 1; i < s.length; i++) {
        const a = s[i - 1];
        const b = s[i];
        const m0 = i > 1 ? { x: (s[i - 2].x + a.x) / 2, y: (s[i - 2].y + a.y) / 2 } : a;
        const m1 = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        ctx.beginPath();
        ctx.lineWidth = (a.w + b.w) / 2;
        ctx.moveTo(m0.x, m0.y);
        ctx.quadraticCurveTo(a.x, a.y, m1.x, m1.y);
        ctx.stroke();
      }
    }
  }, []);

  React.useLayoutEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const fit = () => {
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      c.width = Math.round(c.offsetWidth * dpr);
      c.height = Math.round(c.offsetHeight * dpr);
      draw();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);
    const mo = new MutationObserver(draw);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
    mo.observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });
    return () => (ro.disconnect(), mo.disconnect());
  }, [draw]);

  const emit = () => changed.current?.(strokes.current.length ? (canvas.current?.toDataURL("image/png") ?? null) : null);
  const point = (e: React.PointerEvent, prev?: Pt): Pt => {
    const c = canvas.current!;
    const r = c.getBoundingClientRect();
    const k = c.offsetWidth / r.width;
    const x = (e.clientX - r.left) * k;
    const y = (e.clientY - r.top) * k;
    const speed = prev ? Math.hypot(x - prev.x, y - prev.y) : 0;
    const target = Math.max(1.6, 3.4 - speed * 0.08);
    return { x, y, w: prev ? prev.w * 0.6 + target * 0.4 : 2.8 };
  };
  const undo = () => {
    strokes.current = strokes.current.slice(0, -1);
    setCount(strokes.current.length);
    draw();
    emit();
  };
  const clear = () => {
    strokes.current = [];
    setCount(0);
    draw();
    emit();
  };
  const tool =
    "flex h-touch cursor-pointer items-center gap-1.5 rounded-control px-3 text-[15px] text-ink ad-press focus-visible:bg-fill active:scale-[0.97] data-pressed:scale-[0.97] active:bg-fill data-pressed:bg-fill disabled:pointer-events-none disabled:opacity-40";
  return (
    <div className={cn("grid gap-1", className)}>
      <div className="relative h-[200px] overflow-hidden rounded-card bg-surface shadow-card">
        <span aria-hidden className={cn("pointer-events-none absolute inset-0 grid place-items-center text-[20px] text-ink-muted transition-opacity duration-[150ms]", count || drawing ? "opacity-0" : "opacity-60")}>
          {placeholder}
        </span>
        <canvas
          ref={canvas}
          role="img"
          aria-label={aria["aria-label"] ?? (count ? "Signature" : "Empty signature pad")}
          className="absolute inset-0 size-full cursor-crosshair touch-none text-ink"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            live.current = [point(e)];
            setDrawing(true);
            draw();
          }}
          onPointerMove={(e) => {
            const s = live.current;
            if (!s) return;
            const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
            for (const ev of events) s.push(point(ev as unknown as React.PointerEvent, s[s.length - 1]));
            draw();
          }}
          onPointerUp={() => {
            if (!live.current) return;
            strokes.current = [...strokes.current, live.current];
            live.current = null;
            setDrawing(false);
            setCount(strokes.current.length);
            emit();
          }}
          onPointerCancel={() => ((live.current = null), setDrawing(false), draw())}
        />
      </div>
      <div className="flex justify-end gap-1">
        <button type="button" className={tool} onClick={undo} disabled={!count}>
          <CornerUpLeft size={18} strokeWidth={1.75} />
          Undo
        </button>
        <button type="button" className={tool} onClick={clear} disabled={!count}>
          <Trash2 size={18} strokeWidth={1.75} />
          Clear
        </button>
      </div>
    </div>
  );
}
