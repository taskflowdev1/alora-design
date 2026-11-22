import * as React from "react";
import { RotateCcw } from "react-feather";
import { cn, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

/** The drum every flap turns through, always forward, the way a real board does. */
const DRUM = " 0123456789";
/** One flap falling: the top leaf, then the bottom leaf. */
const LEAF_MS = 34;
/** Each cell starts a beat after the one to its right. */
const CELL_STAGGER = 26;
const ROW_STAGGER = 70;

/*
 * Each cell is four halves. The two static halves hold the next character on top and the current one below; the two
 * leaves fall between them. Top and bottom are different greys, so the hinge is a change of tone rather than a line.
 */
const CSS = `
.ad-flap { position: relative; display: block; width: 0.82em; height: 1.26em; perspective: 3.4em; flex: none; }
.ad-flap-half { position: absolute; left: 0; right: 0; height: 50%; overflow: hidden; backface-visibility: hidden; }
.ad-flap-half > span { position: absolute; left: 0; right: 0; height: 200%; line-height: 1.26em; text-align: center; }
.ad-flap-top { top: 0; background: var(--ad-fill-strong); border-radius: var(--ad-radius-small) var(--ad-radius-small) 0 0; transform-origin: 50% 100%; }
.ad-flap-top > span { top: 0; }
.ad-flap-bottom { bottom: 0; background: var(--flap-low, var(--ad-fill)); border-radius: 0 0 var(--ad-radius-small) var(--ad-radius-small); transform-origin: 50% 0; }
.ad-flap-bottom > span { top: -100%; }
.ad-flap-leaf { visibility: hidden; }`;

const steps = (from: string, to: string) => {
  const a = Math.max(0, DRUM.indexOf(from));
  const b = Math.max(0, DRUM.indexOf(to));
  const out: string[] = [];
  for (let i = a; i !== b; i = (i + 1) % DRUM.length) out.push(DRUM[(i + 1) % DRUM.length]);
  return out;
};

function Flap({ char, delay }: { char: string; delay: number }) {
  const top = React.useRef<HTMLSpanElement>(null);
  const bottom = React.useRef<HTMLSpanElement>(null);
  const leafTop = React.useRef<HTMLSpanElement>(null);
  const leafBottom = React.useRef<HTMLSpanElement>(null);
  const state = React.useRef({ cur: char, run: 0 });
  // After the first paint the text belongs to the animation: a React update would show the end value at once.
  const [first] = React.useState(char);

  React.useEffect(() => {
    const s = state.current;
    const runId = ++s.run;
    const lt = leafTop.current;
    const lb = leafBottom.current;
    const write = (el: HTMLSpanElement | null, c: string) => {
      const inner = el?.firstElementChild;
      if (inner) inner.textContent = c === " " ? "\u00a0" : c;
    };
    const settle = (c: string) => {
      s.cur = c;
      write(top.current, c);
      write(bottom.current, c);
      if (lt) lt.style.visibility = "hidden";
      if (lb) lb.style.visibility = "hidden";
    };
    if (s.cur === char) return;
    if (prefersReducedMotion()) {
      settle(char);
      return;
    }
    const seq = steps(s.cur, char);
    let timer = 0;
    const flipTo = async (i: number) => {
      if (runId !== s.run) return;
      const next = seq[i];
      if (!next || !lt || !lb) return;
      write(top.current, next);
      write(bottom.current, s.cur);
      write(lt, s.cur);
      write(lb, next);
      lb.style.visibility = "hidden";
      lt.style.visibility = "visible";
      try {
        await lt.animate([{ transform: "rotateX(0deg)", filter: "brightness(1)" }, { transform: "rotateX(-90deg)", filter: "brightness(0.82)" }], { duration: LEAF_MS, easing: "cubic-bezier(0.55, 0, 1, 0.6)" }).finished;
        if (runId !== s.run) return;
        lt.style.visibility = "hidden";
        lb.style.visibility = "visible";
        await lb.animate([{ transform: "rotateX(90deg)", filter: "brightness(1.12)" }, { transform: "rotateX(0deg)", filter: "brightness(1)" }], { duration: LEAF_MS, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" }).finished;
      } catch {
        return; // cancelled by unmount
      }
      if (runId !== s.run) return;
      settle(next);
      if (i + 1 < seq.length) void flipTo(i + 1);
    };
    timer = window.setTimeout(() => void flipTo(0), delay);
    return () => {
      window.clearTimeout(timer);
      // A retarget carries on from whichever character is showing now.
      s.run++;
      lt?.getAnimations().forEach((a) => a.cancel());
      lb?.getAnimations().forEach((a) => a.cancel());
      settle(s.cur);
    };
  }, [char, delay]);

  const glyph = first === " " ? "\u00a0" : first;
  return (
    <span className="ad-flap">
      <span ref={top} className="ad-flap-half ad-flap-top">
        <span>{glyph}</span>
      </span>
      <span ref={bottom} className="ad-flap-half ad-flap-bottom">
        <span>{glyph}</span>
      </span>
      <span ref={leafTop} className="ad-flap-half ad-flap-top ad-flap-leaf">
        <span>{glyph}</span>
      </span>
      <span ref={leafBottom} className="ad-flap-half ad-flap-bottom ad-flap-leaf">
        <span>{glyph}</span>
      </span>
    </span>
  );
}

export interface SplitFlapRow {
  id: string;
  label: string;
  value: number;
  /** How much one press adds, at most. */
  step?: number;
}

const DEFAULT_ROWS: SplitFlapRow[] = [
  { id: "orders", label: "Orders", value: 312, step: 24 },
  { id: "packed", label: "Packed", value: 287, step: 19 },
  { id: "shipped", label: "Shipped", value: 264, step: 17 },
];

/** A small, repeatable walk, so the demo always moves and never needs Math.random. */
const nudge = (step: number, seed: number) => 1 + ((seed * 7 + 3) % Math.max(1, step));

export interface SplitFlapBoardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  rows?: SplitFlapRow[];
  /** Cells per row. */
  cells?: number;
  /** Label of the button that moves every row. */
  actionLabel?: string;
  onValuesChange?: (values: Record<string, number>) => void;
}

/**
 * A station board for KPIs: a number that changes clatters through its flaps to the new value, cell by cell. Press a
 * row to bump it, or the button to move them all.
 */
export function SplitFlapBoard({ rows = DEFAULT_ROWS, cells = 5, actionLabel = "Next hour", onValuesChange, className, ...props }: SplitFlapBoardProps) {
  const initial = React.useMemo(() => Object.fromEntries(rows.map((r) => [r.id, r.value])), [rows]);
  const [values, setValues] = React.useState(initial);
  const seed = React.useRef(1);
  const dirty = rows.some((r) => values[r.id] !== initial[r.id]);
  const limit = 10 ** cells - 1;

  const update = (next: Record<string, number>) => {
    setValues(next);
    onValuesChange?.(next);
  };
  const bump = (ids: string[]) => {
    const next = { ...values };
    for (const r of rows) {
      if (!ids.includes(r.id)) continue;
      seed.current += 1;
      next[r.id] = Math.min(limit, (next[r.id] ?? 0) + nudge(r.step ?? 10, seed.current));
    }
    update(next);
  };

  return (
    <div className={cn("@container grid min-w-0 gap-3 rounded-card bg-surface p-pad shadow-card", className)} {...props}>
      <style href="ad-split-flap-board" precedence="default">
        {CSS}
      </style>
      <div className="grid gap-1">
        {rows.map((r, rowIndex) => {
          const text = String(values[r.id] ?? 0).padStart(cells, " ").slice(-cells);
          return (
            <button
              key={r.id}
              type="button"
              aria-label={`${r.label}: ${values[r.id] ?? 0}. Add some`}
              onClick={() => bump([r.id])}
              className="ad-press -mx-1.5 flex cursor-pointer select-none items-center justify-between gap-3 rounded-control px-1.5 py-1.5 text-left hover:bg-fill hover:[--flap-low:var(--ad-surface)] focus-visible:bg-fill focus-visible:[--flap-low:var(--ad-surface)] active:scale-[0.99]"
            >
              <span className="min-w-0 truncate text-title font-medium text-ink-muted">{r.label}</span>
              <span aria-hidden className="flex shrink-0 gap-[0.09em] font-semibold text-ink tabular-nums" style={{ fontSize: "min(38px, 10.5cqi)" }}>
                {/* A cell is its position on the board: it never moves, only its character turns. */}
                {[...text].map((c, slot) => (
                  <Flap key={slot} char={c} delay={rowIndex * ROW_STAGGER + (cells - 1 - slot) * CELL_STAGGER} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-gap">
        <span />
        <Button variant="primary" onClick={() => bump(rows.map((r) => r.id))}>
          {actionLabel}
        </Button>
        <span className="flex justify-end">
          <Tooltip content="Reset">
            <Button
              size="sm"
              variant="ghost"
              icon
              aria-label="Reset"
              onClick={() => update(initial)}
              tabIndex={dirty ? undefined : -1}
              className={cn("text-ink-muted transition-[opacity,scale] duration-[160ms]", !dirty && "pointer-events-none opacity-0")}
            >
              <RotateCcw strokeWidth={1.75} />
            </Button>
          </Tooltip>
        </span>
      </div>
    </div>
  );
}
