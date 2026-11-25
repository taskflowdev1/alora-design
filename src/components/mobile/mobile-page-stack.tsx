import * as React from "react";
import { prefersReducedMotion, SAFE_TOP } from "@/lib/ad";

export interface MobileStackPage {
  key: string;
  node: React.ReactNode;
}

export interface MobilePageStackProps {
  /** Bottom to top. Add a page to push it, remove the last to pop it. */
  pages: MobileStackPage[];
  /** The edge swipe finished: remove the top page. */
  onBack: () => void;
  className?: string;
}

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const UNDER = -0.28;

/**
 * Pages that slide, with the iOS edge swipe. A home screen app has no browser back gesture, so the left edge drags the
 * top page away under the finger with the page below easing in. Past 40 % or on a flick it goes back; otherwise it
 * returns. Touch only: with a mouse the back button does this job.
 */
export function MobilePageStack({ pages, onBack, className }: MobilePageStackProps) {
  const [leaving, setLeaving] = React.useState<MobileStackPage | null>(null);
  const root = React.useRef<HTMLDivElement>(null);
  const before = React.useRef(pages);
  const swiped = React.useRef(false);
  const drag = React.useRef<{ x: number; at: number; t: number; v: number; w: number } | null>(null);
  const layer = (key: string) => root.current?.querySelector<HTMLElement>(`[data-stack-page="${CSS.escape(key)}"]`) ?? null;

  React.useLayoutEffect(() => {
    const was = before.current;
    before.current = pages;
    if (pages.length === was.length) return;
    const still = prefersReducedMotion();
    if (pages.length > was.length) {
      if (still) return;
      const top = layer(pages[pages.length - 1].key);
      const under = pages.length > 1 ? layer(pages[pages.length - 2].key) : null;
      top?.animate([{ transform: "translateX(100%)" }, { transform: "none" }], { duration: 340, easing: EASE });
      under?.animate([{ transform: "none" }, { transform: `translateX(${UNDER * 100}%)` }], { duration: 340, easing: EASE });
      return;
    }
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    if (!still) setLeaving(was[was.length - 1]);
  }, [pages]);

  React.useLayoutEffect(() => {
    if (!leaving) return;
    const el = layer(leaving.key);
    const now = before.current;
    const under = layer(now[now.length - 1]?.key ?? "");
    under?.animate([{ transform: `translateX(${UNDER * 100}%)` }, { transform: "none" }], { duration: 300, easing: EASE });
    const a = el?.animate([{ transform: "none" }, { transform: "translateX(100%)" }], { duration: 300, easing: EASE, fill: "forwards" });
    if (!a) return setLeaving(null);
    a.onfinish = () => setLeaving(null);
    return () => a.cancel();
  }, [leaving]);

  const place = (x: number, w: number) => {
    const top = layer(pages[pages.length - 1].key);
    const under = layer(pages[pages.length - 2]?.key ?? "");
    if (top) top.style.transform = x ? `translateX(${x}px)` : "";
    if (under) under.style.transform = `translateX(${UNDER * 100 * (1 - x / w)}%)`;
  };
  const release = (to: number, w: number, done?: () => void) => {
    const top = layer(pages[pages.length - 1].key);
    const under = layer(pages[pages.length - 2]?.key ?? "");
    const from = drag.current?.at ?? 0;
    const opts = { duration: prefersReducedMotion() ? 0 : 240, easing: EASE };
    under?.animate([{ transform: `translateX(${UNDER * 100 * (1 - from / w)}%)` }, { transform: `translateX(${UNDER * 100 * (1 - to / w)}%)` }], opts);
    const a = top?.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }], opts);
    place(to, w);
    if (a && done) a.onfinish = done;
    else done?.();
  };

  const all = leaving ? [...pages, leaving] : pages;
  return (
    <div ref={root} className={className ?? "absolute inset-0 overflow-hidden bg-page"}>
      {all.map((p, i) => {
        const isTop = i === all.length - 1;
        const buried = i < all.length - 2;
        return (
          <div
            key={p.key}
            data-stack-page={p.key}
            inert={!isTop || undefined}
            aria-hidden={!isTop || undefined}
            className="absolute inset-0 overflow-hidden bg-page"
            style={{ zIndex: i, visibility: buried ? "hidden" : undefined, transform: !isTop ? `translateX(${UNDER * 100}%)` : undefined, boxShadow: i > 0 && isTop ? "var(--ad-shadow-dialog)" : undefined }}
          >
            {p.node}
          </div>
        );
      })}
      {pages.length > 1 ? (
        <div
          aria-hidden
          data-stack-edge
          className="absolute bottom-0 left-0 z-[60] w-5 touch-none"
          style={{ top: `calc(${SAFE_TOP} + 44px)` }}
          onPointerDown={(e) => {
            if (e.pointerType === "mouse" || leaving) return;
            const w = root.current?.clientWidth ?? 390;
            drag.current = { x: e.clientX, at: 0, t: e.timeStamp, v: 0, w };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            const scale = (root.current?.getBoundingClientRect().width ?? d.w) / d.w || 1;
            const at = Math.max(0, Math.min(d.w, (e.clientX - d.x) / scale));
            const dt = Math.max(1, e.timeStamp - d.t);
            d.v = d.v * 0.4 + ((at - d.at) / dt) * 600;
            d.t = e.timeStamp;
            d.at = at;
            place(at, d.w);
          }}
          onPointerUp={() => {
            const d = drag.current;
            if (!d) return;
            if (d.at > d.w * 0.4 || d.v > 500) {
              release(d.w, d.w, () => {
                drag.current = null;
                swiped.current = true;
                const top = layer(pages[pages.length - 1].key);
                const under = layer(pages[pages.length - 2]?.key ?? "");
                if (top) top.style.transform = "";
                if (under) under.style.transform = "";
                onBack();
              });
            } else {
              release(0, d.w);
              drag.current = null;
            }
          }}
          onPointerCancel={() => {
            const d = drag.current;
            if (!d) return;
            release(0, d.w);
            drag.current = null;
          }}
        />
      ) : null}
    </div>
  );
}
