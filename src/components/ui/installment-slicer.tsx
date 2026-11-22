import * as React from "react";
import { cn, formatRp, prefersReducedMotion } from "@/lib/ad";

const STIFFNESS = 340;
const DAMPING = 36; // just under critical (36.9): the cut lands without a wobble
const BAR_H = 56;
const CUT_GAP = 4;

/*
 * The bar is `cells` equal parts, the least common multiple of the options, so every option's cuts land on a part's
 * edge. Each edge opens while the handle crosses the stretch into the first option that cuts there, and pieces are the
 * runs between open edges. Drawn as one SVG path per piece: touching parts never show a seam.
 */
const CSS = `
.ad-slicer-control { touch-action: pan-y; cursor: grab; }
.ad-slicer-control:active { cursor: grabbing; }
.ad-slicer-thumb { left: calc(var(--t) * (100% - 18px)); }
.ad-slicer-stop { left: calc(var(--at) * (100% - 18px) + 9px); translate: -50% 0; transition: color 160ms var(--ad-ease); }
.ad-slicer-stop:first-of-type { left: 0; translate: 0 0; }
.ad-slicer-stop:last-of-type { left: auto; right: 0; translate: 0 0; }
.ad-slicer-digit { transition: width 220ms var(--ad-ease), opacity 160ms var(--ad-ease); }
.ad-slicer-strip { transition: transform 260ms var(--ad-ease); }
@media (prefers-reduced-motion: reduce) {
  .ad-slicer-digit, .ad-slicer-strip, .ad-slicer-stop { transition: none !important; }
}`;

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const lcm = (a: number, b: number) => (a * b) / gcd(a, b);
const smooth = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** A rounded rectangle whose left and right corners can differ. */
function piecePath(x: number, w: number, h: number, rl: number, rr: number) {
  const r = x + w;
  return `M${x + rl} 0H${r - rr}Q${r} 0 ${r} ${rr}V${h - rr}Q${r} ${h} ${r - rr} ${h}H${x + rl}Q${x} ${h} ${x} ${h - rl}V${rl}Q${x} 0 ${x + rl} 0Z`;
}

/** The monthly amount. Each digit is a column that rolls to its value, so only the digits that change move. */
function Rolling({ value, longest }: { value: number; longest: number }) {
  const digits = String(value).padStart(longest, " ");
  return (
    <span aria-hidden className="inline-flex overflow-hidden tabular-nums">
      {[...digits].map((c, i) => {
        const place = longest - 1 - i;
        const on = c !== " ";
        return (
          <React.Fragment key={place}>
            <span className="ad-slicer-digit inline-block h-[1.15em] overflow-hidden" style={{ width: on ? "1ch" : 0, opacity: on ? 1 : 0 }}>
              <span className="ad-slicer-strip flex flex-col" style={{ transform: `translateY(${-(on ? Number(c) : 0) * 1.15}em)` }}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                  <span key={d} className="block h-[1.15em] leading-[1.15]">
                    {d}
                  </span>
                ))}
              </span>
            </span>
            {place > 0 && place % 3 === 0 && (
              <span className="ad-slicer-digit inline-block h-[1.15em] overflow-hidden leading-[1.15]" style={{ width: on ? "0.3em" : 0, opacity: on ? 1 : 0 }}>
                .
              </span>
            )}
          </React.Fragment>
        );
      })}
    </span>
  );
}

