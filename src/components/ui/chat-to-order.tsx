import * as React from "react";
import { cn, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";

export interface ChatOrderField {
  id: string;
  label: string;
  /** The clean value on the order, which may read differently from the words in the chat. */
  value: string;
  /** The one big figure, usually the total. */
  strong?: boolean;
}

/** Plain text, or the words that fill a field. */
export type ChatOrderPart = string | { field: string; text: string };

const MESSAGE: ChatOrderPart[] = [
  "Kak, mau pesan ",
  { field: "item", text: "2 gelas kopi tanah liat" },
  " ya. Kirim ke ",
  { field: "address", text: "Jl. Kemang Raya 12, Jakarta Selatan" },
  ", atas nama ",
  { field: "customer", text: "Dewi Lestari" },
  ". Bayar pakai ",
  { field: "payment", text: "QRIS" },
  ", totalnya ",
  { field: "total", text: "Rp 178.000" },
  " kan?",
];

const FIELDS: ChatOrderField[] = [
  { id: "customer", label: "Customer", value: "Dewi Lestari" },
  { id: "item", label: "Item", value: "2 × Gelas kopi tanah liat" },
  { id: "address", label: "Ship to", value: "Jl. Kemang Raya 12, Jakarta Selatan" },
  { id: "payment", label: "Payment", value: "QRIS" },
  { id: "total", label: "Total", value: "Rp 178.000", strong: true },
];

const FLIGHT_MS = 640;
const STAGGER_MS = 240;

const CSS = `
.ad-cto-word { transition: background-color 150ms var(--ad-ease), color 150ms var(--ad-ease); }
.ad-cto-word[data-out="true"] { color: var(--ad-ink-muted); }
.ad-cto-value { opacity: 0; transform: translateY(3px); filter: blur(2px); transition: opacity 200ms var(--ad-ease), transform 260ms var(--ad-ease), filter 200ms var(--ad-ease); }
.ad-cto-value[data-in="true"] { opacity: 1; transform: none; filter: none; }
.ad-cto-slot { transition: opacity 160ms var(--ad-ease); }
.ad-cto-value[data-in="true"] + .ad-cto-slot { opacity: 0; }`;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** A copy of the words travels on a shallow arc from one element to the other, turning into the clean value on the way. */
function fly(layer: HTMLElement, from: HTMLElement, to: HTMLElement, fromText: string, toText: string, onLand: () => void) {
  const box = layer.getBoundingClientRect();
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const fromCs = getComputedStyle(from);
  const scaleTo = parseFloat(getComputedStyle(to).fontSize) / parseFloat(fromCs.fontSize) || 1;

  const chip = document.createElement("span");
  chip.setAttribute("aria-hidden", "true");
  chip.className = "absolute left-0 top-0 z-10 grid origin-top-left whitespace-nowrap rounded-small bg-surface text-ink shadow-raised";
  chip.style.font = fromCs.font;
  chip.style.padding = "1px 4px";
  const before = document.createElement("span");
  const after = document.createElement("span");
  before.textContent = fromText;
  after.textContent = toText;
  for (const s of [before, after]) s.style.gridArea = "1 / 1";
  after.style.opacity = "0";
  chip.append(before, after);
  layer.append(chip);

  const x0 = a.left - box.left - 4;
  const y0 = a.top - box.top - 1;
  const x1 = b.left - box.left - 4 * scaleTo;
  const y1 = b.top - box.top - scaleTo;
  const lift = Math.min(46, 16 + Math.hypot(x1 - x0, y1 - y0) * 0.12);
  const tilt = x1 >= x0 ? -2.4 : 2.4;
  const frames: Keyframe[] = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    const e = easeInOut(t);
    const arc = Math.sin(Math.PI * e);
    frames.push({
      offset: t,
      transform: `translate(${(x0 + (x1 - x0) * e).toFixed(2)}px, ${(y0 + (y1 - y0) * e - lift * arc).toFixed(2)}px) rotate(${(tilt * arc).toFixed(2)}deg) scale(${(1 + (scaleTo - 1) * e + 0.03 * arc).toFixed(3)})`,
    });
  }
  const anims = [
    chip.animate(frames, { duration: FLIGHT_MS, easing: "linear", fill: "both" }),
    before.animate([{ opacity: 1 }, { opacity: 1, offset: 0.25 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }], { duration: FLIGHT_MS, fill: "both" }),
    after.animate([{ opacity: 0 }, { opacity: 0, offset: 0.25 }, { opacity: 1, offset: 0.5 }, { opacity: 1 }], { duration: FLIGHT_MS, fill: "both" }),
  ];
  let settled = false;
  anims[0].onfinish = () => {
    if (settled) return;
    settled = true;
    onLand();
    // The value is under the copy now: the copy lets go instead of being cut.
    const fade = chip.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: "ease-out", fill: "both" });
    fade.onfinish = () => chip.remove();
  };
  return () => {
    settled = true;
    for (const an of anims) an.cancel();
    chip.remove();
  };
}

