import * as React from "react";
import { Popover as P } from "radix-ui";
import { Check, ChevronDown, X } from "react-feather";
import { cn, fieldChipClass, prefersReducedMotion } from "@/lib/ad";
import { usePopupOpen } from "@/lib/ad-hooks";
import { OptionList, dropdownSurface, optionClass, triggerClass, useListNav, usePressOpen, type Option } from "@/components/ui/select";

export interface MultiSelectProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  options: Option[];
  placeholder?: string;
  /** Chips shown inside the trigger before collapsing into "+n". 0 shows "Status · 3" instead, so the trigger keeps one
   *  width while you pick (a toolbar filter). */
  maxChips?: number;
  /** Show the list in place under the field, at a fixed height, instead of in a dropdown. */
  inline?: boolean;
  /** Height of the inline list, in px. */
  listHeight?: number;
  className?: string;
  "aria-label"?: string;
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const ROLL_CSS = `
@keyframes ad-ms-out { to { opacity: 0; transform: translateY(-70%); filter: blur(2px); } }
@keyframes ad-ms-in { from { opacity: 0; transform: translateY(70%); filter: blur(2px); } }`;

/** A count that rolls to its new value. */
function RollCount({ text }: { text: string }) {
  const [shown, setShown] = React.useState(text);
  const [from, setFrom] = React.useState<string | null>(null);
  if (text !== shown) {
    setShown(text);
    setFrom(shown);
  }
  return (
    <span className="relative inline-grid overflow-clip tabular-nums">
      <span key={text} style={from == null ? undefined : { animation: "ad-ms-in 220ms var(--ad-ease) both" }}>
        {text}
      </span>
      {from != null ? (
        <span key={from} aria-hidden className="absolute left-0 top-0" style={{ animation: "ad-ms-out 180ms var(--ad-ease) forwards" }} onAnimationEnd={() => setFrom(null)}>
          {from}
        </span>
      ) : null}
    </span>
  );
}

/** A copy of a chip, on top of everything, so it can cross from a portalled list into the field. */
function ghostAt(rect: DOMRect, label: string) {
  const g = document.createElement("span");
  g.className = fieldChipClass;
  g.textContent = label;
  g.setAttribute("aria-hidden", "true");
  Object.assign(g.style, { position: "fixed", left: `${rect.left}px`, top: `${rect.top}px`, height: `${rect.height}px`, margin: "0", zIndex: "60", pointerEvents: "none", paddingRight: "var(--ad-bubble-x-sm)", whiteSpace: "nowrap" });
  document.body.appendChild(g);
  return g;
}

