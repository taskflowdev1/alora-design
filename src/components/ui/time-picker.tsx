import * as React from "react";
import { Popover as P } from "radix-ui";
import { ChevronDown, Clock } from "react-feather";
import { cn } from "@/lib/ad";
import { dropdownSurface, triggerClass, usePressOpen } from "@/components/ui/select";

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

/** Fades a column's cut edge (16 px), only on a side with more to scroll to. */
function useEdgeFade(ref: React.RefObject<HTMLElement | null>, on: boolean) {
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !on) return;
    const measure = () => {
      const top = el.scrollTop > 1;
      const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
      const mask = top || bottom ? `linear-gradient(to bottom, ${top ? "transparent" : "#000"}, #000 16px, #000 calc(100% - 16px), ${bottom ? "transparent" : "#000"})` : "";
      el.style.maskImage = mask;
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    return () => el.removeEventListener("scroll", measure);
  }, [ref, on]);
}

interface ColumnProps {
  label: string;
  list: number[];
  selected: number;
  open: boolean;
  onPick: (n: number) => void;
  /** ←/→ from this column. */
  onCross: (dir: 1 | -1) => void;
  colRef: React.RefObject<HTMLDivElement | null>;
}

function Column({ label, list, selected, open, onPick, onCross, colRef }: ColumnProps) {
  const at = Math.max(0, list.indexOf(selected));
  const [active, setActive] = React.useState(at);
  React.useEffect(() => setActive(at), [at, open]);
  useEdgeFade(colRef, open);
  const focusCell = (i: number) => {
    setActive(i);
    colRef.current?.querySelectorAll<HTMLElement>('[role="option"]')[i]?.focus();
  };
  return (
    <div
      ref={colRef}
      role="listbox"
      aria-label={label}
      // Rows snap to whole cells, so the two columns' rows always sit on one line.
      className="grid max-h-56 snap-y snap-mandatory gap-px overflow-auto overscroll-contain"
      onKeyDown={(e) => {
        const n = list.length;
        const next = e.key === "ArrowDown" ? active + 1 : e.key === "ArrowUp" ? active - 1 : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
        if (next != null) {
          e.preventDefault();
          focusCell(Math.max(0, Math.min(n - 1, next)));
        } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          onCross(e.key === "ArrowRight" ? 1 : -1);
        }
      }}
    >
      {list.map((n, i) => {
        const isSel = n === selected;
        return (
          <button
            key={n}
            type="button"
            role="option"
            aria-selected={isSel}
            // One tab stop per column (roving): arrows move inside it, ←/→ to the other column.
            tabIndex={i === active ? 0 : -1}
            onClick={() => onPick(n)}
            className={cn(
              "flex h-item w-12 shrink-0 cursor-pointer snap-start items-center justify-center rounded-control text-body tabular-nums transition-[background-color,transform] duration-[150ms] ease-ad active:scale-[0.97]",
              // Selected: the grey pill on a surface, not solid ink. With keyboard focus it darkens a notch.
              isSel
                ? "bg-fill-strong font-medium text-ink focus-visible:brightness-[0.88] dark:focus-visible:brightness-[0.78]"
                : "text-ink hover:bg-fill focus-visible:bg-fill",
            )}
          >
            {pad(n)}
          </button>
        );
      })}
    </div>
  );
}

/** Hours and minutes in two short columns. 24-hour, as Indonesian shops write it. */
export function TimePicker({ value, onValueChange, step = 15, placeholder = "Pick a time", className }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const press = usePressOpen(open, setOpen);
  const [h, m] = (value ?? "").split(":").map(Number);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 / step }, (_, i) => i * step);
  const hourCol = React.useRef<HTMLDivElement>(null);
  const minuteCol = React.useRef<HTMLDivElement>(null);
  const cols = [hourCol, minuteCol];

  // On open, scroll each column by whole rows so its choice sits near the middle; both columns then share one row grid.
  React.useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() =>
      cols.forEach((ref) => {
        const col = ref.current;
        const cells = col?.querySelectorAll<HTMLElement>('[role="option"]');
        if (!col || !cells || cells.length < 2) return;
        const pitch = cells[1].offsetTop - cells[0].offsetTop;
        const i = Math.max(0, Array.from(cells).findIndex((c) => c.getAttribute("aria-selected") === "true"));
        col.scrollTop = Math.max(0, i - Math.floor(col.clientHeight / pitch / 2)) * pitch;
      }),
    );
    return () => cancelAnimationFrame(id);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const focusCol = (ci: number) => cols[ci].current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  const pick = (ci: number, n: number) => {
    const hh = ci ? (Number.isFinite(h) ? h : 9) : n;
    const mm = ci ? n : Number.isFinite(m) ? m : 0;
    onValueChange(`${pad(hh)}:${pad(mm)}`);
    if (ci) setOpen(false);
  };

  return (
    <P.Root open={open} onOpenChange={setOpen}>
      <P.Trigger {...press} className={cn(triggerClass, "tabular-nums", className)}>
        <Clock size={16} className="shrink-0 text-ink-muted" />
        {value ? <span>{value}</span> : <span className="text-ink-muted">{placeholder}</span>}
        <ChevronDown size={16} className="ml-auto shrink-0 text-ink-muted" />
      </P.Trigger>
      <P.Portal>
        <P.Content
          align="start"
          sideOffset={6}
          collisionPadding={8}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            requestAnimationFrame(() => focusCol(0));
          }}
          className={cn(dropdownSurface, "flex items-start gap-nest")}
        >
          <Column label="Hours" list={hours} selected={h} open={open} colRef={hourCol} onPick={(n) => pick(0, n)} onCross={() => focusCol(1)} />
          <Column label="Minutes" list={minutes} selected={m} open={open} colRef={minuteCol} onPick={(n) => pick(1, n)} onCross={() => focusCol(0)} />
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}
