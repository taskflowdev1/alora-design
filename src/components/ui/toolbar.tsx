import * as React from "react";
import { MoreHorizontal, Search as SearchIcon, X } from "react-feather";
import { cn, prefersReducedMotion } from "@/lib/ad";
import { useMediaQuery } from "@/lib/ad-hooks";
import { Button } from "@/components/ui/button";
import { Menu } from "@/components/ui/menu";
import { PopoverGroup } from "@/components/ui/popover";
import { Search } from "@/components/ui/search";

/** Every control in a toolbar shares one height and one centre line. Popovers in it never stack. */
export function Toolbar({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <PopoverGroup>
      <div role="toolbar" className={cn("flex min-h-control flex-wrap items-center gap-gap", className)}>
        {children}
      </div>
    </PopoverGroup>
  );
}

export function ToolbarSpacer() {
  return <span aria-hidden className="flex-1" />;
}

/**
 * The same header on every page: one title, then at most one PageSearch, one FilterButton, a MoreMenu and one primary
 * action, on one row. While a phone's search is open it takes the whole row.
 */
export function PageHeader({ title, children, className }: { title: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative flex min-h-control flex-wrap items-center gap-gap max-md:min-h-touch max-md:gap-0.5 [&:has([data-page-search])>*:not([data-search-slot],[data-mobile-fab])]:invisible", className)}>
      <h1 className="mr-auto min-w-0 truncate text-heading font-semibold text-ink">{title}</h1>
      {children}
    </div>
  );
}

export interface PageSearchProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

/** The page's one search: a field from md up; on a phone an icon that opens a field over the header row. */
export function PageSearch({ value, onValueChange, placeholder = "Search" }: PageSearchProps) {
  const phone = useMediaQuery("(max-width: 767.98px)");
  const [opened, setOpened] = React.useState(false);
  const open = opened || !!value;
  const bar = React.useRef<HTMLDivElement>(null);
  const slot = React.useRef<HTMLSpanElement>(null);
  React.useLayoutEffect(() => {
    if (!opened || !bar.current) return;
    bar.current.querySelector("input")?.focus();
    if (prefersReducedMotion()) return;
    // Grows out of the icon at the right end of the row.
    bar.current.animate([{ clipPath: "inset(0 0 0 calc(100% - 96px))", opacity: 0.4 }, { clipPath: "inset(0 0 0 0)", opacity: 1 }], { duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
  }, [opened]);
  if (!phone) return <Search value={value} onValueChange={onValueChange} placeholder={placeholder} aria-label={placeholder} wrapperClassName="w-56" />;
  const close = () => {
    onValueChange("");
    setOpened(false);
    // The icon comes back on the next frame; focus goes home with it.
    requestAnimationFrame(() => slot.current?.querySelector("button")?.focus());
  };
  return (
    <span ref={slot} data-search-slot className="contents">
      {open ? (
        <div ref={bar} data-page-search className="absolute inset-0 z-10 flex items-center gap-0.5">
          <Search value={value} onValueChange={onValueChange} placeholder={placeholder} aria-label={placeholder} wrapperClassName="h-touch w-auto min-w-0 flex-1" onBlur={() => !value && setOpened(false)} />
          {/* Pressed before the field blurs, so the close isn't lost to the blur that hides this row. */}
          <Button variant="ghost" icon aria-label="Close search" className="size-touch" onPointerDown={(e) => e.preventDefault()} onClick={close}>
            <X />
          </Button>
        </div>
      ) : (
        <Button variant="ghost" icon aria-label="Search" className="size-touch" onClick={() => setOpened(true)}>
          <SearchIcon />
        </Button>
      )}
    </span>
  );
}

/** Everything that isn't the page's one primary action: Export, Columns, Print… behind one ⋯ button. */
export function MoreMenu({ children, label = "More actions" }: { children: React.ReactNode; label?: string }) {
  const phone = useMediaQuery("(max-width: 767.98px)");
  return (
    <Menu
      align="end"
      trigger={
        <Button variant={phone ? "ghost" : "secondary"} icon aria-label={label} className={phone ? "size-touch" : undefined}>
          <MoreHorizontal />
        </Button>
      }
    >
      {children}
    </Menu>
  );
}
