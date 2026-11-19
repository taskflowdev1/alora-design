import * as React from "react";
import { ChevronRight, MoreHorizontal } from "react-feather";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/ad";

export interface Crumb {
  label: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  items: Crumb[];
  /** Past this many, the middle collapses into "…" (the first and the last two stay). */
  max?: number;
  className?: string;
}

/**
 * Where you are: earlier levels are muted links with the hover fill, the current page is ink and not a link.
 * Feather chevrons between, never slashes; long paths collapse in the middle; labels truncate instead of wrapping.
 */
export function Breadcrumb({ items, max = 4, className }: BreadcrumbProps) {
  const collapsed = items.length > max;
  const shown: (Crumb | "more")[] = collapsed ? [items[0], "more", ...items.slice(-2)] : items;
  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 items-center gap-0.5 text-body">
        {shown.map((c, i) => {
          const last = i === shown.length - 1;
          return (
            <li key={i} className={cn("flex min-w-0 items-center gap-0.5", last ? "shrink" : "shrink-0")}>
              {c === "more" ? (
                <Tooltip content={items.slice(1, -2).map((x) => String(x.label)).join(" / ")}>
                  <span tabIndex={0} aria-label={items.slice(1, -2).map((x) => String(x.label)).join(" / ")} className="grid h-7 w-7 place-items-center text-ink-muted">
                    <MoreHorizontal size={16} />
                  </span>
                </Tooltip>
              ) : last ? (
                <span aria-current="page" className="truncate px-1.5 font-medium text-ink">
                  {c.label}
                </span>
              ) : (
                <a
                  href={c.href}
                  onClick={(e) => {
                    if (c.onClick) {
            e.preventDefault();
            c.onClick();
          }
                  }}
                  className="block max-w-40 cursor-pointer truncate rounded-small px-1.5 py-0.5 text-ink-muted transition-colors duration-[160ms] ease-ad hover:bg-fill focus-visible:bg-fill hover:text-ink focus-visible:text-ink"
                >
                  {c.label}
                </a>
              )}
              {!last ? <ChevronRight size={14} aria-hidden className="shrink-0 text-ink-muted" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
