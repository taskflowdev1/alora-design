import * as React from "react";
import { Popover as P } from "radix-ui";
import { ChevronDown, Clock } from "react-feather";
import { cn } from "@/lib/ad";
import { dropdownSurface, triggerClass } from "@/components/ui/select";

export interface TimePickerProps {
  /** "14:30" (24-hour). */
  value: string | null;
  onValueChange: (value: string) => void;
  /** Minutes between choices. */
  step?: 5 | 10 | 15 | 30;
  placeholder?: string;
  className?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Hours and minutes in two short columns. 24-hour, as Indonesian shops write it. */
export function TimePicker({ value, onValueChange, step = 15, placeholder = "Pick a time", className }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [h, m] = (value ?? "").split(":").map(Number);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 / step }, (_, i) => i * step);
  const cols = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() =>
      cols.current.forEach((c) => c?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "center" })),
    );
  }, [open]);

  const cell = (selected: boolean) =>
    cn(
      "flex h-item w-12 shrink-0 cursor-pointer items-center justify-center rounded-control text-body tabular-nums transition-[background-color,transform] duration-[150ms] ease-ad active:scale-[0.97]",
      selected ? "bg-on text-on-ink" : "hover:bg-fill focus-visible:bg-fill",
    );

  return (
    <P.Root open={open} onOpenChange={setOpen}>
      <P.Trigger className={cn(triggerClass, "tabular-nums", className)}>
        <Clock size={16} className="shrink-0 text-ink-muted" />
        {value ? <span>{value}</span> : <span className="text-ink-muted">{placeholder}</span>}
        <ChevronDown size={16} className="ml-auto shrink-0 text-ink-muted" />
      </P.Trigger>
      <P.Portal>
        <P.Content align="start" sideOffset={6} collisionPadding={8} className={cn(dropdownSurface, "flex gap-nest")}>
          {[hours, minutes].map((list, ci) => (
            <div
              key={ci}
              ref={(el) => {
                cols.current[ci] = el;
              }}
              role="listbox"
              aria-label={ci ? "Minutes" : "Hours"}
              className="grid max-h-56 gap-px overflow-auto"
            >
              {list.map((n) => {
                const selected = ci ? n === m : n === h;
                return (
                  <button
                    key={n}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={cell(selected)}
                    onClick={() => {
                      const hh = ci ? (Number.isFinite(h) ? h : 9) : n;
                      const mm = ci ? n : Number.isFinite(m) ? m : 0;
                      onValueChange(`${pad(hh)}:${pad(mm)}`);
                      if (ci) setOpen(false);
                    }}
                  >
                    {pad(n)}
                  </button>
                );
              })}
            </div>
          ))}
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}
