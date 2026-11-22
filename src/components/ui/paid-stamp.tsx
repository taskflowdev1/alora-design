import * as React from "react";
import { cn, formatRp, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";

export interface PaidStampLine {
  name: string;
  qty: number;
  price: number;
}

const DEFAULT_LINES: PaidStampLine[] = [
  { name: "Gelas kopi tanah liat", qty: 12, price: 45000 },
  { name: "Teko tanah liat", qty: 2, price: 185000 },
  { name: "Piring ceper", qty: 8, price: 42500 },
];

const MAX_PRINTS = 5;
/** A rubber stamp runs dry: each print in a row is fainter than the last. */
const INK = [1, 0.84, 0.7, 0.57, 0.46];
const SLAM_MS = 130;
const HOLD_MS = 70;
const LIFT_MS = 200;
const TOTAL_MS = SLAM_MS + HOLD_MS + LIFT_MS;

/*
 * Paper and print are real objects, the same in both themes. The ink takes the theme's accent, so a stamp reads as the
 * shop's own colour; its roughness is a turbulence mask, and the bleed is a soft copy that spreads under it.
 */
const CSS = `
.ad-stamp {
  container-type: inline-size;
  --stamp-paper: oklch(0.985 0.005 90); /* grey-ok: invoice paper */
  --stamp-paper-2: oklch(0.955 0.008 88); /* grey-ok: paper, the soft band behind the total */
  --stamp-ink: oklch(0.25 0.006 80); /* grey-ok: printed text */
  --stamp-soft: oklch(0.48 0.008 80); /* grey-ok: printed text, lighter */
  --stamp-wood: oklch(0.42 0.05 55); /* grey-ok: the stamp's wooden block */
  --stamp-wood-top: oklch(0.52 0.06 60); /* grey-ok: the wood, catching the light */
  --stamp-knob: oklch(0.3 0.035 50); /* grey-ok: the turned handle */
  --stamp-cast: oklch(0.2 0.01 70 / 0.34); /* grey-ok: the stamp's shadow on the paper */
  --stamp-color: var(--ad-brand-7);
}
.ad-stamp-paper { background: var(--stamp-paper); color: var(--stamp-ink); }
.ad-stamp-soft { color: var(--stamp-soft); }
.ad-stamp-band { background: var(--stamp-paper-2); }
.ad-stamp-print { mix-blend-mode: multiply; pointer-events: none; }
.ad-stamp-bleed { filter: blur(1.6px); transform-box: fill-box; transform-origin: center; animation: ad-stamp-bleed 720ms cubic-bezier(0.2, 0.7, 0.2, 1) both; }
@keyframes ad-stamp-bleed { from { opacity: 0; transform: scale(0.995); } to { opacity: 0.42; transform: scale(1.012); } }
.ad-stamp-wet { animation: ad-stamp-wet 720ms ease-out both; }
@keyframes ad-stamp-wet { from { opacity: 1; } to { opacity: 0.9; } }
.ad-stamp-ghost { opacity: 0; transition: opacity 120ms var(--ad-ease); pointer-events: none; }
@media (hover: hover) { .ad-stamp-sheet:hover .ad-stamp-ghost { opacity: 0.14; } }
.ad-stamp-tool { opacity: 0; pointer-events: none; }
.ad-stamp-block { background: linear-gradient(160deg in oklab, var(--stamp-wood-top), var(--stamp-wood)); box-shadow: 0 10px 22px var(--stamp-cast); }
.ad-stamp-knob { background: radial-gradient(circle at 36% 30% in oklab, var(--stamp-wood-top), var(--stamp-knob) 72%); box-shadow: 0 3px 7px var(--stamp-cast); }
.ad-stamp-sheet:focus-visible { background: var(--stamp-paper-2); }`;

/** On touch, the button answers across a full 44 px. */
const TOUCH = "relative pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:top-1/2 pointer-coarse:after:h-[44px] pointer-coarse:after:-translate-y-1/2";

const subscribeMotion = (fn: () => void) => {
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
};

interface Print {
  id: number;
  /** Centre, as a percentage of the sheet. */
  x: number;
  y: number;
  rotate: number;
  seed: number;
  ink: number;
}

function StampArt({ word, date, filter }: { word: string; date: string; filter?: string }) {
  return (
    <g filter={filter} fill="var(--stamp-color)" stroke="none">
      <rect x="4" y="4" width="212" height="96" rx="20" fill="none" stroke="var(--stamp-color)" strokeWidth="5" />
      <rect x="12" y="12" width="196" height="80" rx="13" fill="none" stroke="var(--stamp-color)" strokeWidth="1.75" />
      <text x="110" y="60" textAnchor="middle" fontSize="44" fontWeight="700" letterSpacing="5" fontFamily="var(--ad-font)">
        {word}
      </text>
      <text x="110" y="82" textAnchor="middle" fontSize="13" fontWeight="600" letterSpacing="1.5" fontFamily="var(--ad-font)" style={{ fontVariantNumeric: "tabular-nums" }}>
        {date}
      </text>
    </g>
  );
}

function Imprint({ print, word, date }: { print: Print; word: string; date: string }) {
  const id = `ad-ink-${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      viewBox="0 0 220 104"
      aria-hidden
      className="ad-stamp-print absolute w-[46cqw]"
      style={{ left: `${print.x}%`, top: `${print.y}%`, transform: `translate(-50%, -50%) rotate(${print.rotate}deg)`, opacity: print.ink }}
    >
      <defs>
        <filter id={id} x="-4%" y="-6%" width="108%" height="112%" colorInterpolationFilters="sRGB">
          {/* Coarse noise wobbles the edges; fine noise knocks small holes out of the ink, like a dry patch of rubber. */}
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed={print.seed} result="wobble" />
          <feDisplacementMap in="SourceGraphic" in2="wobble" scale="2.6" result="edge" />
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={print.seed + 7} result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -6 4" result="holes" />
          <feComposite in="edge" in2="holes" operator="in" />
        </filter>
      </defs>
      <g className="ad-stamp-bleed">
        <StampArt word={word} date={date} />
      </g>
      <g className="ad-stamp-wet">
        <StampArt word={word} date={date} filter={`url(#${id})`} />
      </g>
    </svg>
  );
}

export interface PaidStampProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  shop?: string;
  customer?: string;
  invoice?: string;
  lines?: PaidStampLine[];
  /** The word on the rubber. */
  word?: string;
  /** The date on the rubber, as printed. */
  date?: string;
  /** Called on each stamp. */
  onStamp?: () => void;
}

