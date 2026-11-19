import * as React from "react";
import { cn } from "@/lib/ad";

export interface PullToRefreshProps {
  /** Resolve when the new data is in; the dots wave until then. */
  onRefresh: () => Promise<unknown>;
  children: React.ReactNode;
  className?: string;
}

const ARM = 64;
const HOLD = 52;
const W = 18;
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Pull down at the top of a list to reload. The list follows the finger against growing resistance while three dots
 * fill in one by one (how far to pull); past the line they darken (let go now). On release the list rests a little
 * lower while the dots wave, then springs back once the data is in. No spinner. Put it inside the scroll area (a
 * MobileScreen); it only engages when that area is already at the top, so normal scrolling is untouched.
 */
export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const wrap = React.useRef<HTMLDivElement>(null);
  const body = React.useRef<HTMLDivElement>(null);
  const [pull, setPull] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const s = React.useRef({ y0: 0, on: false, at: 0, raf: 0, busy: false });

  const place = React.useCallback((y: number) => {
    s.current.at = y;
    if (body.current) body.current.style.transform = y ? `translate3d(0, ${y}px, 0)` : "";
    setPull(y);
  }, []);
  const settle = React.useCallback(
    (to: number) => {
      const st = s.current;
      cancelAnimationFrame(st.raf);
      if (reduced()) return place(to);
      const d0 = st.at - to;
      const t0 = performance.now();
      const step = (now: number) => {
        const t = (now - t0) / 1000;
        const d = d0 * (1 + W * t) * Math.exp(-W * t);
        if (Math.abs(d) < 0.5) return place(to);
        place(to + d);
        st.raf = requestAnimationFrame(step);
      };
      st.raf = requestAnimationFrame(step);
    },
    [place],
  );

  React.useEffect(() => {
    const el = wrap.current;
    const scroller = el?.closest<HTMLElement>("[data-mobile-screen]") ?? el?.parentElement;
    if (!el || !scroller) return;
    const st = s.current;
    const start = (y: number) => {
      if (st.busy || scroller.scrollTop > 0) return;
      cancelAnimationFrame(st.raf);
      st.y0 = y - st.at * 2;
      st.on = true;
    };
    // Resistance: the list moves half as far as the finger, and less the further it goes.
    const move = (y: number, e: Event) => {
      if (!st.on) return;
      const raw = y - st.y0;
      if (raw <= 0) {
        if (st.at) place(0);
        return;
      }
      if (e.cancelable) e.preventDefault();
      // A pull is not a tap: rows under the finger drop their press state and won't open on release.
      if (body.current && raw > 6) body.current.style.pointerEvents = "none";
      place(Math.min(140, raw * 0.5 * (1 - Math.min(0.5, raw / 900))));
    };
    const end = async () => {
      if (!st.on) return;
      st.on = false;
      window.setTimeout(() => body.current && (body.current.style.pointerEvents = ""), 0);
      if (st.at < ARM) return settle(0);
      st.busy = true;
      setBusy(true);
      settle(HOLD);
      try {
        await onRefreshRef.current();
      } finally {
        st.busy = false;
        setBusy(false);
        settle(0);
      }
    };
    const ts = (e: TouchEvent) => start(e.touches[0].clientY);
    const tm = (e: TouchEvent) => move(e.touches[0].clientY, e);
    const md = (e: MouseEvent) => e.button === 0 && start(e.clientY);
    const mm = (e: MouseEvent) => move(e.clientY, e);
    scroller.addEventListener("touchstart", ts, { passive: true });
    scroller.addEventListener("touchmove", tm, { passive: false });
    scroller.addEventListener("touchend", end);
    scroller.addEventListener("touchcancel", end);
    scroller.addEventListener("mousedown", md);
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", end);
    return () => {
      cancelAnimationFrame(st.raf);
      scroller.removeEventListener("touchstart", ts);
      scroller.removeEventListener("touchmove", tm);
      scroller.removeEventListener("touchend", end);
      scroller.removeEventListener("touchcancel", end);
      scroller.removeEventListener("mousedown", md);
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", end);
    };
  }, [place, settle]);
  const onRefreshRef = React.useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const p = Math.min(1, pull / ARM);
  return (
    <div ref={wrap} className={cn("relative", className)}>
      <div aria-hidden={!busy} role={busy ? "status" : undefined} aria-label={busy ? "Refreshing" : undefined} className="absolute inset-x-0 top-0 flex justify-center gap-1.5" style={{ height: pull, alignItems: "center", opacity: pull ? 1 : 0 }}>
        {[0, 1, 2].map((i) => {
          const on = busy || p > (i + 0.5) / 3;
          return (
            <span
              key={i}
              className={cn(
                "size-[7px] rounded-full transition-[background-color,transform,opacity] duration-[180ms] ease-ad",
                p >= 1 || busy ? "bg-ink" : "bg-ink-muted",
                busy && "animate-[ad-pull-wave_900ms_ease-in-out_infinite]",
              )}
              style={{ opacity: on ? 1 : 0.25, transform: on ? "scale(1)" : "scale(0.6)", animationDelay: `${i * 120}ms` }}
            />
          );
        })}
        <style href="ad-pull-refresh" precedence="default">{`@keyframes ad-pull-wave { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }`}</style>
      </div>
      <div ref={body} className="will-change-transform">
        {children}
      </div>
    </div>
  );
}
