import * as React from "react";
import { Plus, RotateCcw } from "react-feather";
import { cn, formatNumber, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";

/** A 5 × 7 figure, one string per row. */
const FONT: Record<string, string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "00100"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
};
const ROWS = 7;
const PITCH = 10;
const DOT = 3.7;
/** ms per unit of distance: how fast the ripple travels across the board. */
const WAVE_SPEED = 0.62;
const LED_MS = 300;
const WAVE_REACH = 92;

type Led = { x: number; y: number; on: number; from: number; to: number; at: number; lift: number };
type Layout = { cols: number; slots: { place: number; col: number }[]; seps: { group: number; col: number }[] };

/** Right-aligned columns for `places` digits with a one-dot gap between figures and a narrow column per separator. */
function layoutFor(places: number): Layout {
  const slots: Layout["slots"] = [];
  const seps: Layout["seps"] = [];
  let col = 0;
  for (let place = places - 1; place >= 0; place--) {
    slots.push({ place, col });
    col += 6;
    if (place > 0 && place % 3 === 0) {
      seps.push({ group: place / 3, col });
      col += 2;
    }
  }
  return { cols: col - 1, slots, seps };
}

const litAt = (text: string, layout: Layout) => {
  const on = new Set<string>();
  for (const { place, col } of layout.slots) {
    const ch = text[text.length - 1 - place];
    const glyph = ch ? FONT[ch] : undefined;
    if (!glyph) continue;
    glyph.forEach((row, y) => {
      [...row].forEach((bit, x) => {
        if (bit === "1") on.add(`${col + x},${y}`);
      });
    });
  }
  for (const { group, col } of layout.seps) if (text.length > group * 3) on.add(`${col},${ROWS - 1}`);
  return on;
};

const easeOut = (t: number) => 1 - (1 - t) ** 3;

export interface DotMatrixNumberProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "defaultValue"> {
  label?: React.ReactNode;
  /** Controlled value; leave out to let the board keep its own. */
  value?: number;
  defaultValue?: number;
  /** How many digits the board has room for. */
  places?: number;
  /** What the button adds, and its label. */
  step?: number;
  actionLabel?: string;
  onValueChange?: (value: number) => void;
}

/**
 * A big figure drawn in round LEDs. When the value changes, a ripple spreads from the digit that changed; press the
 * board anywhere and the same ripple starts under your finger.
 */