/**
 * An invoice and a rubber stamp. Press anywhere on the paper and the stamp slams down there: the sheet jolts, the ink
 * goes on rough and bleeds a little into the page. Stamp again and it prints fainter, like a pad running dry.
 */
export function PaidStamp({ shop = "Rimba Kemang", customer = "Toko Bu Sari", invoice = "INV/2026/11/0482", lines = DEFAULT_LINES, word = "LUNAS", date = "21 NOV 2026", onStamp, className, ...props }: PaidStampProps) {
  const sheet = React.useRef<HTMLDivElement>(null);
  const tool = React.useRef<HTMLDivElement>(null);
  const ghost = React.useRef<SVGSVGElement>(null);
  const timers = React.useRef<number[]>([]);
  const nextId = React.useRef(1);
  const printed = React.useRef(0);
  const [prints, setPrints] = React.useState<Print[]>([]);
  const reduced = React.useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => false);
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);

  React.useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const land = (x: number, y: number, rotate: number) => {
    const n = printed.current++;
    const print: Print = { id: nextId.current++, x, y, rotate, seed: 3 + Math.floor(Math.random() * 90), ink: INK[Math.min(n, INK.length - 1)] };
    setPrints((old) => [...old, print].slice(-MAX_PRINTS));
    onStamp?.();
  };

  const stamp = (x: number, y: number) => {
    const rotate = -11 + Math.random() * 7;
    if (reduced) {
      land(x, y, rotate);
      return;
    }
    const el = tool.current;
    const paper = sheet.current;
    if (!el || !paper) return;
    el.getAnimations().forEach((a) => a.cancel());
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    const at = `translate(-50%, -50%) rotate(${rotate}deg)`;
    el.animate(
      [
        { transform: `${at} translateY(-10px) scale(1.72)`, opacity: 0, offset: 0, easing: "cubic-bezier(0.55, 0, 0.9, 0.4)" },
        // Solid almost at once: a block of wood coming down, not a fade.
        { opacity: 1, offset: (SLAM_MS * 0.3) / TOTAL_MS },
        { transform: `${at} scale(1)`, opacity: 1, offset: SLAM_MS / TOTAL_MS },
        { transform: `${at} scale(1)`, opacity: 1, offset: (SLAM_MS + HOLD_MS) / TOTAL_MS, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
        { opacity: 1, offset: (SLAM_MS + HOLD_MS + LIFT_MS * 0.45) / TOTAL_MS },
        { transform: `${at} translateY(-6px) scale(1.36)`, opacity: 0, offset: 1 },
      ],
      { duration: TOTAL_MS },
    );
    timers.current.push(
      window.setTimeout(() => {
        land(x, y, rotate);
        // The sheet takes the hit: down and a hair round, then it settles back.
        const side = x < 50 ? 1 : -1;
        paper.animate(
          [
            { transform: "translateY(0) rotate(0deg) scale(1)" },
            { transform: `translateY(3px) rotate(${side * 0.42}deg) scale(0.994)`, offset: 0.18 },
            { transform: `translateY(-1px) rotate(${side * -0.14}deg) scale(1.001)`, offset: 0.52 },
            { transform: "translateY(0) rotate(0deg) scale(1)" },
          ],
          { duration: 300, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" },
        );
      }, SLAM_MS),
    );
  };

  const onPointer = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    // Keeps the whole print on the paper.
    const mx = 26;
    const my = Math.min(20, ((r.width * 0.13) / r.height) * 100);
    stamp(Math.max(mx, Math.min(100 - mx, ((e.clientX - r.left) / r.width) * 100)), Math.max(my, Math.min(100 - my, ((e.clientY - r.top) / r.height) * 100)));
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !ghost.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    ghost.current.style.left = `${((e.clientX - r.left) / r.width) * 100}%`;
    ghost.current.style.top = `${((e.clientY - r.top) / r.height) * 100}%`;
  };
  const stampDefault = () => stamp(66 + Math.random() * 5, 74 + Math.random() * 4);
  const clear = () => {
    printed.current = 0;
    setPrints([]);
  };

  return (
    <div className={cn("ad-stamp grid w-full min-w-0 gap-3", className)} {...props}>
      <style href="ad-paid-stamp" precedence="default">
        {CSS}
      </style>
      <div
        ref={sheet}
        role="button"
        tabIndex={0}
        aria-label={`Stamp invoice ${invoice} as paid`}
        onClick={onPointer}
        onPointerMove={onMove}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          stampDefault();
        }}
        className="ad-stamp-sheet ad-stamp-paper relative grid cursor-pointer select-none gap-[4.5cqw] overflow-hidden rounded-card p-[6cqw] shadow-raised"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="grid min-w-0 gap-0.5">
            <span translate="no" className="truncate text-[max(15px,4.6cqw)] font-semibold">
              {shop}
            </span>
            <span translate="no" className="ad-stamp-soft truncate text-body">
              {customer}
            </span>
          </div>
          <span translate="no" className="ad-stamp-soft shrink-0 text-body tabular-nums">
            {invoice}
          </span>
        </div>

        <div className="grid gap-[1.8cqw]">
          {lines.map((l) => (
            <div key={l.name} className="flex items-baseline justify-between gap-3 text-body">
              <span translate="no" className="min-w-0 truncate">
                {l.name}
                <span className="ad-stamp-soft tabular-nums">&nbsp;× {l.qty}</span>
              </span>
              <span className="shrink-0 tabular-nums">{formatRp(l.qty * l.price)}</span>
            </div>
          ))}
        </div>

        <div className="ad-stamp-band flex items-baseline justify-between gap-3 rounded-control px-[3cqw] py-[2.4cqw]">
          <span className="ad-stamp-soft text-body">Total</span>
          <span className="text-[max(20px,6cqw)] font-semibold leading-none tabular-nums">{formatRp(total)}</span>
        </div>

        {prints.map((p) => (
          <Imprint key={p.id} print={p} word={word} date={date} />
        ))}
        <svg ref={ghost} viewBox="0 0 220 104" aria-hidden className="ad-stamp-ghost absolute w-[46cqw] -translate-x-1/2 -translate-y-1/2 -rotate-[8deg]">
          <StampArt word={word} date={date} />
        </svg>
        <div ref={tool} aria-hidden className="ad-stamp-tool absolute grid aspect-[220/104] w-[46cqw] place-items-center">
          <div className="ad-stamp-block absolute inset-0 rounded-card" />
          <div className="ad-stamp-knob relative aspect-square w-[34%] rounded-full" />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" className={cn(TOUCH, !prints.length && "invisible")} tabIndex={prints.length ? undefined : -1} onClick={clear}>
          Clear
        </Button>
        <Button variant={prints.length ? "secondary" : "primary"} className={cn("w-[116px]", TOUCH)} onClick={stampDefault}>
          {prints.length ? "Stamp again" : "Mark paid"}
        </Button>
      </div>
    </div>
  );
}
