import * as React from "react";
import { RotateCcw } from "react-feather";
import { cn, formatNumber, formatRp, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";

/** A thousands separator's width, in em. */
const SEP = 0.28;
const STIFFNESS = 260;
const DAMPING = 31; // just under critical: a digit lands with no visible bounce
/** Each place starts a little after the one to its right, so a carry reads as a ripple leftward. */
const STAGGER = 16;

/*
 * The number is a fixed box; every digit and separator is absolutely placed in it by two whole numbers (--i digits and
 * --s separators from the left) and slides on transform only, so a new leading digit never reflows anything.
 */
const CSS = `
.ad-odo { --dw: 0.58; }
.ad-odo-cell {
  position: absolute; left: 0; top: 0; height: 100%; text-align: center;
  transform: translateX(calc((var(--i) * var(--dw) + var(--s) * ${SEP}) * 1em));
  transition: transform 260ms var(--ad-ease), opacity 180ms var(--ad-ease);
}
.ad-odo-cell[data-on="false"] { opacity: 0; }
.ad-odo-glyph { position: absolute; inset: 0; }
@media (prefers-reduced-motion: reduce) { .ad-odo-cell { transition: none; } }`;

/** Distance on the 0–9 wheel, in -5…5. */
const wrap = (n: number) => ((((n + 5) % 10) + 10) % 10) - 5;
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** One wheel of ten digits. It keeps an unbounded position, so a new digit is always reached the short way round. */
function Wheel({ digit, delay }: { digit: number; delay: number }) {
  const box = React.useRef<HTMLSpanElement>(null);
  const motion = React.useRef({ pos: digit, vel: 0, to: digit, raf: 0, timer: 0, last: 0 });

  const paint = React.useCallback(() => {
    const el = box.current;
    if (!el) return;
    const m = motion.current;
    for (let i = 0; i < 10; i++) {
      const glyph = el.children[i] as HTMLElement;
      const d = wrap(i - m.pos);
      const opacity = Math.max(0, 1 - Math.abs(d) * 1.25);
      glyph.style.opacity = opacity.toFixed(3);
      glyph.style.transform = opacity ? `translateY(${(d * 100).toFixed(2)}%)` : "";
    }
    const blur = Math.min(1.4, Math.max(0, Math.abs(m.vel) - 7) / 16);
    el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "";
  }, []);

  React.useLayoutEffect(paint, [paint]);

  React.useEffect(() => {
    const m = motion.current;
    const step = wrap(digit - m.to);
    if (!step) return;
    m.to += step;
    if (prefersReducedMotion()) {
      m.pos = m.to;
      m.vel = 0;
      paint();
      return;
    }
    const frame = (t: number) => {
      const dt = Math.min(Math.max(t - m.last, 1) / 1000, 1 / 30);
      m.last = t;
      m.vel += (STIFFNESS * (m.to - m.pos) - DAMPING * m.vel) * dt;
      m.pos += m.vel * dt;
      if (Math.abs(m.to - m.pos) < 0.002 && Math.abs(m.vel) < 0.02) {
        m.pos = m.to;
        m.vel = 0;
        m.raf = 0;
        paint();
        return;
      }
      paint();
      m.raf = requestAnimationFrame(frame);
    };
    window.clearTimeout(m.timer);
    m.timer = window.setTimeout(() => {
      if (m.raf) return;
      m.last = performance.now();
      m.raf = requestAnimationFrame(frame);
    }, delay);
  }, [digit, delay, paint]);

  React.useEffect(() => {
    const m = motion.current;
    return () => {
      window.clearTimeout(m.timer);
      cancelAnimationFrame(m.raf);
      m.raf = 0;
    };
  }, []);

  return (
    <span ref={box} className="absolute inset-0 block">
      {DIGITS.map((d) => (
        <span key={d} className="ad-odo-glyph">
          {d}
        </span>
      ))}
    </span>
  );
}

const groupsIn = (digits: number) => Math.floor((digits - 1) / 3);

/** The rolling figure alone: fixed width for `places` digits, so nothing beside it ever moves. */
function Rolling({ value, places }: { value: number; places: number }) {
  const root = React.useRef<HTMLSpanElement>(null);
  const probe = React.useRef<HTMLSpanElement>(null);

  // The digit advance is the font's own; tracked in slightly, like the hero metric.
  React.useLayoutEffect(() => {
    const r = root.current;
    const p = probe.current;
    if (!r || !p) return;
    const measure = () => {
      const size = parseFloat(getComputedStyle(p).fontSize);
      if (size) r.style.setProperty("--dw", (p.getBoundingClientRect().width / size - 0.025).toFixed(4));
    };
    measure();
    let live = true;
    void document.fonts?.ready.then(() => live && measure());
    return () => {
      live = false;
    };
  }, []);

  const text = String(Math.max(0, Math.round(value)));
  const n = text.length;
  const slots = Math.max(places, n);
  const seps = groupsIn(n);
  const width = `calc((${slots} * var(--dw) + ${groupsIn(slots)} * ${SEP}) * 1em)`;

  return (
    <span ref={root} aria-hidden className="ad-odo relative block h-[1.12em] overflow-clip leading-[1.12]" style={{ width }}>
      {/* In flow on purpose: it also gives the box a text baseline for the unit to sit on. */}
      <span ref={probe} className="invisible inline-block tracking-normal">
        0
      </span>
      {Array.from({ length: slots }, (_, place) => {
        const on = place < n;
        return (
          <span
            key={place}
            data-on={on}
            className="ad-odo-cell"
            style={{ width: "calc(var(--dw) * 1em)", ["--i" as string]: n - 1 - place, ["--s" as string]: on ? seps - Math.floor(place / 3) : 0 }}
          >
            <Wheel digit={on ? Number(text[n - 1 - place]) : 0} delay={place * STAGGER} />
          </span>
        );
      })}
      {Array.from({ length: groupsIn(slots) }, (_, k) => {
        const group = k + 1;
        return (
          <span
            key={`sep-${group}`}
            data-on={n > group * 3}
            className="ad-odo-cell"
            style={{ width: `${SEP}em`, ["--i" as string]: n - group * 3, ["--s" as string]: seps - group }}
          >
            .
          </span>
        );
      })}
    </span>
  );
}

const shortAmount = (n: number) => {
  const a = Math.abs(n);
  const sign = n < 0 ? "−" : "+";
  if (a >= 1e6) return `${sign}${formatNumber(a / 1e6, { maximumFractionDigits: 2 })}\u00a0jt`;
  if (a >= 1e3) return `${sign}${formatNumber(a / 1e3, { maximumFractionDigits: 1 })}\u00a0rb`;
  return `${sign}${formatNumber(a)}`;
};

export interface OdometerTotalProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "defaultValue"> {
  label?: React.ReactNode;
  /** Shown small before the number. */
  unit?: string;
  /** Controlled value; leave out to let the card keep its own. */
  value?: number;
  defaultValue?: number;
  /** The largest value it should hold without growing. Defaults to one digit more than the starting value. */
  fitTo?: number;
  /** The amounts the quick buttons add; a negative one takes off (a refund). Empty hides the row. */
  steps?: number[];
  onValueChange?: (value: number) => void;
}

/**
 * A total on an odometer: each digit spins the short way to its new value, and when the number gains a digit the
 * separators slide over inside a box that never changes width.
 */
export function OdometerTotal({ label = "Sales today", unit = "Rp", value, defaultValue = 48240000, fitTo, steps = [89000, 1250000, 12500000, -245000], onValueChange, className, ...props }: OdometerTotalProps) {
  const [inner, setInner] = React.useState(defaultValue);
  const shown = value ?? inner;
  const [start] = React.useState(shown);
  const places = String(Math.max(fitTo ?? start * 10, shown, 1)).length;
  const em = places * 0.6 + groupsIn(places) * SEP + (unit ? unit.length * 0.22 + 0.2 : 0);

  const set = (next: number) => {
    const v = Math.max(0, next);
    if (value === undefined) setInner(v);
    onValueChange?.(v);
  };

  return (
    <Card className={cn("grid min-w-0 gap-4", className)} {...props}>
      <style href="ad-odometer-total" precedence="default">
        {CSS}
      </style>
      <div className="@container grid min-w-0 gap-1">
        <span className="truncate text-body text-ink-muted">{label}</span>
        <div className="flex items-baseline font-semibold tracking-[-0.035em] text-ink tabular-nums" style={{ fontSize: `min(60px, calc(100cqi / ${em.toFixed(2)}))` }}>
          {unit ? <span className="mr-[0.22em] align-[0.7em] text-[length:0.34em] font-medium tracking-normal text-ink-muted">{unit}</span> : null}
          <Rolling value={shown} places={places} />
          <span className="sr-only" aria-live="polite">
            {unit === "Rp" ? formatRp(shown) : `${unit} ${formatNumber(shown)}`}
          </span>
        </div>
      </div>
      {steps.length ? (
        <div className="flex items-center gap-gap">
          <div className="flex min-w-0 flex-1 flex-wrap gap-gap">
            {steps.map((s) => (
              <Button key={s} size="sm" className="tabular-nums" aria-label={`${s < 0 ? "Take off" : "Add"} ${formatRp(Math.abs(s))}`} onClick={() => set(shown + s)}>
                {shortAmount(s)}
              </Button>
            ))}
          </div>
          <Tooltip content="Reset">
            <Button
              size="sm"
              variant="ghost"
              icon
              aria-label="Reset"
              onClick={() => set(start)}
              className={cn("text-ink-muted transition-[opacity,scale] duration-[160ms]", shown === start && "pointer-events-none opacity-0")}
              tabIndex={shown === start ? -1 : undefined}
            >
              <RotateCcw strokeWidth={1.75} />
            </Button>
          </Tooltip>
        </div>
      ) : null}
    </Card>
  );
}
