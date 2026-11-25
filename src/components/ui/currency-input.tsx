import * as React from "react";
import { cn, formatNumber, prefersReducedMotion } from "@/lib/ad";
import { fieldBoxClass } from "@/components/ui/input";

export interface CurrencyInputProps {
  value: number | null;
  onValueChange: (value: number | null) => void;
  /** Shown before the number. */
  currency?: string;
  placeholder?: string;
  invalid?: boolean;
  /** Above this the field shows as invalid (the typed number is kept, never clamped); say why in the Field error. */
  max?: number;
  /** Amounts offered as chips under the field; a press adds one to the value and the digits roll. */
  quick?: number[];
  /** A soft ceiling (a credit limit): a meter under the field shows what is left, and going over is a calm line, never an error. */
  limit?: number;
  className?: string;
  "aria-label"?: string;
}

const group = (n: number) => formatNumber(n);
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
type Mode = "type" | "roll";
type Cell = { ch: string; x: number };

const cellsOf = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>("[data-c]")].map((el) => ({ el, ch: el.dataset.c!, x: el.offsetLeft }));

/**
 * The number, drawn one character at a time. Typing slides the digits to their new places and the separators with
 * them; a jump (a quick amount) rolls only the digits that changed, the right-hand ones first.
 */
function Digits({ text, mode, className }: { text: string; mode: React.RefObject<Mode>; className?: string }) {
  const root = React.useRef<HTMLSpanElement>(null);
  const ghosts = React.useRef<HTMLSpanElement>(null);
  const last = React.useRef<{ text: string; cells: Cell[] } | null>(null);

  React.useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const now = cellsOf(el);
    const old = last.current;
    last.current = { text, cells: now.map(({ ch, x }) => ({ ch, x })) };
    if (!old || old.text === text || prefersReducedMotion()) return;
    const isDigit = (c: { ch: string }) => c.ch !== ".";
    const newD = now.filter(isDigit);
    const oldD = old.cells.filter(isDigit);
    const newS = now.filter((c) => !isDigit(c));
    const oldS = old.cells.filter((c) => !isDigit(c));
    now.forEach((c) => c.el.getAnimations().forEach((a) => a.cancel()));
    const slide = (c: (typeof now)[number], from: number, delay = 0) => {
      const dx = from - c.x;
      if (Math.abs(dx) > 0.25) c.el.animate([{ transform: `translateX(${dx}px)` }, { transform: "none" }], { duration: 180, easing: EASE, delay, fill: "backwards" });
    };
    const enter = (c: (typeof now)[number], delay = 0) =>
      c.el.animate([{ opacity: 0, transform: "translateY(45%)" }, { opacity: 1, transform: "none" }], { duration: 200, easing: EASE, delay, fill: "backwards" });

    if (mode.current === "type") {
      newD.forEach((c, i) => (oldD[i] ? slide(c, oldD[i].x) : enter(c)));
    } else {
      newD.forEach((c, i) => {
        const place = newD.length - 1 - i;
        const was = oldD[oldD.length - 1 - place];
        const delay = place * 14;
        if (!was) return void enter(c, delay);
        if (was.ch === c.ch) return slide(c, was.x, delay);
        const g = document.createElement("span");
        g.textContent = was.ch;
        g.style.cssText = `position:absolute;left:${was.x}px;top:0;`;
        ghosts.current?.appendChild(g);
        g.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-70%)", filter: "blur(2px)" }], { duration: 200, easing: EASE, delay, fill: "both" }).onfinish = () => g.remove();
        c.el.animate(
          [{ opacity: 0, transform: `translate(${was.x - c.x}px, 70%)`, filter: "blur(2px)" }, { opacity: 1, transform: "none", filter: "blur(0px)" }],
          { duration: 240, easing: EASE, delay, fill: "backwards" },
        );
      });
    }
    newS.forEach((c, i) => {
      const was = oldS[oldS.length - newS.length + i];
      if (was) slide(c, was.x);
      else c.el.animate([{ opacity: 0, transform: "translateX(3px)" }, { opacity: 1, transform: "none" }], { duration: 180, easing: EASE, fill: "backwards" });
    });
    mode.current = "roll";
  }, [text, mode]);

  const count = text.length;
  return (
    <span ref={root} aria-hidden className={cn("relative inline-flex whitespace-pre [font-kerning:none]", className)}>
      {[...text].map((ch, i) => (
        <span key={`${ch === "." ? "s" : "d"}${count - i}`} data-c={ch} className="inline-block">
          {ch}
        </span>
      ))}
      <span ref={ghosts} className="pointer-events-none absolute inset-0" />
    </span>
  );
}

