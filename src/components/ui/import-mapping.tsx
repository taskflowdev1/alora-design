import * as React from "react";
import { FileText } from "react-feather";
import { cn, formatNumber, prefersReducedMotion } from "@/lib/ad";
import { Card } from "@/components/ui/card";
import { RollingNumber } from "@/components/ui/number-dial";
import { Select } from "@/components/ui/select";

export interface MapColumn {
  id: string;
  /** The header in the uploaded sheet. */
  name: string;
  /** A value from its first row, so a match can be judged at a glance. */
  sample: string;
  /** The field auto-match pairs it with; leave out for a column it can't place. */
  guess?: string;
}

export interface MapField {
  id: string;
  label: string;
  /** Import stays closed until a column feeds this field. */
  required?: boolean;
}

export interface ImportMappingProps {
  fileName?: string;
  /** Rows in the sheet. */
  rowCount: number;
  columns: MapColumn[];
  fields: MapField[];
  /** What is being imported, plural: "products". */
  noun?: string;
  /**
   * Runs the import and reports rows done through `report`. Leave out for a simulated run. A rejection returns the
   * piece to its mapped state so it can be tried again.
   */
  onImport?: (mapping: Record<string, string>, report: (rows: number) => void) => Promise<void>;
  /** Fires once the import has landed, and with false if it is reset by a new key. */
  onDoneChange?: (done: boolean) => void;
  className?: string;
}

const SKIP = "skip";
const STEP = 300;

type Phase = "idle" | "matching" | "ready" | "importing" | "done";

const CSS = `
@keyframes ad-imp-in { from { opacity: 0; transform: translateY(0.5em); filter: blur(2px); } }
.ad-imp-in { animation: ad-imp-in 260ms var(--ad-ease); }
.ad-imp-arrow path { stroke-dasharray: 1 1; stroke-dashoffset: 1; opacity: 0; transition: stroke-dashoffset 300ms var(--ad-ease), opacity 120ms var(--ad-ease); }
.ad-imp-arrow[data-on="true"] path { stroke-dashoffset: 0; opacity: 1; }
.ad-imp-arrow[data-on="true"] path + path { transition-delay: 170ms; }
.ad-imp-dot { transition: opacity 160ms var(--ad-ease), scale 160ms var(--ad-ease); }
.ad-imp-arrow[data-on="true"] + .ad-imp-dot { opacity: 0; scale: 0.4; }
@media (prefers-reduced-motion: reduce) {
  .ad-imp-in { animation: none; }
  .ad-imp-arrow path, .ad-imp-dot { transition: none; }
}`;

/** The pairing mark: a resting dot, and an arrow that draws itself when the column gets a field. */
function Pairing({ on }: { on: boolean }) {
  return (
    <span aria-hidden className="relative grid size-[20px] place-items-center text-ink-muted">
      <svg data-on={on} className="ad-imp-arrow absolute inset-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path pathLength={1} d="M4 12h16" />
        <path pathLength={1} d="m14 6 6 6-6 6" />
      </svg>
      <span className="ad-imp-dot size-1 rounded-full bg-fill-strong" />
    </span>
  );
}

/**
 * Column mapping for a spreadsheet import. Auto-match draws each pairing in turn, a wrong one is changed with its
 * select (a field feeds from one column, so taking it frees the other), and a column nobody wants just stays out.
 * Import runs its progress inside the button and lands as the result in the same place.
 */