export function DotMatrixNumber({ label = "Orders today", value, defaultValue = 1284, places = 4, step = 1, actionLabel = "New order", onValueChange, className, ...props }: DotMatrixNumberProps) {
  const [inner, setInner] = React.useState(defaultValue);
  const shown = value ?? inner;
  const [start] = React.useState(shown);
  const limit = 10 ** places - 1;
  const text = String(Math.max(0, Math.min(limit, Math.round(shown))));

  const layout = React.useMemo(() => layoutFor(places), [places]);
  const W = layout.cols * PITCH;
  const H = ROWS * PITCH;

  // The unlit dots never change, so they are one path; only the lit layer is touched per frame.
  const board = React.useMemo(() => {
    let d = "";
    const leds: Led[] = [];
    const first = litAt(text, layout);
    for (let cx = 0; cx < layout.cols; cx++) {
      for (let cy = 0; cy < ROWS; cy++) {
        const x = cx * PITCH + PITCH / 2;
        const y = cy * PITCH + PITCH / 2;
        d += `M${x - DOT} ${y}a${DOT} ${DOT} 0 1 0 ${DOT * 2} 0a${DOT} ${DOT} 0 1 0 ${-DOT * 2} 0`;
        const on = first.has(`${cx},${cy}`) ? 1 : 0;
        leds.push({ x, y, on, from: on, to: on, at: -1, lift: 0 });
      }
    }
    return { d, leds };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- first paint only; later values go through the ripple
  }, [layout]);

  const lit = React.useRef<(SVGCircleElement | null)[]>([]);
  const svg = React.useRef<SVGSVGElement>(null);
  const loop = React.useRef({ raf: 0, onScreen: true });
  const prev = React.useRef(text);

  const paintAll = React.useCallback(() => {
    board.leds.forEach((l, i) => lit.current[i]?.setAttribute("opacity", l.on.toFixed(3)));
  }, [board]);

  const run = React.useCallback(() => {
    const lp = loop.current;
    if (lp.raf) return;
    const frame = (t: number) => {
      lp.raf = 0;
      let moving = false;
      board.leds.forEach((l, i) => {
        if (l.at < 0) return;
        const age = (t - l.at) / LED_MS;
        let b: number;
        if (age < 0) {
          b = l.from;
          moving = true;
        } else if (age >= 1) {
          b = l.to;
          l.at = -1;
          l.from = l.to;
          l.lift = 0;
        } else {
          // Up to the crest of the wave, then down onto what this dot should finally be.
          const crest = Math.max(l.from, l.to, l.lift);
          b = age < 0.28 ? l.from + (crest - l.from) * easeOut(age / 0.28) : crest + (l.to - crest) * easeOut((age - 0.28) / 0.72);
          moving = true;
        }
        if (Math.abs(b - l.on) > 0.004 || age >= 1) {
          l.on = b;
          lit.current[i]?.setAttribute("opacity", b.toFixed(3));
        }
      });
      if (moving && lp.onScreen) lp.raf = requestAnimationFrame(frame);
      else if (moving) {
        for (const l of board.leds) {
          l.on = l.from = l.to;
          l.at = -1;
          l.lift = 0;
        }
        paintAll();
      }
    };
    lp.raf = requestAnimationFrame(frame);
  }, [board, paintAll]);

  const ripple = React.useCallback(
    (origins: { x: number; y: number }[], next: Set<string>) => {
      const now = performance.now();
      board.leds.forEach((l) => {
        const key = `${Math.floor(l.x / PITCH)},${Math.floor(l.y / PITCH)}`;
        const to = next.has(key) ? 1 : 0;
        const dist = Math.min(...origins.map((o) => Math.hypot(l.x - o.x, l.y - o.y)));
        l.from = l.on;
        l.to = to;
        l.at = now + dist / WAVE_SPEED;
        l.lift = 0.62 * Math.max(0, 1 - dist / WAVE_REACH);
      });
      run();
    },
    [board, run],
  );

  React.useEffect(() => {
    if (prev.current === text) return;
    const before = prev.current;
    prev.current = text;
    const next = litAt(text, layout);
    if (prefersReducedMotion() || !loop.current.onScreen) {
      board.leds.forEach((l) => {
        const on = next.has(`${Math.floor(l.x / PITCH)},${Math.floor(l.y / PITCH)}`) ? 1 : 0;
        l.on = l.from = l.to = on;
        l.at = -1;
      });
      paintAll();
      return;
    }
    const changed = layout.slots.filter(({ place }) => before[before.length - 1 - place] !== text[text.length - 1 - place]);
    const origins = (changed.length ? changed : layout.slots).map(({ col }) => ({ x: (col + 2.5) * PITCH, y: H / 2 }));
    ripple(origins, next);
  }, [text, layout, board, H, paintAll, ripple]);

  React.useEffect(() => {
    const lp = loop.current;
    const el = svg.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      lp.onScreen = entry.isIntersecting;
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(lp.raf);
      lp.raf = 0;
    };
  }, []);

  const set = (next: number) => {
    const v = Math.max(0, Math.min(limit, next));
    if (value === undefined) setInner(v);
    onValueChange?.(v);
  };

  const press = (e: React.PointerEvent<SVGSVGElement>) => {
    if (prefersReducedMotion()) return;
    const r = e.currentTarget.getBoundingClientRect();
    ripple([{ x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }], litAt(text, layout));
  };

  return (
    <Card className={cn("grid min-w-0 gap-4", className)} {...props}>
      <span className="truncate text-body text-ink-muted">{label}</span>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${typeof label === "string" ? `${label}: ` : ""}${formatNumber(Number(text))}`} onPointerDown={press} className="block h-auto w-full cursor-pointer touch-pan-y select-none">
        <path d={board.d} className="fill-fill" />
        <g className="fill-ink">
          {board.leds.map((l, i) => (
            <circle
              key={`${l.x},${l.y}`}
              ref={(el) => {
                lit.current[i] = el;
              }}
              cx={l.x}
              cy={l.y}
              r={DOT}
              opacity={l.on}
            />
          ))}
        </g>
      </svg>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-gap">
        <span />
        <Button variant="primary" onClick={() => set(shown + step)} disabled={shown >= limit}>
          <Plus strokeWidth={1.75} />
          {actionLabel}
        </Button>
        <span className="flex justify-end">
          <Tooltip content="Reset">
            <Button
              size="sm"
              variant="ghost"
              icon
              aria-label="Reset"
              onClick={() => set(start)}
              tabIndex={shown === start ? -1 : undefined}
              className={cn("text-ink-muted transition-[opacity,scale] duration-[160ms]", shown === start && "pointer-events-none opacity-0")}
            >
              <RotateCcw strokeWidth={1.75} />
            </Button>
          </Tooltip>
        </span>
      </div>
    </Card>
  );
}