/** Types as "Rp 12.400.000": separators slide into place while typing and the caret stays on its digit. */
export function CurrencyInput({ value, onValueChange, currency = "Rp", placeholder = "0", invalid, max = 999_999_999_999, quick, limit, className, ...aria }: CurrencyInputProps) {
  const ref = React.useRef<HTMLInputElement>(null);
  const caret = React.useRef<number | null>(null);
  const mode = React.useRef<Mode>("roll");
  const metaMode = React.useRef<Mode>("roll");
  const [long, setLong] = React.useState(false);
  const text = value == null ? "" : group(value);
  const over = value != null && value > max;

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setLong(el.scrollWidth > el.clientWidth + 1);
    if (caret.current == null) return;
    let digits = caret.current;
    let pos = 0;
    while (pos < text.length && digits > 0) {
      if (/\d/.test(text[pos])) digits--;
      pos++;
    }
    el.setSelectionRange(pos, pos);
    caret.current = null;
  }, [text]);

  const add = (amount: number) => {
    mode.current = "roll";
    metaMode.current = "roll";
    onValueChange(Math.min((value ?? 0) + amount, 999_999_999_999_999));
  };

  const field = (
    <label className={cn(fieldBoxClass(invalid || over), "cursor-text", !quick && limit == null && className)}>
      <span className="shrink-0 text-ink-muted">{currency}</span>
      <span className="relative flex h-full min-w-0 flex-1 items-center">
        <input
          ref={ref}
          inputMode="numeric"
          autoComplete="off"
          aria-label={aria["aria-label"]}
          aria-invalid={invalid || over || undefined}
          value={text}
          placeholder={placeholder}
          onChange={(e) => {
            const raw = e.target.value;
            const before = raw.slice(0, e.target.selectionStart ?? raw.length).replace(/\D/g, "").length;
            const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 15);
            caret.current = before;
            mode.current = "type";
            metaMode.current = "roll";
            onValueChange(digits ? Number(digits) : null);
          }}
          className={cn(
            "h-full w-full min-w-0 bg-transparent text-right tabular-nums caret-ink outline-none [font-kerning:none] placeholder:text-ink-muted",
            long ? "text-ink" : "text-transparent",
          )}
        />
        {long ? null : (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-end overflow-clip text-ink tabular-nums">
            <Digits text={text} mode={mode} />
          </span>
        )}
      </span>
    </label>
  );
  if (!quick?.length && limit == null) return field;

  const left = limit == null ? 0 : limit - (value ?? 0);
  const past = limit != null && left < 0;
  const share = limit ? Math.min(1, (value ?? 0) / limit) : 0;
  return (
    <div className={cn("grid min-w-0 gap-gap", className)}>
      {field}
      {quick?.length ? (
        <div className="flex flex-wrap gap-1">
          {quick.map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`Add ${currency} ${group(n)}`}
              onClick={() => add(n)}
              className="inline-flex h-item cursor-pointer items-center rounded-control bg-fill px-bubble-sm text-body tabular-nums text-ink ad-press hover:bg-fill-strong focus-visible:bg-fill-strong active:scale-[0.97]"
            >
              +{group(n)}
            </button>
          ))}
        </div>
      ) : null}
      {limit != null ? (
        <div className="grid gap-1.5 pt-1">
          <span className="relative block h-1.5 overflow-hidden rounded-full bg-fill">
            <span
              className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-ink-muted transition-transform duration-[260ms] ease-ad"
              style={{ transform: `scaleX(${share})` }}
            />
          </span>
          <span className="flex items-center justify-between gap-3 text-body tabular-nums text-ink-muted" aria-live="polite">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="sr-only">{past ? `${currency} ${group(-left)} over the limit` : `${currency} ${group(left)} left`}</span>
              <span aria-hidden className={cn("flex items-center gap-[0.25em] whitespace-nowrap", past && "text-ink")}>
                {currency} <Digits text={group(Math.abs(left))} mode={metaMode} /> {past ? "over the limit" : "left"}
              </span>
              <span className={cn("size-1.5 shrink-0 rounded-full bg-danger transition-opacity duration-[220ms]", past ? "opacity-100" : "opacity-0")} />
            </span>
            <span className="shrink-0">of {currency} {group(limit)}</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
