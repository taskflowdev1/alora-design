import * as React from "react";
import { Filter } from "react-feather";
import { cn } from "@/lib/ad";
import { useMediaQuery } from "@/lib/ad-hooks";
import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { Chip, ChipGroup } from "@/components/ui/status";
import { CountBadge } from "@/components/mobile/mobile-badge";
import { MobileLayer, MobileSheet } from "@/components/mobile/mobile-sheet";

/** Inside the phone sheet, options take the 44 px touch height. */
const InSheet = React.createContext(false);
const useChipClass = () => (React.useContext(InSheet) ? "h-touch px-3.5 text-[15px]" : undefined);

export interface FilterButtonProps {
  /** How many filters differ from their defaults. Shown on the button; 0 hides it and turns Clear off. */
  count?: number;
  /** Puts every filter back to its default. */
  onClear?: () => void;
  /** FilterGroup, FilterPick and FilterChecks. */
  children: React.ReactNode;
  label?: string;
  /** The sheet's closing button: name what it shows ("Show 23 orders"). */
  done?: string;
  className?: string;
}

/**
 * The one Filter button of a page: shop, period, status and the rest live inside it. A popover on desktop, a bottom
 * sheet on a phone (or inside a PhoneFrame). Filters apply as they change. The count rides on the corner, so the button
 * keeps its width and the row beside it never moves.
 */
export function FilterButton({ count = 0, onClear, children, label = "Filter", done = "Done", className }: FilterButtonProps) {
  const framed = !!React.useContext(MobileLayer);
  const narrow = useMediaQuery("(max-width: 767.98px)");
  const [open, setOpen] = React.useState(false);
  const name = count ? `${label}, ${count} set` : label;
  if (framed || narrow) {
    return (
      <>
        <Button variant="ghost" icon data-filter-button aria-label={name} aria-haspopup="dialog" className={cn("relative size-touch", className)} onClick={() => setOpen(true)}>
          <Filter />
          <CountBadge count={count} className="absolute right-0.5 top-0.5" />
        </Button>
        <MobileSheet
          open={open}
          onOpenChange={setOpen}
          title={label}
          footer={
            <div className="flex gap-2 [&>button]:h-touch [&>button]:flex-1 [&>button]:text-[15px]">
              <Button variant="ghost" disabled={!count} onClick={onClear}>
                Clear
              </Button>
              <Button onClick={() => setOpen(false)}>{done}</Button>
            </div>
          }
        >
          <InSheet.Provider value={true}>
            <div className="grid gap-4 pb-1">{children}</div>
          </InSheet.Provider>
        </MobileSheet>
      </>
    );
  }
  return (
    <Popover
      align="end"
      className="w-[340px] max-w-[calc(100vw-16px)]"
      onOpenAutoFocus={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement | null)?.focus();
      }}
      trigger={
        <Button data-filter-button aria-label={name} className={cn("relative", className)}>
          <Filter />
          {label}
          <CountBadge count={count} className="absolute -right-2 -top-2" />
        </Button>
      }
    >
      <div className="grid gap-4 p-1">
        {children}
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" disabled={!count} onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>
    </Popover>
  );
}

/** One titled filter inside a FilterButton. */
export function FilterGroup({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div role="group" aria-label={label} className={cn("grid min-w-0 gap-1.5", className)}>
      <span className="text-small text-ink-muted">{label}</span>
      {children}
    </div>
  );
}

export interface FilterOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
}

export interface FilterPickProps<T extends string> {
  label: string;
  value: T;
  onValueChange: (value: T) => void;
  options: FilterOption<T>[];
}

/** One of a few (a period, a stock level): chips with one pill that slides to the choice. */
export function FilterPick<T extends string>({ label, value, onValueChange, options }: FilterPickProps<T>) {
  const chip = useChipClass();
  return (
    <FilterGroup label={label}>
      <ChipGroup aria-label={label}>
        {options.map((o) => (
          <Chip key={o.value} selected={o.value === value} className={chip} onClick={() => onValueChange(o.value)}>
            {o.label}
          </Chip>
        ))}
      </ChipGroup>
    </FilterGroup>
  );
}

export interface FilterChecksProps<T extends string> {
  label: string;
  /** The chosen values. Empty means all of them, which is the default. */
  value: T[];
  onValueChange: (value: T[]) => void;
  options: FilterOption<T>[];
  /** One-tap sets, after All ("All Shopee"). */
  presets?: { label: React.ReactNode; value: T[] }[];
  allLabel?: string;
}

/** Any of several (shops, statuses): All, then a chip per option. Choosing every option reads as All again. */
export function FilterChecks<T extends string>({ label, value, onValueChange, options, presets, allLabel = "All" }: FilterChecksProps<T>) {
  const chip = useChipClass();
  const same = (a: T[], b: T[]) => a.length === b.length && a.every((v) => b.includes(v));
  const toggle = (v: T) => {
    const next = value.includes(v) ? value.filter((x) => x !== v) : [...value, v];
    onValueChange(next.length === options.length ? [] : next);
  };
  return (
    <FilterGroup label={label}>
      <div className="flex flex-wrap gap-1">
        <Chip selected={!value.length} className={chip} onClick={() => onValueChange([])}>
          {allLabel}
        </Chip>
        {presets?.map((p, i) => (
          <Chip key={i} selected={same(value, p.value)} className={chip} onClick={() => onValueChange(same(value, p.value) ? [] : p.value)}>
            {p.label}
          </Chip>
        ))}
        {options.map((o) => (
          <Chip key={o.value} selected={value.includes(o.value)} className={chip} onClick={() => toggle(o.value)}>
            {o.label}
          </Chip>
        ))}
      </div>
    </FilterGroup>
  );
}
