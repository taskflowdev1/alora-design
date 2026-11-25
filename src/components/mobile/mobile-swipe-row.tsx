import * as React from "react";
import { cn, prefersReducedMotion } from "@/lib/ad";
import { useDoubleTapGuard } from "@/lib/ad-hooks";

export interface SwipeAction {
  label: string;
  icon?: React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>;
  onSelect: () => void;
  /** neutral (default), accent for the one key action, danger for destructive (soft, never loud). */
  tone?: "neutral" | "accent" | "danger";
}

export interface SwipeRowProps {
  children: React.ReactNode;
  /** Revealed by swiping right. */
  leading?: SwipeAction[];
  /** Revealed by swiping left. A long swipe runs the first one. */
  trailing?: SwipeAction[];
  className?: string;
}

const ACTION_W = 76;
const W = 22;
let closeOpen: (() => void) | null = null;

const toneClass = { neutral: "bg-fill-strong text-ink", accent: "bg-brand text-brand-ink", danger: "bg-danger-soft text-danger" };

/**
 * Swipe a row sideways to reveal its actions. The row follows the finger only after the gesture is clearly sideways, so
 * vertical scrolling is never stolen. On release it opens or closes by position and speed, on a spring that keeps the
 * throw; a long swipe left runs the first trailing action. Past the actions the first one stretches to fill the gap,
 * and once letting go would run it (60 % of the row) the others fold away, so you know before you lift the finger. A
 * tap on an open row closes it. Swiping is a shortcut: put the same actions in the row's detail screen or a "more"
 * button, so nobody has to discover the gesture. What a full swipe runs happens in one motion, so offer Undo for it
 * (a MobileSnackbar with an Undo action). After a full swipe the row folds shut (200 ms) before the action runs, so the
 * rows below close the gap smoothly instead of jumping when the owner removes it.
 */
