import * as React from "react";
import { Check, ChevronDown } from "react-feather";
import { cn } from "@/lib/ad";
import { Menu, MenuItem } from "@/components/ui/menu";

export interface StatusOption {
  value: string;
  label: string;
  /** The background class of its small dot: the only colour a status carries. */
  dot: string;
}

export const ORDER_STATUSES: StatusOption[] = [
  { value: "unpaid", label: "Unpaid", dot: "bg-danger" },
  { value: "paid", label: "Paid", dot: "bg-brand" },
  { value: "packed", label: "Packed", dot: "bg-ink-muted" },
  { value: "shipped", label: "Shipped", dot: "bg-success" },
];

const CSS = `
@keyframes ad-status-in { from { transform: translateY(calc(var(--ad-status-dir) * 100%)); opacity: 0; } }
@keyframes ad-status-out { to { transform: translateY(calc(var(--ad-status-dir) * -100%)); opacity: 0; } }
.ad-status-in { animation: ad-status-in 240ms var(--ad-ease) both; }
.ad-status-out { animation: ad-status-out 240ms var(--ad-ease) both; }`;

export interface StatusSelectProps {
  options?: StatusOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Shows the status without a menu; it still morphs when the value changes (a table cell, a bulk update). */
  readOnly?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
}

/**
 * An order's status as a pill that opens a short menu. Picking a status morphs the pill: its width glides to the new
 * label, the label rolls, and only the small dot changes colour.
 */
export function StatusSelect({ options = ORDER_STATUSES, value, defaultValue, onValueChange, readOnly, disabled, "aria-label": label = "Status", className }: StatusSelectProps) {
  const [inner, setInner] = React.useState(defaultValue ?? options[0].value);
  const current = value ?? inner;
  const index = Math.max(0, options.findIndex((o) => o.value === current));
  const option = options[index];

  const [shown, setShown] = React.useState(index);
  const [roll, setRoll] = React.useState<{ from: StatusOption | null; dir: 1 | -1; n: number }>({ from: null, dir: 1, n: 0 });
  if (shown !== index) {
    setShown(index);
    setRoll({ from: options[shown] ?? null, dir: index > shown ? 1 : -1, n: roll.n + 1 });
  }

  const ruler = React.useRef<HTMLSpanElement>(null);
  const [widths, setWidths] = React.useState<number[]>([]);
  const labels = options.map((o) => o.label).join("|");
  React.useLayoutEffect(() => {
    let live = true;
    const read = () => {
      if (!live || !ruler.current) return;
      const next = Array.from(ruler.current.children, (c) => (c as HTMLElement).offsetWidth + 1);
      setWidths((w) => (w.length === next.length && w.every((x, i) => x === next[i]) ? w : next));
    };
    read();
    void document.fonts?.ready.then(read);
    return () => void (live = false);
  }, [labels]);

  const pick = (v: string) => {
    if (v === current) return;
    if (value === undefined) setInner(v);
    onValueChange?.(v);
  };

  const body = (
    <>
      <style>{CSS}</style>
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full transition-colors duration-[220ms] ease-ad motion-reduce:transition-none", option.dot)} />
      <span
        className="relative block h-[1lh] overflow-hidden transition-[width] duration-[240ms] ease-ad motion-reduce:transition-none"
        style={{ width: widths[index], "--ad-status-dir": roll.dir } as React.CSSProperties}
      >
        {roll.from ? (
          <span key={`out-${roll.n}`} aria-hidden onAnimationEnd={() => setRoll((r) => ({ ...r, from: null }))} className="ad-status-out absolute left-0 top-0 whitespace-nowrap">
            {roll.from.label}
          </span>
        ) : null}
        <span key={roll.n} className={cn("absolute left-0 top-0 whitespace-nowrap", roll.n > 0 && "ad-status-in")}>
          {option.label}
        </span>
      </span>
      <span ref={ruler} aria-hidden className="invisible absolute left-0 top-0 h-0 overflow-hidden">
        {options.map((o) => (
          <span key={o.value} className="absolute whitespace-nowrap">
            {o.label}
          </span>
        ))}
      </span>
    </>
  );

  if (readOnly) {
    return <span className={cn("relative inline-flex h-item shrink-0 items-center gap-1.5 whitespace-nowrap text-body text-ink", className)}>{body}</span>;
  }
  return (
    <Menu
      align="end"
      className="min-w-36"
      trigger={
        <button
          type="button"
          disabled={disabled}
          aria-label={`${label}: ${option.label}`}
          className={cn(
            "relative inline-flex h-item shrink-0 cursor-pointer select-none items-center gap-1.5 whitespace-nowrap rounded-control bg-fill pl-bubble-sm pr-1.5 text-body font-medium text-ink ad-press",
            "hover:bg-fill-strong focus-visible:bg-fill-strong data-[state=open]:bg-fill-strong disabled:pointer-events-none disabled:opacity-45",
            className,
          )}
        >
          {body}
          <ChevronDown size={14} className="shrink-0 text-ink-muted" />
        </button>
      }
    >
      {options.map((o) => (
        <MenuItem key={o.value} onSelect={() => pick(o.value)}>
          <span className="flex w-full items-center gap-2">
            <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", o.dot)} />
            <span className="min-w-0 flex-1 truncate">{o.label}</span>
            {o.value === current ? <Check size={16} className="shrink-0 text-ink-muted" /> : null}
          </span>
        </MenuItem>
      ))}
    </Menu>
  );
}