export interface InstallmentSlicerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "defaultValue"> {
  /** What's being paid for. */
  label?: string;
  /** The full price in rupiah. */
  total?: number;
  /** The month counts to choose from, ascending. 1 is paying in full. */
  options?: number[];
  /** Controlled: the chosen month count. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (months: number) => void;
}

/**
 * A price you cut into installments. Dragging across the month counts slices one solid bar into that many rounded
 * pieces, the cuts opening under the handle, while the monthly amount rolls. The first piece is what's due now.
 */
export function InstallmentSlicer({ label = "Gelas kopi tanah liat, 14 pcs", total = 1250000, options = [1, 3, 6, 12], value, defaultValue, onValueChange, className, ...props }: InstallmentSlicerProps) {
  const last = options.length - 1;
  const [own, setOwn] = React.useState(defaultValue ?? options[0]);
  const months = value ?? own;
  const index = Math.max(0, options.indexOf(months));
  const cells = React.useMemo(() => options.reduce(lcm, 1), [options]);

  const root = React.useRef<HTMLDivElement>(null);
  const svg = React.useRef<SVGSVGElement>(null);
  const control = React.useRef<HTMLDivElement>(null);
  const m = React.useRef({ t: index, v: 0, raf: 0, width: 0, dragging: false, lastX: 0, lastT: 0, speed: 0 });

  /** The edge between parts b-1 and b opens on the way into this option. */
  const opensAt = React.useMemo(() => {
    const out: number[] = [];
    for (let b = 1; b < cells; b++) out[b] = options.findIndex((o) => b % (cells / o) === 0);
    return out;
  }, [cells, options]);

  const paint = React.useCallback(() => {
    const { t, width: W } = m.current;
    root.current?.style.setProperty("--t", (t / Math.max(last, 1)).toFixed(4));
    const el = svg.current;
    if (!el || !W) return;
    const open: number[] = [];
    let gaps = 0;
    for (let b = 1; b < cells; b++) {
      const at = opensAt[b];
      const g = at <= 0 ? 1 : smooth(clamp01(t - (at - 1)));
      open[b] = g;
      gaps += g * CUT_GAP;
    }
    const cw = (W - gaps) / cells;
    const R = Math.min(BAR_H / 2, Number.parseFloat(getComputedStyle(el).getPropertyValue("--ad-radius-control")) || 0);
    const paths = el.querySelectorAll<SVGPathElement>("[data-base]");
    const later = el.querySelectorAll<SVGPathElement>("[data-later]");
    // The months after the first turn neutral over the first stretch of the drag, so no piece changes colour at a cut.
    el.style.setProperty("--later", clamp01(t).toFixed(3));
    let drawn = 0;
    let start = 0;
    let startG = 1;
    let x = 0;
    for (let b = 1; b <= cells; b++) {
      x += cw;
      const g = b === cells ? 1 : open[b];
      if (g > 0.004) {
        const w = x - start;
        const rl = Math.min(R * startG, w / 2);
        const rr = Math.min(R * g, w / 2);
        const d = piecePath(start, w, BAR_H, rl, rr);
        paths[drawn]?.setAttribute("d", d);
        later[drawn]?.setAttribute("d", drawn === 0 ? "" : d);
        drawn++;
        x += g * CUT_GAP;
        start = x;
        startG = g;
      } else if (b < cells) x += g * CUT_GAP;
    }
    for (let i = drawn; i < paths.length; i++) {
      paths[i].setAttribute("d", "");
      later[i].setAttribute("d", "");
    }
  }, [cells, last, opensAt]);

  React.useLayoutEffect(() => {
    const el = control.current;
    if (!el) return;
    const measure = () => {
      m.current.width = el.clientWidth;
      svg.current?.setAttribute("viewBox", `0 0 ${m.current.width} ${BAR_H}`);
      paint();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const anim = m.current;
    return () => {
      ro.disconnect();
      cancelAnimationFrame(anim.raf);
    };
  }, [paint]);

  const settle = React.useCallback(
    (to: number, instant = false) => {
      const a = m.current;
      cancelAnimationFrame(a.raf);
      if (instant || prefersReducedMotion()) {
        a.t = to;
        a.v = 0;
        paint();
        return;
      }
      let prev = performance.now();
      const step = (now: number) => {
        const dt = Math.min(Math.max(now - prev, 1) / 1000, 1 / 30);
        prev = now;
        a.v += (STIFFNESS * (to - a.t) - DAMPING * a.v) * dt;
        a.t += a.v * dt;
        if (Math.abs(to - a.t) < 0.002 && Math.abs(a.v) < 0.02) {
          a.t = to;
          a.v = 0;
          paint();
          return;
        }
        paint();
        a.raf = requestAnimationFrame(step);
      };
      a.raf = requestAnimationFrame(step);
    },
    [paint],
  );

  // A value set from outside travels there too.
  React.useEffect(() => {
    if (!m.current.dragging) settle(index);
  }, [index, settle]);

  const choose = (i: number) => {
    const next = options[Math.max(0, Math.min(last, i))];
    if (next === months) return;
    setOwn(next);
    onValueChange?.(next);
  };

  const fromPointer = (clientX: number) => {
    const r = control.current!.getBoundingClientRect();
    return clamp01((clientX - r.left - 9) / Math.max(1, r.width - 18)) * last;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const a = m.current;
    cancelAnimationFrame(a.raf);
    a.dragging = true;
    a.lastX = e.clientX;
    a.lastT = e.timeStamp;
    a.speed = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
    control.current?.querySelector<HTMLElement>("[role=slider]")?.focus({ preventScroll: true });
    a.t = fromPointer(e.clientX);
    paint();
    choose(Math.round(a.t));
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const a = m.current;
    if (!a.dragging) return;
    a.t = fromPointer(e.clientX);
    const dt = e.timeStamp - a.lastT;
    if (dt > 0) {
      const w = Math.max(1, a.width - 18);
      a.speed = a.speed * 0.6 + (((e.clientX - a.lastX) / w) * last * 1000 * 0.4) / dt;
      a.lastX = e.clientX;
      a.lastT = e.timeStamp;
    }
    paint();
    choose(Math.round(a.t));
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const a = m.current;
    if (!a.dragging) return;
    a.dragging = false;
    a.v = e.timeStamp - a.lastT > 90 ? 0 : a.speed;
    const to = Math.round(a.t);
    choose(to);
    settle(to);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const to = { ArrowRight: index + 1, ArrowUp: index + 1, ArrowLeft: index - 1, ArrowDown: index - 1, Home: 0, End: last }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const clamped = Math.max(0, Math.min(last, to));
    choose(clamped);
    // From the keyboard the cut lands at once (motion.no-keyboard-animation).
    settle(clamped, true);
  };

  const monthly = Math.ceil(total / months);
  const longest = String(Math.max(...options.map((o) => Math.ceil(total / o)))).length;
  const stopLabel = (o: number) => (o === 1 ? "Full" : `${o}×`);
  const spoken = months === 1 ? `Paid in full, ${formatRp(total)}` : `${months} months, ${formatRp(monthly)} per month`;

  return (
    <div ref={root} className={cn("grid min-w-0 gap-4", className)} style={{ "--t": index / Math.max(last, 1) } as React.CSSProperties} {...props}>
      <style href="ad-installment-slicer" precedence="default">
        {CSS}
      </style>
      <div className="flex items-baseline justify-between gap-4 text-body">
        <span translate="no" className="min-w-0 truncate text-ink-muted">
          {label}
        </span>
        <span className="shrink-0 tabular-nums text-ink-muted">{formatRp(total)}</span>
      </div>
      <p className="flex items-baseline gap-2 whitespace-nowrap font-semibold tracking-[-0.03em] text-ink">
        <span className="text-title font-medium tracking-normal text-ink-muted">Rp</span>
        <span className="text-[length:clamp(34px,11cqw,48px)] leading-[1.15]">
          <Rolling value={monthly} longest={longest} />
        </span>
        <span className="text-title font-medium tabular-nums tracking-normal text-ink-muted">{months === 1 ? "" : `× ${months}`}</span>
      </p>
      <div ref={control} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd} className="ad-slicer-control grid select-none gap-4">
        <svg ref={svg} aria-hidden height={BAR_H} width="100%" preserveAspectRatio="none" className="block">
          {Array.from({ length: cells }, (_, i) => (
            <path key={i} data-base="" fill="var(--ad-brand)" />
          ))}
          <g style={{ opacity: "var(--later, 0)" }}>
            {Array.from({ length: cells }, (_, i) => (
              <path key={i} data-later="" fill="var(--ad-fill-strong)" />
            ))}
          </g>
        </svg>
        <div className="relative h-[18px]">
          <div aria-hidden className="absolute inset-x-0 top-1/2 h-[4px] -translate-y-1/2 rounded-full bg-fill" />
          <div
            role="slider"
            tabIndex={0}
            aria-label="Installments"
            aria-valuemin={options[0]}
            aria-valuemax={options[last]}
            aria-valuenow={months}
            aria-valuetext={spoken}
            onKeyDown={onKeyDown}
            className="ad-slicer-thumb ad-press absolute top-0 size-[18px] rounded-full bg-thumb shadow-thumb after:absolute after:-inset-[13px] after:content-[''] focus-visible:bg-ink-muted active:scale-[0.97]"
          />
        </div>
        <div aria-hidden className="relative -mt-1 h-[1.45em] text-body tabular-nums">
          {options.map((o, i) => (
            <span key={o} className={cn("ad-slicer-stop absolute top-0", o === months ? "font-medium text-ink" : "text-ink-muted")} style={{ "--at": i / Math.max(last, 1) } as React.CSSProperties}>
              {stopLabel(o)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