/** Several choices in one control. Chips sit inside the trigger, concentric with it; a pick travels from the list into the field. */
export function MultiSelect({ value, onValueChange, options, placeholder = "Select", maxChips = 2, inline, listHeight = 216, className, ...aria }: MultiSelectProps) {
  const id = React.useId();
  const [open, setOpen] = usePopupOpen();
  const press = usePressOpen(open, setOpen);
  const row = React.useRef<HTMLSpanElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const before = React.useRef<Map<string, number> | null>(null);
  const flight = React.useRef<{ value: string; label: string; from: DOMRect } | null>(null);

  const chipEl = (v: string) => row.current?.querySelector<HTMLElement>(`[data-chip="${CSS.escape(v)}"]`) ?? null;
  const snapshot = () => {
    const m = new Map<string, number>();
    row.current?.querySelectorAll<HTMLElement>("[data-chip]").forEach((el) => m.set(el.dataset.chip!, el.getBoundingClientRect().left));
    before.current = m;
  };
  const toggle = (v: string, source?: Element | null) => {
    snapshot();
    const on = value.includes(v);
    if (on) {
      const el = chipEl(v);
      if (el && !prefersReducedMotion()) {
        const g = ghostAt(el.getBoundingClientRect(), options.find((o) => o.value === v)?.label ?? v);
        g.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(0.92)", filter: "blur(2px)" }], { duration: 160, easing: EASE }).onfinish = () => g.remove();
      }
    } else if (source && !prefersReducedMotion()) {
      const text = source.querySelector("span.truncate") ?? source;
      flight.current = { value: v, label: options.find((o) => o.value === v)?.label ?? v, from: text.getBoundingClientRect() };
    }
    onValueChange(on ? value.filter((x) => x !== v) : [...value, v]);
  };
  const rowOf = (i: number) => (inline ? listRef : { current: document.getElementById(`${id}-list`) }).current?.querySelector(`[data-index="${i}"]`);
  const nav = useListNav(options, (i) => toggle(options[i].value, rowOf(i)));
  const chosen = options.filter((o) => value.includes(o.value));
  const shown = chosen.slice(0, maxChips);
  const rest = chosen.length - shown.length;
  const chosenKey = chosen.map((o) => o.value).join("\u0000");

  React.useLayoutEffect(() => {
    const was = before.current;
    before.current = null;
    const trip = flight.current;
    flight.current = null;
    if (!row.current || prefersReducedMotion()) return;
    if (was) {
      row.current.querySelectorAll<HTMLElement>("[data-chip]").forEach((el) => {
        el.getAnimations().forEach((a) => a.cancel());
        const from = was.get(el.dataset.chip!);
        const dx = from == null ? 0 : from - el.getBoundingClientRect().left;
        if (Math.abs(dx) > 0.5) el.animate([{ transform: `translateX(${dx}px)` }, { transform: "none" }], { duration: 220, easing: EASE });
      });
    }
    if (!trip) return;
    const chip = chipEl(trip.value);
    const target = chip ?? row.current.querySelector<HTMLElement>("[data-more]");
    if (!target) return;
    const to = target.getBoundingClientRect();
    const g = ghostAt(to, trip.label);
    if (chip) chip.style.visibility = "hidden";
    const done = () => {
      g.remove();
      if (chip) chip.style.visibility = "";
    };
    const a = g.animate(
      [
        { transform: `translate(${trip.from.left - to.left}px, ${trip.from.top - to.top + (trip.from.height - to.height) / 2}px)`, opacity: 0.4 },
        { opacity: 1, offset: 0.3 },
        { transform: "none", opacity: chip ? 1 : 0 },
      ],
      { duration: 280, easing: EASE },
    );
    a.onfinish = done;
    a.oncancel = done;
  }, [chosenKey]);

  const chips = (
    <span ref={row} className="flex min-w-0 items-center gap-1">
      {shown.map((o) => (
        <span key={o.value} data-chip={o.value} className={cn(fieldChipClass, "min-w-0")}>
          <span className="max-w-28 truncate">{o.label}</span>
          <span
            role="button"
            tabIndex={-1}
            aria-label={`Remove ${o.label}`}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              toggle(o.value);
            }}
            className="relative grid size-[18px] shrink-0 place-items-center rounded-small text-ink-muted ad-press after:absolute after:-inset-[3px] hover:bg-fill focus-visible:bg-fill hover:text-ink focus-visible:text-ink active:scale-[0.97]"
          >
            <X size={14} />
          </span>
        </span>
      ))}
      {rest > 0 ? (
        <span data-more className={cn(fieldChipClass, "shrink-0 gap-0 pr-bubble-sm tabular-nums text-ink-muted")}>
          +<RollCount text={String(rest)} />
        </span>
      ) : null}
    </span>
  );
  const summary =
    chosen.length && maxChips <= 0 ? (
      <span className="truncate">
        {placeholder} <span className="tabular-nums text-ink-muted">· <RollCount text={String(chosen.length)} /></span>
      </span>
    ) : null;
  const style = (
    <style href="ad-multi-select" precedence="default">
      {ROLL_CSS}
    </style>
  );

  if (inline) {
    return (
      <div className={cn("grid min-w-0 gap-1", className)}>
        {style}
        <div className={cn("flex h-control min-w-0 items-center gap-2 rounded-control bg-fill pr-2 text-body text-ink", chosen.length && maxChips > 0 ? "pl-nest" : "pl-3")}>
          {chosen.length === 0 ? <span className="truncate text-ink-muted">{placeholder}</span> : null}
          {summary}
          {chips}
        </div>
        <div
          ref={listRef}
          role="listbox"
          tabIndex={0}
          aria-multiselectable
          aria-label={aria["aria-label"]}
          aria-activedescendant={`${id}-opt-${nav.active}`}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && chosen.length) {
              e.preventDefault();
              toggle(chosen[chosen.length - 1].value);
              return;
            }
            nav.onKeyDown(e);
            if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
              const box = e.currentTarget;
              requestAnimationFrame(() => {
                const el = box.querySelector<HTMLElement>('[data-active="true"]');
                if (!el) return;
                if (el.offsetTop < box.scrollTop) box.scrollTop = el.offsetTop;
                else if (el.offsetTop + el.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = el.offsetTop + el.offsetHeight - box.clientHeight;
              });
            }
          }}
          className="relative grid content-start gap-px overflow-y-auto outline-none"
          style={{ height: listHeight }}
        >
          {options.map((o, i) => {
            const on = value.includes(o.value);
            return (
              <div
                key={o.value}
                id={`${id}-opt-${i}`}
                role="option"
                data-index={i}
                data-active={i === nav.active}
                aria-selected={on}
                aria-disabled={o.disabled || undefined}
                className={cn(optionClass(false, o.disabled), "hover:bg-fill", i === nav.active && "in-focus:bg-fill")}
                onPointerMove={() => i !== nav.active && nav.setActive(i)}
                onPointerDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  nav.setActive(i);
                  toggle(o.value, e.currentTarget);
                }}
              >
                {o.icon ? <span className="flex shrink-0 items-center text-ink-muted">{o.icon}</span> : null}
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                <Check size={16} className={cn("shrink-0 text-ink transition-opacity duration-[220ms]", on ? "opacity-100" : "opacity-0")} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <P.Root open={open} onOpenChange={setOpen}>
      {style}
      <P.Trigger
        {...press}
        data-ad-anchor=""
        aria-haspopup="listbox"
        aria-label={aria["aria-label"]}
        className={cn(triggerClass, chosen.length && maxChips > 0 ? "pl-nest" : "", className)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {chosen.length === 0 ? <span className="truncate text-ink-muted">{placeholder}</span> : null}
        {summary}
        {chips}
        <ChevronDown size={16} className="ml-auto shrink-0 text-ink-muted" />
      </P.Trigger>
      <P.Portal>
        <P.Content
          onEscapeKeyDown={() => setOpen(false, true)}
          ref={listRef}
          align="start"
          sideOffset={6}
          collisionPadding={8}
          tabIndex={-1}
          aria-activedescendant={`${id}-opt-${nav.active}`}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            listRef.current?.focus();
          }}
          onKeyDown={(e) => nav.onKeyDown(e)}
          className={cn(dropdownSurface, "max-h-[min(320px,var(--radix-popover-content-available-height))] overflow-auto")}
        >
          <OptionList
            id={id}
            multiple
            options={options}
            active={nav.active}
            setActive={nav.setActive}
            isSelected={(v) => value.includes(v)}
            onPick={(i) => toggle(options[i].value, rowOf(i))}
          />
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}
