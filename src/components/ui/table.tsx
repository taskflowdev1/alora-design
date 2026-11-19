import * as React from "react";
import { ChevronLeft, ChevronRight } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

/*
 * Dense table. No row lines: rows separate by spacing and a soft hover fill.
 * The header is sticky on a solid background and never overlaps a row.
 * Columns size to their data; cells stay on one line and truncate.
 * Put it in <Card inset="nest"> so the row highlight is concentric with the card.
 */

export function Table({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative min-h-0 overflow-auto", className)} {...props}>
      <table className="w-max min-w-full border-separate border-spacing-0 text-body">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="sticky top-0 z-10 bg-surface">{children}</thead>;
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export interface TRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  /** Whole-row click; no per-cell actions. */
  onActivate?: () => void;
}

export function TRow({ selected, onActivate, className, ...props }: TRowProps) {
  return (
    <tr
      tabIndex={onActivate ? 0 : undefined}
      aria-selected={onActivate ? !!selected : undefined}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (onActivate && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onActivate();
        }
      }}
      className={cn(
        "group/row h-row [&>td:first-child]:rounded-l-item [&>td:last-child]:rounded-r-item",
        onActivate && "cursor-pointer",
        selected ? "[&>td]:bg-fill-strong" : "hover:[&>td]:bg-fill focus-visible:[&>td]:bg-fill",
        className,
      )}
      {...props}
    />
  );
}

type Align = "left" | "right" | "center";

export function TH({ align = "left", className, children, width }: { align?: Align; className?: string; children?: React.ReactNode; width?: number | string }) {
  return (
    <th
      scope="col"
      style={width ? { width, minWidth: width } : undefined}
      className={cn("h-row whitespace-nowrap px-3 font-normal text-ink-muted", align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left", className)}
    >
      {children}
    </th>
  );
}

export function TD({
  align = "left",
  className,
  children,
  maxWidth,
}: {
  align?: Align;
  className?: string;
  children?: React.ReactNode;
  /** Long text truncates at this width. */
  maxWidth?: number;
}) {
  return (
    <td className={cn("whitespace-nowrap px-3 text-ink", align === "right" ? "text-right tabular-nums" : align === "center" ? "text-center" : "text-left", className)}>
      {maxWidth ? (
        <span className="block truncate" style={{ maxWidth }}>
          {children}
        </span>
      ) : (
        children
      )}
    </td>
  );
}

export interface PagerProps {
  page: number;
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Bottom bar for long tables: the count on the left, the pager on the right, 50 per page. */
export function TableBar({ page, total, pageSize = 50, onPageChange, className }: PagerProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);
  const fmt = (n: number) => n.toLocaleString("id-ID");
  return (
    <div className={cn("flex min-h-control items-center justify-between gap-3 px-3 text-body", className)}>
      <span className="tabular-nums text-ink-muted">
        {fmt(from)}–{fmt(to)} of {fmt(total)}
      </span>
      <div className="flex items-center gap-1">
        <Tooltip content={page > 1 ? `Page ${page - 1}` : "First page"}>
          <span>
            <Button variant="ghost" size="sm" icon aria-label={`Previous page, ${page - 1}`} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft />
            </Button>
          </span>
        </Tooltip>
        <span className="min-w-16 text-center tabular-nums text-ink">
          {page} / {pages}
        </span>
        <Tooltip content={page < pages ? `Page ${page + 1}` : "Last page"}>
          <span>
            <Button variant="ghost" size="sm" icon aria-label={`Next page, ${page + 1}`} disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
              <ChevronRight />
            </Button>
          </span>
        </Tooltip>
      </div>
    </div>
  );
}