export function SwipeRow({ children, leading = [], trailing = [], className }: SwipeRowProps) {
  const front = React.useRef<HTMLDivElement>(null);
  const g = React.useRef({ x: 0, sx: 0, sy: 0, lock: "" as "" | "x" | "y", v: 0, t: 0, raf: 0, moved: false, rest: 0 });
  const [side, setSide] = React.useState<"left" | "right" | null>(null);
  const trail = React.useRef<HTMLDivElement>(null);
  const [armed, setArmed] = React.useState(false);
  const [gone, setGone] = React.useState(false);
  const fold = React.useRef(0);
  const armedRef = React.useRef(false);
  const lw = leading.length * ACTION_W;
  const tw = trailing.length * ACTION_W;

  const sideRef = React.useRef<"left" | "right" | null>(null);
  const place = (x: number) => {
    g.current.x = x;
    if (front.current) front.current.style.transform = x ? `translate3d(${x}px, 0, 0)` : "";
    if (trail.current) trail.current.style.width = `${Math.max(tw, -x)}px`;
    const width = front.current?.offsetWidth ?? 0;
    const arm = tw > 0 && width > 0 && -x > width * 0.6;
    if (arm !== armedRef.current) setArmed((armedRef.current = arm));
    const next = x > 0 ? "left" : x < 0 ? "right" : null;
    if (next !== sideRef.current) setSide((sideRef.current = next));
  };
  const settle = (to: number, v: number, done?: () => void) => {
    const s = g.current;
    cancelAnimationFrame(s.raf);
    s.rest = to;
    if (prefersReducedMotion()) return place(to), done?.();
    const x0 = s.x - to;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = (now - t0) / 1000;
      const d = (x0 + (v + W * x0) * t) * Math.exp(-W * t);
      if (Math.abs(d) < 0.5 && t > 0.04) return place(to), done?.();
      place(to + d);
      s.raf = requestAnimationFrame(step);
    };
    s.raf = requestAnimationFrame(step);
  };
  const close = React.useCallback(() => settle(0, 0), []); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => () => (cancelAnimationFrame(g.current.raf), window.clearTimeout(fold.current)), []);
  /** Fold the row shut, then run the action; a row its owner keeps opens again. */
  const commit = (a: SwipeAction) => {
    const after = () => {
      a.onSelect();
      place(0);
      setGone(false);
    };
    if (prefersReducedMotion()) return after();
    setGone(true);
    fold.current = window.setTimeout(after, 200);
  };

  const run = useDoubleTapGuard((a: SwipeAction) => {
    settle(0, 0);
    a.onSelect();
  });

  return (
    <div className="grid transition-[grid-template-rows] duration-[200ms] ease-ad" style={{ gridTemplateRows: gone ? "0fr" : "1fr" }}>
      <div className={cn("relative min-h-0 overflow-hidden rounded-item", className)} inert={gone || undefined}>
        {leading.length ? (
          <div className="absolute inset-y-0 left-0 flex" style={{ width: lw, visibility: side === "left" ? "visible" : "hidden" }}>
            {leading.map((a) => (
              <ActionButton key={a.label} a={a} onClick={() => run(a)} />
            ))}
          </div>
        ) : null}
        {trailing.length ? (
          <div ref={trail} className="absolute inset-y-0 right-0 flex" style={{ width: tw, visibility: side === "right" ? "visible" : "hidden" }}>
            {trailing.map((a, i) => (
              <ActionButton key={a.label} a={a} onClick={() => run(a)} grow={i === 0} folded={i > 0 && armed} />
            ))}
          </div>
        ) : null}
        <div
          ref={front}
          className="relative bg-surface [touch-action:pan-y]"
          onPointerDown={(e) => {
            const s = g.current;
            cancelAnimationFrame(s.raf);
            Object.assign(s, { sx: e.clientX - s.x, sy: e.clientY, lock: "", v: 0, t: performance.now(), moved: false });
          }}
          onPointerMove={(e) => {
            const s = g.current;
            if (e.buttons === 0 && e.pointerType === "mouse") return;
            const dx = e.clientX - s.sx - s.x;
            const dy = e.clientY - s.sy;
            if (!s.lock) {
              if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
              s.lock = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
              if (s.lock === "x") {
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                if (closeOpen && closeOpen !== close) closeOpen();
                closeOpen = close;
              }
            }
            if (s.lock !== "x") return;
            s.moved = true;
            const raw = e.clientX - s.sx;
            const x = raw > 0 ? (lw ? (raw <= lw ? raw : lw + (raw - lw) * 0.25) : raw * 0.15) : tw ? raw : raw * 0.15;
            const now = performance.now();
            s.v = s.v * 0.4 + ((x - s.x) / Math.max(1, now - s.t)) * 1000 * 0.6;
            s.t = now;
            place(x);
          }}
          onPointerUp={(e) => {
            const s = g.current;
            if (s.lock !== "x") return;
            s.lock = "";
            const v = performance.now() - s.t > 90 ? 0 : s.v;
            const width = e.currentTarget.offsetWidth;
            if (trailing.length && s.x < -width * 0.6) {
              return settle(-width, v, () => commit(trailing[0]));
            }
            const aim = s.x + v * 0.15;
            const to = aim > lw / 2 && lw ? lw : aim < -tw / 2 && tw ? -tw : 0;
            settle(to, v);
          }}
          onPointerCancel={() => ((g.current.lock = ""), settle(g.current.rest, 0))}
          onClickCapture={(e) => {
            const s = g.current;
            if (s.moved) {
              e.preventDefault();
              e.stopPropagation();
              s.moved = false;
            } else if (s.x !== 0) {
              e.preventDefault();
              e.stopPropagation();
              settle(0, 0);
            }
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ a, onClick, grow, folded }: { a: SwipeAction; onClick: () => void; grow?: boolean; folded?: boolean }) {
  const Icon = a.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={folded ? -1 : undefined}
      style={grow ? { minWidth: ACTION_W } : { width: folded ? 0 : ACTION_W }}
      className={cn(
        "flex h-full shrink-0 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden whitespace-nowrap text-[12px] font-medium transition-[width,transform,scale,filter] duration-[150ms] ease-out focus-visible:brightness-90 active:scale-[0.97] data-pressed:scale-[0.97]",
        grow && "flex-1",
        toneClass[a.tone ?? "neutral"],
      )}
    >
      {Icon ? <Icon size={20} strokeWidth={1.75} /> : null}
      {a.label}
    </button>
  );
}
