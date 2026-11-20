import * as React from "react";
import { Popover as P } from "radix-ui";
import { ChevronDown, X } from "react-feather";
import { cn } from "@/lib/ad";
import { usePopupOpen } from "@/lib/ad-hooks";
import { OptionList, dropdownSurface, triggerClass, useListNav, usePressOpen, type Option } from "@/components/ui/select";

export interface MultiSelectProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  options: Option[];
  placeholder?: string;
  /** Chips shown inside the trigger before collapsing into "+n". 0 shows "Status · 3" instead, so the trigger keeps one
   *  width while you pick (a toolbar filter). */
  maxChips?: number;
  className?: string;
  "aria-label"?: string;
}

/** Several choices in one control. Chips sit inside the trigger, concentric with it. */
export function MultiSelect({ value, onValueChange, options, placeholder = "Select", maxChips = 2, className, ...aria }: MultiSelectProps) {
  const id = React.useId();
  const [open, setOpen] = usePopupOpen();
  const press = usePressOpen(open, setOpen);
  const toggle = (v: string) => onValueChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const nav = useListNav(options, (i) => toggle(options[i].value));
  const listRef = React.useRef<HTMLDivElement>(null);
  const chosen = options.filter((o) => value.includes(o.value));
  const shown = chosen.slice(0, maxChips);
  const rest = chosen.length - shown.length;

  return (
    <P.Root open={open} onOpenChange={setOpen}>
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
        {chosen.length && maxChips <= 0 ? (
          <span className="truncate">
            {placeholder} <span className="tabular-nums text-ink-muted">· {chosen.length}</span>
          </span>
        ) : null}
        <span className="flex min-w-0 items-center gap-1">
          {shown.map((o) => (
            <span
              key={o.value}
              className="inline-flex h-[calc(var(--ad-control-h)-var(--ad-nest)*2)] items-center gap-1 rounded-item bg-sel pl-bubble-sm pr-1 text-body text-ink shadow-sel"
            >
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
                className="relative grid size-[18px] place-items-center rounded-small text-ink-muted ad-press after:absolute after:-inset-[3px] hover:bg-fill focus-visible:bg-fill hover:text-ink focus-visible:text-ink active:scale-[0.97]"
              >
                <X size={14} />
              </span>
            </span>
          ))}
          {rest > 0 ? <span className="px-1 text-ink-muted">+{rest}</span> : null}
        </span>
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
            onPick={(i) => toggle(options[i].value)}
          />
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}