export function ImportMapping({ fileName = "produk.csv", rowCount, columns, fields, noun = "products", onImport, onDoneChange, className }: ImportMappingProps) {
  const [mapping, setMapping] = React.useState<Record<string, string>>({});
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [done, setDone] = React.useState(0);
  const timers = React.useRef<number[]>([]);
  const alive = React.useRef(true);
  React.useEffect(() => {
    alive.current = true;
    const live = timers;
    return () => {
      alive.current = false;
      live.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const used = new Set(Object.values(mapping).filter((v) => v !== SKIP));
  const missing = fields.find((f) => f.required && !used.has(f.id));
  const locked = phase === "matching" || phase === "importing" || phase === "done";
  const options = [...fields.map((f) => ({ value: f.id, label: f.label })), { value: SKIP, label: "Don't import" }];

  const assign = (column: string, field: string) =>
    setMapping((m) => {
      const next = { ...m };
      if (field !== SKIP) for (const k of Object.keys(next)) if (next[k] === field) next[k] = SKIP;
      next[column] = field;
      return next;
    });

  const autoMatch = () => {
    const guessed = columns.filter((c) => c.guess);
    if (prefersReducedMotion()) {
      setMapping(Object.fromEntries(guessed.map((c) => [c.id, c.guess as string])));
      setPhase("ready");
      return;
    }
    setPhase("matching");
    guessed.forEach((c, i) => later(() => assign(c.id, c.guess as string), 120 + i * STEP));
    later(() => setPhase("ready"), 120 + guessed.length * STEP + 120);
  };

  const land = () => {
    setDone(rowCount);
    setPhase("done");
    onDoneChange?.(true);
  };

  const simulate = () => {
    if (prefersReducedMotion()) return land();
    // Imports commit in batches, so the count moves in steps that are slow enough to read.
    const batches = 9;
    for (let b = 1; b <= batches; b++) {
      const rows = b === batches ? rowCount : Math.round((rowCount * b) / batches + (b % 2 ? 3 : -2));
      later(() => setDone(rows), b * 240);
    }
    later(land, batches * 240 + 340);
  };

  const start = () => {
    setDone(0);
    setPhase("importing");
    if (!onImport) return simulate();
    onImport(mapping, (rows) => alive.current && setDone(Math.min(rowCount, rows))).then(
      () => alive.current && land(),
      () => alive.current && setPhase("ready"),
    );
  };

  const action = phase === "idle" ? autoMatch : phase === "ready" && !missing ? start : undefined;
  const pct = phase === "done" ? 100 : (done / Math.max(1, rowCount)) * 100;
  const running = phase === "importing";
  const filled = phase === "idle" || (phase === "ready" && !missing);

  const label =
    phase === "idle" ? (
      "Auto-match columns"
    ) : phase === "matching" ? (
      "Matching columns"
    ) : phase === "ready" ? (
      missing ? (
        `Map ${missing.label}`
      ) : (
        `Import ${formatNumber(rowCount)} ${noun}`
      )
    ) : phase === "importing" ? (
      <span className="inline-flex items-baseline gap-[0.3em] tabular-nums">
        Importing <RollingNumber value={done} /> of {formatNumber(rowCount)}
      </span>
    ) : (
      <span className="inline-flex items-center gap-2">
        {/* The one green mark. */}
        <span className="size-1.5 shrink-0 rounded-full bg-success" />
        {formatNumber(rowCount)} {noun} imported
      </span>
    );
  const labelKey = phase === "ready" ? `ready-${missing?.id ?? "go"}` : phase;

  return (
    <Card className={cn("grid min-w-0 gap-3", className)}>
      <style href="ad-import-mapping" precedence="default">
        {CSS}
      </style>
      <div className="flex min-w-0 items-center gap-2 text-body">
        <FileText size={16} className="shrink-0 text-ink-muted" />
        <span className="min-w-0 flex-1 truncate font-medium text-ink">{fileName}</span>
        <span className="shrink-0 tabular-nums text-ink-muted">{formatNumber(rowCount)} rows</span>
      </div>
      <div className="grid min-w-0 gap-1">
        {columns.map((c) => {
          const value = mapping[c.id] ?? SKIP;
          const paired = value !== SKIP;
          return (
            <div key={c.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_20px_minmax(0,1.15fr)] items-center gap-2">
              <span className="grid min-w-0 rounded-item bg-fill px-2.5 py-1">
                <span className="truncate text-body font-medium text-ink">{c.name}</span>
                <span className="truncate text-small tabular-nums text-ink-muted">{c.sample}</span>
              </span>
              <Pairing on={paired} />
              <Select
                aria-label={`Field for ${c.name}`}
                value={value}
                options={options}
                disabled={locked}
                onValueChange={(v) => assign(c.id, v)}
                className="w-full disabled:opacity-100"
                renderValue={(o) => (
                  <span key={value} className={cn("ad-imp-in min-w-0 truncate", !paired && "text-ink-muted")}>
                    {o?.label ?? "Don't import"}
                  </span>
                )}
              />
            </div>
          );
        })}
      </div>
      {/* One button through every state: its fill is the progress, and the result lands where the action was. */}
      <button
        type="button"
        disabled={!action}
        aria-live="polite"
        onClick={action}
        className={cn(
          "relative isolate h-control w-full select-none overflow-hidden rounded-control text-body font-medium transition-[background-color,color,scale] duration-[220ms] ease-ad",
          filled ? "cursor-pointer bg-brand text-brand-ink hover:bg-brand-hover focus-visible:bg-brand-hover active:scale-[0.985]" : "bg-fill text-ink",
          !action && !running && phase !== "done" && "text-ink-muted",
        )}
      >
        {running || phase === "done" ? (
          <span
            aria-hidden
            className={cn("absolute inset-0 -z-10 origin-left bg-fill-strong transition-[transform,opacity] duration-[260ms] ease-ad", phase === "done" && "opacity-0 delay-[200ms]")}
            style={{ transform: `scaleX(${pct / 100})` }}
          />
        ) : null}
        <span key={labelKey} className="ad-imp-in inline-flex items-center justify-center">
          {label}
        </span>
      </button>
    </Card>
  );
}
