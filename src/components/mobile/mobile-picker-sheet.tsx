import * as React from "react";
import { Check, X } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { SlidingPill } from "@/components/ui/sliding-pill";
import { MobileSheet } from "./mobile-sheet";
import { MobileSearchBar } from "./mobile-search-bar";
import { CheckMark } from "./mobile-choice-rows";

export interface PickerOption {
  value: string;
  label: string;
  /** A second, muted line ("2–3 days"). */
  detail?: string;
  /** Right side: a count or price. */
  meta?: React.ReactNode;
  icon?: React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>;
}

const row =
  "relative flex min-h-touch w-full cursor-pointer touch-manipulation select-none items-center gap-3 rounded-control px-3 py-1.5 text-left [-webkit-tap-highlight-color:transparent] transition-transform duration-[120ms] ease-ad active:scale-[0.99]";
/** Search shows once a list is longer than this. */
const SEARCH_FROM = 8;

function OptionBody({ o }: { o: PickerOption }) {
  return (
    <>
      {o.icon ? <o.icon size={20} strokeWidth={1.75} /> : null}
      <span className="grid min-w-0 flex-1">
        <span className="truncate text-[15px] text-ink">{o.label}</span>
        {o.detail ? <span className="truncate text-[13px] text-ink-muted">{o.detail}</span> : null}
      </span>
      {o.meta != null ? <span className="shrink-0 text-[15px] tabular-nums text-ink-muted">{o.meta}</span> : null}
    </>
  );
}

function useFilter(options: PickerOption[], q: string) {
  const s = q.trim().toLowerCase();
  return s ? options.filter((o) => `${o.label} ${o.detail ?? ""}`.toLowerCase().includes(s)) : options;
}

export interface MobilePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: PickerOption[];
  value: string;
  onValueChange: (value: string) => void;
}

/**
 * The phone's dropdown: a sheet of options, the chosen one on a grey pill with a tick. Tapping an option slides the
 * pill to it and the sheet closes a beat later, so you see what you picked. Past eight options a search bar sits on top.
 */
export function MobilePickerSheet({ open, onOpenChange, title, options, value, onValueChange }: MobilePickerSheetProps) {
  const [q, setQ] = React.useState("");
  const [draft, setDraft] = React.useState(value);
  const timer = React.useRef(0);
  React.useEffect(() => {
    if (open) {
      setDraft(value);
      setQ("");
    }
    return () => window.clearTimeout(timer.current);
  }, [open, value]);
  const list = useFilter(options, q);
  const pick = (v: string) => {
    setDraft(v);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => (onValueChange(v), onOpenChange(false)), 220);
  };
  return (
    <MobileSheet open={open} onOpenChange={onOpenChange} title={title} detents={options.length > SEARCH_FROM ? [0.6, 0.92] : ["fit"]}>
      {options.length > SEARCH_FROM ? <MobileSearchBar value={q} onValueChange={setQ} placeholder={`Search ${title.toLowerCase()}`} className="mb-2" /> : null}
      <div role="radiogroup" aria-label={title} className="relative grid gap-px">
        <SlidingPill selector='[aria-checked="true"]' className="rounded-control bg-fill-strong" />
        {list.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={draft === o.value} onClick={() => pick(o.value)} className={row}>
            <OptionBody o={o} />
            <Check size={20} strokeWidth={2} className={cn("shrink-0 transition-opacity duration-[160ms] ease-ad", draft === o.value ? "opacity-100" : "opacity-0")} />
          </button>
        ))}
        {list.length === 0 ? <p className="py-8 text-center text-[15px] text-ink-muted">No match</p> : null}
      </div>
    </MobileSheet>
  );
}

export interface MobileMultiSelectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: PickerOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  /** The primary button, given the draft count: (n) => `Show ${n} shops`. */
  doneLabel?: (count: number) => string;
}

/**
 * Pick several: the chosen ones collect as chips at the top of the sheet (tap a chip to drop it), every row is a
 * check row. The sheet edits a draft; Done keeps it, Clear empties it, closing any other way changes nothing.
 */
export function MobileMultiSelectSheet({ open, onOpenChange, title, options, value, onValueChange, doneLabel = (n) => (n ? `Done · ${n}` : "Done") }: MobileMultiSelectSheetProps) {
  const [q, setQ] = React.useState("");
  const [draft, setDraft] = React.useState<string[]>(value);
  React.useEffect(() => {
    if (open) {
      setDraft(value);
      setQ("");
    }
  }, [open, value]);
  const list = useFilter(options, q);
  const toggle = (v: string) => setDraft((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]));
  const chosen = draft.map((v) => options.find((o) => o.value === v)).filter(Boolean) as PickerOption[];
  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      detents={[0.6, 0.92]}
      footer={
        <div className="flex gap-gap [&>*]:h-touch [&>*]:flex-1 [&>*]:text-[15px]">
          <Button onClick={() => setDraft([])} disabled={!draft.length}>
            Clear
          </Button>
          <Button variant="primary" onClick={() => (onValueChange(draft), onOpenChange(false))}>
            {doneLabel(draft.length)}
          </Button>
        </div>
      }
    >
      {/* The picked chips: one row that scrolls sideways; each chip drops its option. */}
      <div className="grid transition-[grid-template-rows] duration-[200ms] ease-ad motion-reduce:transition-none" style={{ gridTemplateRows: chosen.length ? "1fr" : "0fr" }}>
        <div className="min-h-0 overflow-hidden">
          <div aria-label="Chosen" className="-mx-pad flex gap-gap overflow-x-auto px-pad pb-2 [scrollbar-width:none]">
            {chosen.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-label={`Remove ${o.label}`}
                onClick={() => toggle(o.value)}
                className="flex h-touch shrink-0 cursor-pointer items-center gap-1.5 rounded-control bg-fill-strong pl-3.5 pr-2.5 text-[15px] text-ink animate-[ad-fade-in_160ms_var(--ad-ease)] transition-transform duration-[150ms] ease-ad active:scale-[0.96] [-webkit-tap-highlight-color:transparent]"
              >
                {o.label}
                <X size={16} strokeWidth={2} className="text-ink-muted" />
              </button>
            ))}
          </div>
        </div>
      </div>
      {options.length > SEARCH_FROM ? <MobileSearchBar value={q} onValueChange={setQ} placeholder={`Search ${title.toLowerCase()}`} className="mb-2" /> : null}
      <div role="group" aria-label={title} className="grid gap-px">
        {list.map((o) => {
          const on = draft.includes(o.value);
          return (
            <button key={o.value} type="button" role="checkbox" aria-checked={on} onClick={() => toggle(o.value)} className={cn(row, "active:bg-fill [@media(hover:hover)]:hover:bg-fill")}>
              <OptionBody o={o} />
              <CheckMark checked={on} />
            </button>
          );
        })}
        {list.length === 0 ? <p className="py-8 text-center text-[15px] text-ink-muted">No match</p> : null}
      </div>
    </MobileSheet>
  );
}