/** The labels share one cell, so the button is as wide as its longest label in every state. */
function Labels({ items, at }: { items: string[]; at: number }) {
  return (
    <span className="inline-grid">
      {items.map((label, i) => (
        <span key={label} aria-hidden={i !== at} className={cn("col-start-1 row-start-1 text-center", i !== at && "invisible")}>
          {label}
        </span>
      ))}
    </span>
  );
}

type Stage = "home" | "away" | "placed";

export interface ChatToOrderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The message, with the words that fill each field marked. */
  message?: ChatOrderPart[];
  /** The order's fields, top to bottom. */
  fields?: ChatOrderField[];
  /** The time on the message. */
  time?: string;
  /** Every field is filled. */
  onComplete?: (values: Record<string, string>) => void;
}

/**
 * A pasted chat message and an empty order. Read message sends each marked phrase across to its field, one by one; a
 * single phrase can be sent by itself, and a filled field sent back by pressing it.
 */
export function ChatToOrder({ message = MESSAGE, fields = FIELDS, time = "10.24", onComplete, className, ...props }: ChatToOrderProps) {
  const layer = React.useRef<HTMLDivElement>(null);
  const words = React.useRef<Record<string, HTMLElement | null>>({});
  const values = React.useRef<Record<string, HTMLElement | null>>({});
  const stagesRef = React.useRef<Record<string, Stage>>({});
  const flights = React.useRef(new Map<string, () => void>());
  const timers = React.useRef<number[]>([]);
  const pending = React.useRef(0); // phrases Read message has yet to send
  const complete = React.useRef(onComplete);
  complete.current = onComplete;
  const [stages, setStages] = React.useState<Record<string, Stage>>({});
  const [running, setRunning] = React.useState(false);
  const [hot, setHot] = React.useState<string | null>(null);

  const put = React.useCallback((id: string, stage: Stage) => {
    stagesRef.current = { ...stagesRef.current, [id]: stage };
    setStages(stagesRef.current);
  }, []);

  const textOf = React.useCallback((id: string) => {
    const part = message.find((p): p is { field: string; text: string } => typeof p !== "string" && p.field === id);
    return part?.text ?? "";
  }, [message]);

  // Reading ends when nothing is queued or in the air, even if a field was sent back meanwhile.
  const settle = React.useCallback(() => {
    if (!pending.current && !flights.current.size) setRunning(false);
  }, []);

  const land = React.useCallback((id: string) => {
    flights.current.delete(id);
    put(id, "placed");
    if (fields.every((f) => stagesRef.current[f.id] === "placed")) complete.current?.(Object.fromEntries(fields.map((f) => [f.id, f.value])));
    settle();
  }, [fields, put, settle]);

  const send = React.useCallback((id: string) => {
    if ((stagesRef.current[id] ?? "home") !== "home") return;
    const field = fields.find((f) => f.id === id);
    const from = words.current[id];
    const to = values.current[id];
    if (!field || !from || !to || !layer.current || prefersReducedMotion()) {
      if (field) land(id);
      return;
    }
    put(id, "away");
    flights.current.set(id, fly(layer.current, from, to, textOf(id), field.value, () => land(id)));
  }, [fields, land, put, textOf]);

  const sendBack = (id: string) => {
    if (stagesRef.current[id] !== "placed") return;
    const field = fields.find((f) => f.id === id);
    const from = values.current[id];
    const to = words.current[id];
    if (!field || !from || !to || !layer.current || prefersReducedMotion()) {
      put(id, "home");
      return;
    }
    put(id, "away");
    flights.current.set(id, fly(layer.current, from, to, field.value, textOf(id), () => {
      flights.current.delete(id);
      put(id, "home");
      settle();
    }));
  };

  const clear = React.useCallback(() => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
    pending.current = 0;
    for (const stop of flights.current.values()) stop();
    flights.current.clear();
  }, []);
  React.useEffect(() => clear, [clear]);

  const reset = () => {
    clear();
    stagesRef.current = {};
    setStages({});
    setRunning(false);
  };

  const run = () => {
    const waiting = fields.filter((f) => (stagesRef.current[f.id] ?? "home") === "home");
    if (!waiting.length) return;
    setRunning(true);
    if (prefersReducedMotion()) {
      for (const f of waiting) send(f.id);
      return;
    }
    pending.current = waiting.length;
    waiting.forEach((f, i) => {
      timers.current.push(
        window.setTimeout(() => {
          pending.current--;
          send(f.id);
          settle();
        }, i * STAGGER_MS),
      );
    });
  };

  const done = fields.every((f) => stages[f.id] === "placed");
  const label = running ? 1 : done ? 2 : 0;

  return (
    <div ref={layer} className={cn("relative grid w-full grid-cols-1 items-start gap-pad md:grid-cols-2", className)} {...props}>
      <style href="ad-chat-to-order" precedence="default">
        {CSS}
      </style>

      <div className="grid min-w-0 justify-items-start gap-gap">
        <div className="min-w-0 rounded-card bg-fill px-pad py-3">
          <p className="text-pretty text-title leading-[1.65] text-ink">
            {message.map((part, i) =>
              typeof part === "string" ? (
                <React.Fragment key={`${i}:${part}`}>{part}</React.Fragment>
              ) : (
                <button
                  key={part.field}
                  ref={(el) => {
                    words.current[part.field] = el;
                  }}
                  type="button"
                  data-out={(stages[part.field] ?? "home") !== "home"}
                  disabled={(stages[part.field] ?? "home") !== "home"}
                  aria-label={`Send ${part.text} to the order`}
                  onClick={() => send(part.field)}
                  onPointerEnter={() => setHot(part.field)}
                  onPointerLeave={() => setHot(null)}
                  onFocus={() => setHot(part.field)}
                  onBlur={() => setHot(null)}
                  className={cn(
                    "ad-cto-word -mx-1 inline max-w-full cursor-pointer select-none rounded-small px-1 text-left [font:inherit] disabled:cursor-default",
                    hot === part.field && (stages[part.field] ?? "home") === "home" ? "bg-fill-strong" : "focus-visible:bg-fill-strong",
                  )}
                >
                  {part.text}
                </button>
              ),
            )}
          </p>
          <p className="mt-1 text-right text-small tabular-nums text-ink-muted">{time}</p>
        </div>
        <Button variant={done ? "secondary" : "primary"} disabled={running} onClick={done ? reset : run}>
          <Labels items={["Read message", "Reading…", "Start over"]} at={label} />
        </Button>
      </div>

      <div className="grid min-w-0 gap-0.5 rounded-card bg-surface p-nest shadow-card">
        {fields.map((f) => {
          const stage = stages[f.id] ?? "home";
          const placed = stage === "placed";
          return (
            <button
              key={f.id}
              type="button"
              disabled={!placed}
              aria-label={placed ? `${f.label}: ${f.value}. Send back to the message` : `${f.label}: empty`}
              onClick={() => sendBack(f.id)}
              onPointerEnter={() => setHot(f.id)}
              onPointerLeave={() => setHot(null)}
              onFocus={() => setHot(f.id)}
              onBlur={() => setHot(null)}
              className={cn(
                "ad-press grid min-h-[44px] w-full grid-cols-[72px_minmax(0,1fr)] items-center gap-3 rounded-item px-2.5 py-1.5 text-left select-none md:min-h-[36px]",
                placed ? "cursor-pointer active:scale-[0.99]" : "cursor-default",
                hot === f.id && placed ? "bg-fill" : "focus-visible:bg-fill",
              )}
            >
              <span className="text-body text-ink-muted">{f.label}</span>
              <span className="relative flex min-w-0 justify-end text-right">
                <span
                  ref={(el) => {
                    values.current[f.id] = el;
                  }}
                  translate="no"
                  data-in={placed}
                  className={cn("ad-cto-value inline-block", f.strong ? "text-heading font-semibold tabular-nums text-ink" : "text-body text-ink")}
                >
                  {f.value}
                </span>
                <span aria-hidden className={cn("ad-cto-slot absolute right-0 top-1/2 h-2 -translate-y-1/2 rounded-small bg-fill", f.strong ? "w-24" : "w-16")} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
