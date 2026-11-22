import * as React from "react";
import { cn, formatRp, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";

export interface InvoiceLine {
  id: string;
  name: string;
  qty: number;
  amount: number;
}

export interface InvoiceValues {
  vendor: string;
  number: string;
  date: string;
  total: string;
}

type FieldId = keyof InvoiceValues;

const FIELD_LABELS: { id: FieldId; label: string }[] = [
  { id: "vendor", label: "Vendor" },
  { id: "number", label: "Invoice" },
  { id: "date", label: "Date" },
  { id: "total", label: "Total" },
];

const VALUES: InvoiceValues = { vendor: "CV Tanah Liat Sejahtera", number: "INV/2026/0418", date: "12 Nov 2026", total: formatRp(4218000) };

const LINES: InvoiceLine[] = [
  { id: "gelas", name: "Gelas kopi tanah liat", qty: 24, amount: 2136000 },
  { id: "piring", name: "Piring saji terracotta", qty: 8, amount: 1160000 },
  { id: "teko", name: "Teko seduh 600 ml", qty: 2, amount: 504000 },
  { id: "ongkir", name: "Ongkos kirim", qty: 1, amount: 418000 },
];

const SCAN_MS = 1700;
const KEY_STEP = 0.04;
const FLIGHT_MS = 460;

/*
 * The paper and its negative are the same layout; the negative is masked to a band that trails the beam, moved by one
 * variable (--y). The paper, its ink and the negative's colours are the drawn object, outside the grey ramp (grey-ok).
 */
const CSS = `
.ad-ix { --y: 0px; }
.ad-ix-paper {
  /* grey-ok: paper stock and printed ink, the same in both themes */
  --ix-paper: oklch(0.975 0.009 85); --ix-ink: oklch(0.27 0.012 70); --ix-soft: oklch(0.52 0.012 70); --ix-slot: oklch(0.925 0.012 85);
  background: var(--ix-paper); color: var(--ix-ink);
}
.ad-ix-neg {
  /* grey-ok: the x-ray negative, a deep tint of the accent with pale ink */
  --ix-paper: var(--ad-brand-9); --ix-ink: var(--ad-brand-2); --ix-soft: var(--ad-brand-4); --ix-slot: var(--ad-brand-8);
  background: var(--ix-paper); color: var(--ix-ink); pointer-events: none; opacity: 0; transition: opacity 220ms var(--ad-ease);
  mask-image: linear-gradient(to bottom, transparent calc(var(--y) - 58px), #000 calc(var(--y) - 16px), #000 var(--y), transparent calc(var(--y) + 1px));
}
.ad-ix[data-beam="true"] .ad-ix-neg { opacity: 1; }
.ad-ix-soft { color: var(--ix-soft); }
.ad-ix-field { background: transparent; transition: background-color 180ms var(--ad-ease), color 180ms var(--ad-ease); }
.ad-ix-paper:not(.ad-ix-neg) .ad-ix-field[data-lifted="true"] { background: var(--ix-slot); color: transparent; }
.ad-ix-paper:not(.ad-ix-neg) .ad-ix-field[data-hot="true"] { background: var(--ix-slot); }
.ad-ix-neg .ad-ix-field { color: var(--ad-brand-1); font-weight: 600; }
.ad-ix-beam { transform: translateY(var(--y)); opacity: 0; transition: opacity 220ms var(--ad-ease); }
.ad-ix[data-beam="true"] .ad-ix-beam { opacity: 1; }
.ad-ix-glow {
  /* grey-ok: light from the beam, trailing up the page */
  background: linear-gradient(to top, color-mix(in oklab, var(--ad-brand-3) 42%, transparent), transparent);
}
.ad-ix-line {
  /* grey-ok: the beam itself, white-hot in the middle */
  background: linear-gradient(to right, transparent, var(--ad-brand-2) 12%, oklch(0.99 0.01 260) 50%, var(--ad-brand-2) 88%, transparent);
}
.ad-ix-grip { transform: translateY(calc(var(--y) - 50%)); touch-action: none; }
.ad-ix-chip-text { opacity: 0; transition: opacity 180ms var(--ad-ease); }
.ad-ix-chip[data-in="true"] .ad-ix-chip-text { opacity: 1; }
.ad-ix-chip-bar { transition: opacity 160ms var(--ad-ease); }
.ad-ix-chip[data-in="true"] .ad-ix-chip-bar { opacity: 0; }`;

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function PaperFace({
  values,
  lines,
  shop,
  negative,
  lifted,
  hot,
  fieldRef,
}: {
  values: InvoiceValues;
  lines: InvoiceLine[];
  shop: string;
  negative?: boolean;
  lifted?: Record<string, boolean>;
  hot?: string | null;
  fieldRef?: (id: FieldId, el: HTMLElement | null) => void;
}) {
  const field = (id: FieldId, className?: string) => (
    <span
      ref={fieldRef ? (el) => fieldRef(id, el) : undefined}
      data-lifted={!!lifted?.[id]}
      data-hot={hot === id}
      translate="no"
      className={cn("ad-ix-field -mx-1 inline-block rounded-small px-1", className)}
    >
      {values[id]}
    </span>
  );
  return (
    <div aria-hidden={negative || undefined} className={cn("ad-ix-paper grid gap-5 p-5 text-body", negative && "ad-ix-neg absolute inset-0")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">{field("vendor", "text-balance text-title font-semibold")}</div>
        <div className="grid shrink-0 justify-items-end gap-0.5 tabular-nums">
          {field("number", "max-w-[168px] truncate")}
          {field("date", "max-w-[168px] truncate")}
        </div>
      </div>
      <p translate="no" className="ad-ix-soft">{shop}</p>
      <div className="grid gap-1.5">
        {lines.map((l) => (
          <div key={l.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-3">
            <span translate="no" className="truncate">{l.name}</span>
            <span className="ad-ix-soft w-[3ch] text-right tabular-nums">{l.qty}</span>
            <span className="w-[86px] text-right tabular-nums">{formatRp(l.amount)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="ad-ix-soft">Total</span>
        {field("total", "max-w-[70%] truncate text-heading font-semibold tabular-nums")}
      </div>
    </div>
  );
}

export interface InvoiceXrayProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "onChange"> {
  /** The fields the scan reads off the paper. They stay editable after it. */
  defaultValues?: InvoiceValues;
  /** The printed line items. */
  lines?: InvoiceLine[];
  /** Who the invoice is billed to. */
  shop?: string;
  /** Any field was edited. */
  onValuesChange?: (values: InvoiceValues) => void;
  /** The beam reached the bottom of the page. */
  onScanned?: (values: InvoiceValues) => void;
}

/**
 * A paper invoice under a beam of light. Scan runs it down the page, or drag the grip; as it passes the vendor, number,
 * date and total, each lifts off the paper into an editable chip. Bring the beam back up and they settle back.
 */
export function InvoiceXray({ defaultValues = VALUES, lines = LINES, shop = "Rimba Kemang", onValuesChange, onScanned, className, ...props }: InvoiceXrayProps) {
  const root = React.useRef<HTMLDivElement>(null);
  const paper = React.useRef<HTMLDivElement>(null);
  const fieldEls = React.useRef<Partial<Record<FieldId, HTMLElement | null>>>({});
  const chipEls = React.useRef<Partial<Record<FieldId, HTMLElement | null>>>({});
  const flights = React.useRef(new Map<FieldId, () => void>());
  const thresholds = React.useRef<Partial<Record<FieldId, number>>>({});
  const pos = React.useRef(0);
  const raf = React.useRef(0);
  const liftedRef = React.useRef<Record<string, boolean>>({});
  const valuesRef = React.useRef(defaultValues);
  const scanned = React.useRef(onScanned);
  scanned.current = onScanned;

  const [values, setValues] = React.useState(defaultValues);
  const [lifted, setLifted] = React.useState<Record<string, boolean>>({});
  const [landed, setLanded] = React.useState<Record<string, boolean>>({});
  const [phase, setPhase] = React.useState<"idle" | "scanning" | "rewinding" | "done">("idle");
  const [dragging, setDragging] = React.useState(false);
  const [hot, setHot] = React.useState<string | null>(null);
  const [now, setNow] = React.useState(0);
  valuesRef.current = values;
  const phaseRef = React.useRef(phase);
  phaseRef.current = phase;

  const measure = React.useCallback(() => {
    const p = paper.current;
    if (!p) return;
    const r = p.getBoundingClientRect();
    for (const { id } of FIELD_LABELS) {
      const el = fieldEls.current[id];
      if (!el) continue;
      const f = el.getBoundingClientRect();
      thresholds.current[id] = (f.top + f.height / 2 - r.top) / r.height;
    }
  }, []);

  const flyChip = React.useCallback((id: FieldId, up: boolean) => {
    flights.current.get(id)?.();
    flights.current.delete(id);
    const host = root.current;
    const fieldEl = fieldEls.current[id];
    const chipEl = chipEls.current[id];
    if (!host || !fieldEl || !chipEl || prefersReducedMotion()) {
      setLanded((l) => ({ ...l, [id]: up }));
      return;
    }
    if (!up) setLanded((l) => ({ ...l, [id]: false }));
    const box = host.getBoundingClientRect();
    const a = (up ? fieldEl : chipEl).getBoundingClientRect();
    const b = (up ? chipEl : fieldEl).getBoundingClientRect();
    const clone = document.createElement("span");
    clone.setAttribute("aria-hidden", "true");
    clone.textContent = valuesRef.current[id];
    clone.className = "absolute left-0 top-0 z-20 origin-top-left truncate rounded-small bg-surface px-1.5 py-0.5 text-body font-medium tabular-nums text-ink shadow-raised";
    clone.style.maxWidth = "240px";
    host.append(clone);
    const x0 = a.left - box.left;
    const y0 = a.top - box.top;
    const x1 = b.left - box.left;
    const y1 = b.top - box.top;
    const frames: Keyframe[] = [];
    for (let i = 0; i <= 22; i++) {
      const t = i / 22;
      const e = 1 - Math.pow(1 - t, 3);
      const arc = Math.sin(Math.PI * e);
      frames.push({ offset: t, transform: `translate(${(x0 + (x1 - x0) * e).toFixed(2)}px, ${(y0 + (y1 - y0) * e - 14 * arc).toFixed(2)}px) scale(${(1 + 0.05 * arc).toFixed(3)})` });
    }
    const an = clone.animate(frames, { duration: FLIGHT_MS, easing: "linear", fill: "both" });
    const fade = () => {
      flights.current.delete(id);
      if (up) setLanded((l) => ({ ...l, [id]: true }));
      clone.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 110, easing: "ease-out", fill: "both" }).onfinish = () => clone.remove();
    };
    an.onfinish = fade;
    flights.current.set(id, () => {
      an.onfinish = null;
      an.cancel();
      clone.remove();
    });
  }, []);

  const place = React.useCallback((p: number) => {
    const el = root.current;
    const h = paper.current?.offsetHeight ?? 0;
    pos.current = p;
    el?.style.setProperty("--y", `${(p * h).toFixed(2)}px`);
    let changed = false;
    const next = { ...liftedRef.current };
    for (const { id } of FIELD_LABELS) {
      const at = thresholds.current[id];
      if (at === undefined) continue;
      const on = !!next[id];
      if (!on && p >= at + 0.008) {
        next[id] = true;
        changed = true;
        flyChip(id, true);
      } else if (on && p <= at - 0.008) {
        next[id] = false;
        changed = true;
        flyChip(id, false);
      }
    }
    if (changed) {
      liftedRef.current = next;
      setLifted(next);
    }
  }, [flyChip]);

  const stop = React.useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
  }, []);

  const travel = React.useCallback((to: number, then: () => void) => {
    stop();
    measure();
    if (prefersReducedMotion()) {
      place(to);
      then();
      return;
    }
    const from = pos.current;
    const ms = Math.max(280, SCAN_MS * Math.abs(to - from));
    const start = performance.now();
    const frame = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      place(from + (to - from) * easeInOut(k));
      if (k < 1) raf.current = requestAnimationFrame(frame);
      else {
        raf.current = 0;
        then();
      }
    };
    raf.current = requestAnimationFrame(frame);
  }, [measure, place, stop]);

  React.useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(() => {
      measure();
      place(pos.current);
    });
    if (paper.current) ro.observe(paper.current);
    return () => ro.disconnect();
  }, [measure, place]);

  // Off screen the beam finishes where it was going at once, so no frame loop runs unseen.
  React.useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting || !raf.current) return;
      stop();
      const end = phaseRef.current === "scanning" ? 1 : 0;
      place(end);
      setNow(end * 100);
      setPhase(end ? "done" : "idle");
    });
    io.observe(el);
    return () => io.disconnect();
  }, [place, stop]);

  React.useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      for (const end of flights.current.values()) end();
    },
    [],
  );

  const scan = () => {
    setPhase("scanning");
    travel(1, () => {
      setNow(100);
      setPhase("done");
      scanned.current?.(valuesRef.current);
    });
  };
  const rewind = () => {
    setPhase("rewinding");
    travel(0, () => {
      setNow(0);
      setPhase("idle");
    });
  };

  const fromPointer = (e: React.PointerEvent) => {
    const r = paper.current?.getBoundingClientRect();
    if (!r) return;
    const p = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    place(p);
    setNow(Math.round(p * 100));
  };

  const keyboard = (e: React.KeyboardEvent) => {
    const to = { ArrowDown: pos.current + KEY_STEP, ArrowRight: pos.current + KEY_STEP, ArrowUp: pos.current - KEY_STEP, ArrowLeft: pos.current - KEY_STEP, Home: 0, End: 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    stop();
    measure();
    const p = Math.max(0, Math.min(1, to));
    place(p);
    setNow(Math.round(p * 100));
    setPhase(p >= 1 ? "done" : "idle");
  };

  const edit = (id: FieldId, value: string) => {
    const next = { ...valuesRef.current, [id]: value };
    setValues(next);
    onValuesChange?.(next);
  };

  const beam = phase === "scanning" || phase === "rewinding" || dragging || (now > 0 && now < 100 && phase !== "done");
  const settled = phase === "done" || phase === "rewinding";
  const label = phase === "scanning" ? 1 : settled ? 2 : 0;

  return (
    <div ref={root} data-beam={beam} className={cn("ad-ix relative grid w-full grid-cols-1 items-start gap-pad md:grid-cols-[minmax(0,1fr)_216px]", className)} {...props}>
      <style href="ad-invoice-xray" precedence="default">
        {CSS}
      </style>

      <div className="relative min-w-0">
        <div ref={paper} className="relative overflow-hidden rounded-card shadow-raised">
          <PaperFace
            values={values}
            lines={lines}
            shop={shop}
            lifted={lifted}
            hot={hot}
            fieldRef={(id, el) => {
              fieldEls.current[id] = el;
            }}
          />
          <PaperFace values={values} lines={lines} shop={shop} negative />
        </div>
        <div aria-hidden className="ad-ix-beam pointer-events-none absolute inset-x-0 top-0">
          <div className="ad-ix-glow absolute inset-x-0 bottom-0 h-[72px]" />
          <div className="ad-ix-line absolute -inset-x-1.5 -top-px h-[2px]" />
        </div>
        <div
          role="slider"
          tabIndex={0}
          aria-label="Scan position"
          aria-orientation="vertical"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={now}
          onKeyDown={keyboard}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            stop();
            measure();
            setDragging(true);
            setPhase("idle");
            fromPointer(e);
          }}
          onPointerMove={(e) => {
            if (dragging) fromPointer(e);
          }}
          onPointerUp={() => {
            setDragging(false);
            if (pos.current >= 0.995) setPhase("done");
          }}
          onPointerCancel={() => setDragging(false)}
          className="ad-ix-grip group absolute -right-2 top-0 z-10 flex h-9 w-5 cursor-ns-resize items-center justify-center rounded-control bg-surface shadow-raised select-none after:absolute after:left-1/2 after:top-1/2 after:size-[44px] after:-translate-x-1/2 after:-translate-y-1/2 hover:bg-fill focus-visible:bg-fill-strong active:bg-fill-strong"
        >
          <span aria-hidden className="grid gap-[3px]">
            <span className="block h-[2px] w-2 rounded-small bg-ink-muted" />
            <span className="block h-[2px] w-2 rounded-small bg-ink-muted" />
            <span className="block h-[2px] w-2 rounded-small bg-ink-muted" />
          </span>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-gap md:grid-cols-1">
        {FIELD_LABELS.map(({ id, label }) => {
          const on = !!landed[id];
          return (
            <label
              key={id}
              data-in={on}
              onPointerEnter={() => setHot(id)}
              onPointerLeave={() => setHot(null)}
              className={cn(
                "ad-ix-chip relative grid min-w-0 gap-0.5 rounded-control px-bubble py-2 transition-[background-color] duration-150 ease-ad",
                (id === "vendor" || id === "total") && "col-span-2 md:col-span-1",
                on ? "cursor-text bg-fill hover:bg-fill-strong focus-within:bg-fill-strong" : "bg-fill",
              )}
            >
              <span className="text-small text-ink-muted">{label}</span>
              <span className="relative block min-h-[1.5em]">
                <input
                  ref={(el) => {
                    chipEls.current[id] = el;
                  }}
                  value={values[id]}
                  disabled={!on}
                  spellCheck={false}
                  autoComplete="off"
                  aria-label={label}
                  onChange={(e) => edit(id, e.target.value)}
                  onFocus={() => setHot(id)}
                  onBlur={() => setHot(null)}
                  className="ad-ix-chip-text block w-full min-w-0 bg-transparent text-[16px] font-medium tabular-nums text-ink md:text-body"
                />
                <span aria-hidden className="ad-ix-chip-bar pointer-events-none absolute left-0 top-1/2 h-2 w-2/3 -translate-y-1/2 rounded-small bg-fill-strong" />
              </span>
            </label>
          );
        })}
        <Button
          variant={settled ? "secondary" : "primary"}
          disabled={phase === "scanning" || phase === "rewinding"}
          onClick={phase === "done" ? rewind : scan}
          className="col-span-2 md:col-span-1"
        >
          <span className="inline-grid">
            {["Scan invoice", "Scanning…", "Reset"].map((t, i) => (
              <span key={t} aria-hidden={i !== label} className={cn("col-start-1 row-start-1 text-center", i !== label && "invisible")}>
                {t}
              </span>
            ))}
          </span>
        </Button>
      </div>
    </div>
  );
}
