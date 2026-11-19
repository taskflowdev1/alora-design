import * as React from "react";
import { Popover as P } from "radix-ui";
import { ChevronDown, Search } from "react-feather";
import { cn } from "@/lib/ad";
import { OptionList, dropdownSurface, triggerClass, useListNav, type Option } from "@/components/ui/select";

export interface ComboboxProps {
  value: string | null;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  empty?: string;
  className?: string;
  "aria-label"?: string;
}

/** A dropdown with a search field on top, for long lists. */
export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = "Select",
  searchPlaceholder = "Search",
  empty = "No match",
  className,
  ...aria
}: ComboboxProps) {
  const id = React.useId();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);
  const pick = (i: number) => {
    const o = filtered[i];
    if (!o) return;
    onValueChange(o.value);
    setOpen(false);
  };
  const nav = useListNav(filtered, pick);
  const current = options.find((o) => o.value === value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <P.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setQuery("");
          nav.setActive(Math.max(0, options.findIndex((x) => x.value === value)));
        }
      }}
    >
      <P.Trigger aria-haspopup="listbox" aria-label={aria["aria-label"]} className={cn(triggerClass, className)}>
        {current ? (
          <>
            {current.icon ? <span className="flex shrink-0 items-center text-ink-muted">{current.icon}</span> : null}
            <span className="min-w-0 truncate">{current.label}</span>
          </>
        ) : (
          <span className="truncate text-ink-muted">{placeholder}</span>
        )}
        <ChevronDown size={16} className="ml-auto shrink-0 text-ink-muted" />
      </P.Trigger>
      <P.Portal>
        <P.Content
          align="start"
          sideOffset={6}
          collisionPadding={8}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            // Desktop only: on a phone the keyboard would cover the list (tap the field to type).
            if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
          }}
          className={cn(dropdownSurface, "w-[max(240px,var(--radix-popover-trigger-width))]")}
        >
          <label className="mb-1 flex h-item items-center gap-2 rounded-control bg-fill px-2.5 focus-within:bg-fill-strong">
            <Search size={16} className="shrink-0 text-ink-muted" />
            <input
              ref={inputRef}
              role="combobox"
              aria-expanded
              aria-controls={`${id}-list`}
              aria-activedescendant={filtered.length ? `${id}-opt-${nav.active}` : undefined}
              value={query}
              placeholder={searchPlaceholder}
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
              onChange={(e) => {
                setQuery(e.target.value);
                nav.setActive(0);
              }}
              onKeyDown={(e) => nav.onKeyDown(e, false)}
              className="h-full w-full min-w-0 bg-transparent text-body text-ink outline-none placeholder:text-ink-muted [&::-webkit-search-cancel-button]:hidden"
            />
          </label>
          <div className="max-h-[min(280px,calc(var(--radix-popover-content-available-height)-48px))] overflow-auto">
            <OptionList
              id={id}
              options={filtered}
              active={nav.active}
              setActive={nav.setActive}
              isSelected={(v) => v === value}
              onPick={pick}
              empty={empty}
            />
          </div>
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}
