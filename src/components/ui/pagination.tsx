import { ChevronLeft, ChevronRight } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";

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
 * The bottom bar of any table longer than a page: the count on the left, pages on the right. The current page is a
 * grey pill (fill-strong) in ink; the others are ghost buttons at the same size; arrows say where they go.
 */
export function Pagination({ page, pageCount, onPageChange, total, pageSize = 50, numbers = true, className }: PaginationProps) {
  const go = (p: number) => onPageChange(Math.min(pageCount, Math.max(1, p)));
  const from = (page - 1) * pageSize + 1;
  const to = total != null ? Math.min(total, page * pageSize) : 0;
  return (
    <nav aria-label="Pages" className={cn("flex min-w-0 items-center justify-between gap-3", className)}>
      {total != null ? (
        <span className="truncate text-body tabular-nums text-ink-muted">
          {from.toLocaleString("id-ID")}–{to.toLocaleString("id-ID")} of {total.toLocaleString("id-ID")}
        </span>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="sm" icon aria-label={`Page ${page - 1}`} disabled={page <= 1} onClick={() => go(page - 1)}>
          <ChevronLeft />
        </Button>
        {numbers
          ? pageList(page, pageCount).map((n, i) =>
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
                    "grid h-item min-w-[var(--ad-item-h)] cursor-pointer place-items-center rounded-control px-1.5 text-body tabular-nums transition-[background-color,transform] duration-[160ms] ease-ad active:scale-95",
                    n === page ? "bg-fill-strong text-ink" : "text-ink-muted hover:bg-fill hover:text-ink",
                  )}
                >
                  {n}
                </button>
              ),
            )
          : (
            <span className="px-2 text-body tabular-nums text-ink-muted">
              {page} / {pageCount}
            </span>
          )}
        <Button variant="ghost" size="sm" icon aria-label={`Page ${page + 1}`} disabled={page >= pageCount} onClick={() => go(page + 1)}>
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
