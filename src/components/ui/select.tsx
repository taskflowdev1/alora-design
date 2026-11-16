import * as React from "react";
import { Popover as P } from "radix-ui";
import { Check, ChevronDown } from "react-feather";
import { cn } from "@/lib/ad";

export type Option = {
  value: string;
  label: string;
  /** Leading visual: a flag, a logo, a Feather icon element. */
  icon?: React.ReactNode;
  disabled?: boolean;
};

/* The one dropdown surface. Select, Multi-select, Combobox and Language picker all use it. */

/** Menu surface: radius = item radius + padding, so options sit concentric inside it. */
export const dropdownSurface = cn(
  "z-50 min-w-[var(--radix-popover-trigger-width)] rounded-card bg-raised p-nest text-ink shadow-raised",
  "origin-(--radix-popover-content-transform-origin) data-[state=open]:animate-[ad-in_220ms_var(--ad-ease)] data-[state=closed]:animate-[ad-out_120ms_ease-in]",
);

export const triggerClass = cn(
  "inline-flex h-control min-w-0 cursor-pointer select-none items-center gap-2 rounded-control bg-fill pl-3 pr-2 text-body text-ink",
  "transition-[transform,background-color] duration-[220ms] ease-ad hover:bg-fill-hover focus-visible:bg-fill-hover data-[state=open]:bg-fill-hover active:scale-[0.98]",
  "disabled:pointer-events-none disabled:opacity-45",
);

export function optionClass(active: boolean, disabled?: boolean) {
  return cn(
    "flex h-item cursor-pointer select-none items-center gap-2 rounded-control px-2.5 text-body text-ink",
    active && "bg-fill",
    disabled && "pointer-events-none opacity-45",
  );
}

/** Arrow keys, Home/End and type-to-find over a list of options. */
export function useListNav(options: Option[], onPick: (index: number) => void, initial = 0) {
  const [active, setActive] = React.useState(initial);
  const typed = React.useRef({ text: "", at: 0 });
  const move = React.useCallback(
    (from: number, dir: 1 | -1) => {
      const n = options.length;
      for (let i = 1; i <= n; i++) {
        const next = (from + dir * i + n) % n;
        if (!options[next]?.disabled) return next;
      }
      return from;
    },
    [options],
  );
  const onKeyDown = (e: React.KeyboardEvent, allowTypeahead = true) => {
    if (e.key === "ArrowDown") setActive((a) => move(a, 1));
    else if (e.key === "ArrowUp") setActive((a) => move(a, -1));
    else if (e.key === "Home") setActive(move(-1, 1));
    else if (e.key === "End") setActive(move(options.length, -1));
    else if (e.key === "Enter" || (e.key === " " && allowTypeahead && !typed.current.text)) {
      if (options[active] && !options[active].disabled) onPick(active);
    } else if (allowTypeahead && e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      const now = Date.now();
      typed.current.text = now - typed.current.at < 600 ? typed.current.text + e.key.toLowerCase() : e.key.toLowerCase();
      typed.current.at = now;
      const hit = options.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(typed.current.text));
      if (hit >= 0) setActive(hit);
      return;
    } else return;
    e.preventDefault();
  };
  return { active, setActive, onKeyDown };
}

export interface OptionListProps {
  id: string;
  options: Option[];
  active: number;
  setActive: (i: number) => void;
  isSelected: (value: string) => boolean;
  onPick: (index: number) => void;
  multiple?: boolean;
  empty?: React.ReactNode;
  className?: string;
}

export function OptionList({ id, options, active, setActive, isSelected, onPick, multiple, empty, className }: OptionListProps) {
  const ref = React.useRef<HTMLUListElement>(null);
  React.useEffect(() => {
    ref.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);
  if (!options.length && empty) return <div className="flex h-item items-center px-2.5 text-body text-ink-muted">{empty}</div>;
  return (
    <ul ref={ref} id={`${id}-list`} role="listbox" aria-multiselectable={multiple || undefined} className={cn("grid gap-px", className)}>
      {options.map((o, i) => {
        const selected = isSelected(o.value);
        return (
          <li
            key={o.value}
            id={`${id}-opt-${i}`}
            data-index={i}
            role="option"
            aria-selected={selected}
            aria-disabled={o.disabled || undefined}
            className={optionClass(i === active, o.disabled)}
            onPointerMove={() => i !== active && setActive(i)}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => onPick(i)}
          >
            {o.icon ? <span className="flex shrink-0 items-center text-ink-muted">{o.icon}</span> : null}
            <span className="min-w-0 flex-1 truncate">{o.label}</span>
            <Check size={16} className={cn("shrink-0 text-ink transition-opacity duration-[220ms]", selected ? "opacity-100" : "opacity-0")} />
          </li>
        );
      })}
    </ul>
  );
}

export interface SelectProps {
  value: string | null;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  /** Text before the value inside the trigger, for example "Status". */
  prefix?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  align?: "start" | "center" | "end";
  "aria-label"?: string;
  /** Custom trigger content; defaults to icon + label. */
  renderValue?: (option: Option | undefined) => React.ReactNode;
}

/** Custom single-choice dropdown. Never the native select look. */
export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Select",
  prefix,
  disabled,
  className,
  contentClassName,
  align = "start",
  renderValue,
  ...aria
}: SelectProps) {
  const id = React.useId();
  const [open, setOpen] = React.useState(false);
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const pick = (i: number) => {
    onValueChange(options[i].value);
    setOpen(false);
  };
  const nav = useListNav(options, pick, selectedIndex);
  const listRef = React.useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  return (
    <P.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) nav.setActive(selectedIndex);
      }}
    >
      <P.Trigger
        disabled={disabled}
        aria-haspopup="listbox"
        aria-label={aria["aria-label"]}
        className={cn(triggerClass, className)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {prefix ? <span className="shrink-0 text-ink-muted">{prefix}</span> : null}
        {renderValue ? (
          renderValue(current)
        ) : current ? (
          <>
            {current.icon ? <span className="flex shrink-0 items-center text-ink-muted">{current.icon}</span> : null}
            <span className="min-w-0 truncate">{current.label}</span>
          </>
        ) : (
          <span className="min-w-0 truncate text-ink-faint">{placeholder}</span>
        )}
        <ChevronDown size={16} className="ml-auto shrink-0 text-ink-muted" />
      </P.Trigger>
      <P.Portal>
        <P.Content
          ref={listRef}
          align={align}
          sideOffset={6}
          collisionPadding={8}
          tabIndex={-1}
          aria-activedescendant={`${id}-opt-${nav.active}`}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            listRef.current?.focus();
          }}
          onKeyDown={(e) => nav.onKeyDown(e)}
          className={cn(dropdownSurface, "max-h-[min(320px,var(--radix-popover-content-available-height))] overflow-auto", contentClassName)}
        >
          <OptionList
            id={id}
            options={options}
            active={nav.active}
            setActive={nav.setActive}
            isSelected={(v) => v === value}
            onPick={pick}
          />
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}
