import { ChevronLeft, ChevronRight } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { SlidingPill } from "@/components/ui/sliding-pill";
import { Tooltip } from "@/components/ui/tooltip";

export interface PaginationProps {
  /** 1-based. */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Total rows and page size: shows "51–100 of 1.284" on the left (the standard table bar). */
  total?: number;
  pageSize?: number;
  /** Page numbers between the arrows (off = arrows only, for tight spots and phones). */
  numbers?: boolean;
  className?: string;
}

/** 1 … 4 5 6 … 20: first, last, and the current page with its neighbours. */
export function pageList(page: number, count: number): (number | "gap")[] {
  const set = new Set([1, count, page - 1, page, page + 1].filter((n) => n >= 1 && n <= count));
  const sorted = [...set].sort((a, b) => a - b);
  return sorted.flatMap((n, i) => (i && n - sorted[i - 1] > 1 ? (["gap", n] as const) : [n]));
}

/**
 * The one bottom bar of any table longer than a page: the count on the left, pages on the right. The current page is a
 * grey pill (fill-strong) in ink that slides to the new page; the others are ghost buttons at the same size. The arrows
 * say where they go in a tooltip, disabled ones included ("First page", "Last page"). `numbers={false}` shows "4 / 26"
 * between the arrows instead (TableBar, tight spots). On phones the count hides when page numbers show.
 */
export function Pagination({ page, pageCount, onPageChange, total, pageSize = 50, numbers = true, className }: PaginationProps) {
  const go = (p: number) => onPageChange(Math.min(pageCount, Math.max(1, p)));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = total != null ? Math.min(total, page * pageSize) : 0;
  const fmt = (n: number) => n.toLocaleString("id-ID");
  const arrow = (dir: -1 | 1) => {
    const target = page + dir;
    const can = dir < 0 ? page > 1 : page < pageCount;
    return (
      <Tooltip content={can ? `Page ${target}` : dir < 0 ? "First page" : "Last page"}>
        {/* A disabled button gets no pointer events, so the tooltip hangs on this wrapper. */}
        <span className="inline-flex">
          <Button variant="ghost" size="sm" icon aria-label={dir < 0 ? `Previous page${can ? `, ${target}` : ""}` : `Next page${can ? `, ${target}` : ""}`} disabled={!can} onClick={() => go(target)}>
            {dir < 0 ? <ChevronLeft /> : <ChevronRight />}
          </Button>
        </span>
      </Tooltip>
    );
  };
  return (
    <nav aria-label="Pages" className={cn("flex min-w-0 items-center justify-between gap-3", className)}>
      {total != null ? (
        <span className={cn("truncate text-body tabular-nums text-ink-muted", numbers && "max-sm:hidden")}>
          {fmt(from)}–{fmt(to)} of {fmt(total)}
        </span>
      ) : (
        <span />
      )}
      <div className={cn("relative flex items-center", numbers ? "gap-0.5" : "gap-1")}>
        {numbers ? <SlidingPill selector='[aria-current="page"]' className="rounded-control bg-fill-strong" /> : null}
        {arrow(-1)}
        {numbers ? (
          pageList(page, pageCount).map((n, i) =>
            n === "gap" ? (
              <span key={`g${i}`} aria-hidden className="grid h-item w-6 place-items-center text-body text-ink-muted">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                aria-current={n === page ? "page" : undefined}
                onClick={() => go(n)}
                className={cn(
                  "relative grid h-item min-w-[var(--ad-item-h)] cursor-pointer place-items-center rounded-control px-1.5 text-body tabular-nums transition-[background-color,transform] duration-[150ms] ease-ad active:scale-[0.97]",
                  n === page ? "text-ink" : "text-ink-muted hover:bg-fill focus-visible:bg-fill hover:text-ink focus-visible:text-ink",
                )}
              >
                {n}
              </button>
            ),
          )
        ) : (
          <span className="min-w-16 text-center text-body tabular-nums text-ink">
            {page} / {pageCount}
          </span>
        )}
        {arrow(1)}
      </div>
    </nav>
  );
}
