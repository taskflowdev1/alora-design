import * as React from "react";
import { Check } from "react-feather";
import { cn } from "@/lib/ad";
import { Switch } from "@/components/ui/switch";
import { SlidingPill } from "@/components/ui/sliding-pill";

const row =
  "relative flex w-full min-w-0 cursor-pointer touch-manipulation select-none items-center gap-3 rounded-item px-[calc(var(--ad-pad)-var(--ad-nest))] text-left transition-colors duration-[120ms] active:duration-0 data-pressed:duration-0 disabled:pointer-events-none disabled:opacity-45";
const press = "active:bg-fill data-pressed:bg-fill focus-visible:bg-fill [@media(hover:hover)]:hover:bg-fill";

type Icon = React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>;

function Body({ icon: I, title, subtitle }: { icon?: Icon; title: React.ReactNode; subtitle?: React.ReactNode }) {
  return (
    <>
      {I ? (
        <span className="grid size-[20px] shrink-0 place-items-center text-ink">
          <I size={20} strokeWidth={1.75} />
        </span>
      ) : null}
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="truncate text-[15px] text-ink">{title}</span>
        {subtitle ? <span className="truncate text-[13px] text-ink-muted">{subtitle}</span> : null}
      </span>
    </>
  );
}

export interface MobileSwitchRowProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: Icon;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

/** A setting that is on or off: the whole row is the switch's label, so a tap anywhere on it flips the switch. */
export function MobileSwitchRow({ title, subtitle, icon, checked, onCheckedChange, disabled }: MobileSwitchRowProps) {
  const id = React.useId();
  return (
    <label htmlFor={id} role="listitem" className={cn(row, "has-[:focus-visible]:bg-fill", subtitle ? "min-h-[56px] py-2" : "min-h-touch py-1.5", disabled && "pointer-events-none opacity-45")}>
      <Body icon={icon} title={title} subtitle={subtitle} />
      <Switch id={id} size="lg" checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </label>
  );
}

/** The round check used by check rows: an empty soft circle, or ink with a white tick. */
export function CheckMark({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      data-shape="round"
      className={cn(
        "grid size-[22px] shrink-0 place-items-center rounded-full transition-colors duration-[160ms] ease-ad",
        checked ? "bg-on text-on-ink" : "bg-fill-strong text-transparent",
        className,
      )}
    >
      <Check size={14} strokeWidth={2.5} className={cn("transition-transform duration-[160ms] ease-ad", checked ? "scale-100" : "scale-50")} />
    </span>
  );
}

export interface MobileCheckRowProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: Icon;
  /** Right side, before the check: a count, a price. */
  value?: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

/** One of several things you can tick: the row is the checkbox (edge to edge), the round check sits on the right. */
export function MobileCheckRow({ title, subtitle, icon, value, checked, onCheckedChange, disabled }: MobileCheckRowProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(row, press, subtitle ? "min-h-[56px] py-2" : "min-h-touch py-1.5")}
    >
      <Body icon={icon} title={title} subtitle={subtitle} />
      {value != null ? <span className="shrink-0 text-[15px] tabular-nums text-ink-muted">{value}</span> : null}
      <CheckMark checked={checked} />
    </button>
  );
}

export interface MobileRadioOption<T extends string> {
  value: T;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: Icon;
  value2?: React.ReactNode;
}

export interface MobileRadioListProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: MobileRadioOption<T>[];
  "aria-label": string;
  className?: string;
}

/**
 * One of a few: rows on a soft card, the chosen row carries a grey pill that slides to the row you tap, and a tick on
 * the right. Arrow keys move the choice.
 */
export function MobileRadioList<T extends string>({ value, onValueChange, options, className, ...aria }: MobileRadioListProps<T>) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const at = options.findIndex((o) => o.value === value);
  return (
    <div
      role="radiogroup"
      aria-label={aria["aria-label"]}
      className={cn("relative grid", className)}
      onKeyDown={(e) => {
        const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        const i = (Math.max(0, at) + d + options.length) % options.length;
        onValueChange(options[i].value);
        refs.current[i]?.focus();
      }}
    >
      <SlidingPill selector='[aria-checked="true"]' className="rounded-item bg-fill" />
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={o.value === value || (at < 0 && i === 0) ? 0 : -1}
          onClick={() => onValueChange(o.value)}
          className={cn(row, "outline-none focus-visible:bg-fill aria-checked:focus-visible:bg-fill-strong", o.subtitle ? "min-h-[56px] py-2" : "min-h-touch py-1.5")}
        >
          <Body icon={o.icon} title={o.title} subtitle={o.subtitle} />
          {o.value2 != null ? <span className="shrink-0 text-[15px] tabular-nums text-ink-muted">{o.value2}</span> : null}
          <Check size={20} strokeWidth={2} className={cn("shrink-0 text-ink transition-[opacity,scale] duration-[160ms] ease-ad", o.value === value ? "scale-100 opacity-100" : "scale-75 opacity-0")} />
        </button>
      ))}
    </div>
  );
}
