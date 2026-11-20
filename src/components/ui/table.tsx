import * as React from "react";
import { cn } from "@/lib/ad";
import { Pagination } from "@/components/ui/pagination";

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

/** Bottom bar for long tables: the count on the left, the pager on the right, 50 per page. The one Pagination, compact. */
export function TableBar({ page, total, pageSize = 50, onPageChange, className }: PagerProps) {
  return (
    <Pagination
      page={page}
      pageCount={Math.max(1, Math.ceil(total / pageSize))}
      onPageChange={onPageChange}
      total={total}
      pageSize={pageSize}
      numbers={false}
      className={cn("min-h-control px-3", className)}
    />
  );
}
