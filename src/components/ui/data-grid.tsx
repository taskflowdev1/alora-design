import * as React from "react";
import { cn } from "@/lib/ad";

/*
 * Wide, spreadsheet-like table (payroll registers, recaps). Same taste as Table: no row or column lines,
 * dense rows, soft hover fill, sticky header. On top of Table it adds:
 * - pinned first columns that stay put while the rest scrolls sideways;
 * - column widths people can drag (double-click a handle to reset);
 * - a totals row that sticks to the bottom;
 * - cell tones with their legend in a row above (a soft tint, never a loud fill);
 * - a soft fade on the side that still has more columns.
 * Pair with <ColumnMenu> to choose columns and <TableBar> to page. Put it in <Card inset="nest">.
 */

export type GridTone = "brand" | "success" | "danger" | "muted";
type Align = "left" | "right" | "center";

export interface GridColumn<R> {
  key: string;
  label: string;
  /** Starting width in px. Default 120. */
  width?: number;
  minWidth?: number;
  align?: Align;
  /** Stays on the left while the grid scrolls sideways. Pinned columns come first. */
  pin?: boolean;
  /** Cell content. Defaults to row[key]. */
  render?: (row: R) => React.ReactNode;
  /** A soft tint on the cell; explain each tone in `legend`. */
  tone?: (row: R) => GridTone | undefined;
  /** Content of this column in the totals row. */
  total?: (rows: R[]) => React.ReactNode;
}

export interface DataGridProps<R> {
  columns: GridColumn<R>[];
  rows: R[];
  rowKey: (row: R) => string;
  /** Keys to show (e.g. from <ColumnMenu>). Pinned columns always show. Default: all. */
  visible?: string[];
  /** Whole-row click opens the detail pane; no per-cell actions. */
  onRowActivate?: (row: R) => void;
  selectedKey?: string;
  /** What each tone means, shown in a row above the grid. */
  legend?: { tone: GridTone; label: string }[];
  /** Label in the first cell of the totals row. Shown when any column has `total`. */
  totalLabel?: string;
  /** Scroll area height, e.g. "calc(100dvh - 240px)". */
  maxHeight?: number | string;
  empty?: React.ReactNode;
  className?: string;
}

const TONE: Record<GridTone, string> = {
  brand: "bg-brand-soft text-brand-soft-ink",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  muted: "bg-fill-strong text-ink-muted",
};
const DOT: Record<GridTone, string> = { brand: "bg-brand", success: "bg-success", danger: "bg-danger", muted: "bg-ink-faint" };
const ALIGN: Record<Align, string> = { left: "text-left", right: "text-right tabular-nums", center: "text-center" };
// Cells are opaque (bg-surface) so pinned columns hide what scrolls under them; the fill greys are
// opaque too, so hover and selection simply swap the cell background.

export function GridLegend({ items, className }: { items: { tone: GridTone; label: string }[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 px-3 text-small text-ink-muted", className)}>
      {items.map((i) => (
        <span key={i.tone + i.label} className="inline-flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", DOT[i.tone])} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

export function DataGrid<R>({
  columns,
  rows,
  rowKey,
  visible,
  onRowActivate,
  selectedKey,
  legend,
  totalLabel = "Total",
  maxHeight,
  empty = "Nothing here yet",
  className,
}: DataGridProps<R>) {
  const cols = React.useMemo(() => {
    const shown = columns.filter((c) => c.pin || !visible || visible.includes(c.key));
    return [...shown.filter((c) => c.pin), ...shown.filter((c) => !c.pin)];
  }, [columns, visible]);

  const [widths, setWidths] = React.useState<Record<string, number>>({});
  const widthOf = (c: GridColumn<R>) => widths[c.key] ?? c.width ?? 120;

  const scroller = React.useRef<HTMLDivElement>(null);
  const [edges, setEdges] = React.useState({ left: false, right: false, room: 0 });
  const measure = React.useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const left = el.scrollLeft > 1;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    const room = el.clientWidth;
    setEdges((e) => (e.left === left && e.right === right && e.room === room ? e : { left, right, room }));
  }, []);

  // Pinned columns may use at most about half the visible width (phones); the rest scroll normally.
  // Left offset of each pinned column = sum of the pinned widths before it.
  const offsets: Record<string, number> = {};
  let acc = 0;
  for (const c of cols) {
    if (!c.pin) continue;
    if (edges.room && acc > 0 && acc + widthOf(c) > edges.room * 0.55) break;
    offsets[c.key] = acc;
    acc += widthOf(c);
  }
  const pinned = (c: GridColumn<R>) => c.key in offsets;
  const lastPin = [...cols].reverse().find(pinned)?.key;
  React.useEffect(() => {
    measure();
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [measure, cols.length]);

  const startResize = (e: React.PointerEvent, c: GridColumn<R>) => {
    e.preventDefault();
    e.stopPropagation();
    const x0 = e.clientX;
    const w0 = widthOf(c);
    const min = c.minWidth ?? 64;
    const move = (ev: PointerEvent) => setWidths((w) => ({ ...w, [c.key]: Math.max(min, Math.min(640, w0 + ev.clientX - x0)) }));
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const resetWidth = (c: GridColumn<R>) => setWidths(({ [c.key]: _drop, ...rest }) => rest);

  const pinStyle = (c: GridColumn<R>): React.CSSProperties | undefined => (pinned(c) ? { left: offsets[c.key] } : undefined);
  const pinClass = (c: GridColumn<R>) =>
    cn(pinned(c) && "sticky z-[1]", c.key === lastPin && edges.left && "after:pointer-events-none after:absolute after:inset-y-0 after:-right-2.5 after:w-2.5 after:bg-gradient-to-r after:from-black/10 after:to-transparent after:content-[''] dark:after:from-black/40");
  const hasTotals = cols.some((c) => c.total);
  const tableWidth = cols.reduce((s, c) => s + widthOf(c), 0);

  return (
    <div className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2", className)}>
      {legend && legend.length > 0 && <GridLegend items={legend} />}
      <div className="relative min-h-0 min-w-0">
        <div ref={scroller} onScroll={measure} className="relative overflow-auto" style={{ maxHeight }}>
          <table className="table-fixed border-separate border-spacing-0 text-body" style={{ width: tableWidth }}>
            <colgroup>
              {cols.map((c) => <col key={c.key} style={{ width: widthOf(c) }} />)}
            </colgroup>
            <thead className="sticky top-0 z-[2]">
              <tr className="h-row">
                {cols.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    style={pinStyle(c)}
                    className={cn("group/th relative bg-surface px-3 font-normal text-ink-muted", ALIGN[c.align ?? "left"], pinClass(c), pinned(c) && "z-[3]")}
                  >
                    <span className="block truncate">{c.label}</span>
                    <span
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Resize ${c.label}`}
                      title="Drag to resize, double-click to reset"
                      onPointerDown={(e) => startResize(e, c)}
                      onDoubleClick={() => resetWidth(c)}
                      className="absolute inset-y-1.5 -right-1 z-[1] flex w-2 cursor-col-resize justify-center"
                    >
                      <span className="w-0.5 rounded-full bg-transparent transition-colors duration-[160ms] group-hover/th:bg-fill-strong hover:!bg-ink-faint" />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={cols.length} className="h-24 px-3 text-ink-muted">{empty}</td>
                </tr>
              )}
              {rows.map((r) => {
                const k = rowKey(r);
                const selected = selectedKey === k;
                return (
                  <tr
                    key={k}
                    tabIndex={onRowActivate ? 0 : undefined}
                    aria-selected={onRowActivate ? selected : undefined}
                    onClick={onRowActivate ? () => onRowActivate(r) : undefined}
                    onKeyDown={(e) => {
                      if (onRowActivate && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onRowActivate(r); }
                    }}
                    className={cn(
                      "group/row h-row outline-none [&>td:first-child]:rounded-l-item [&>td:last-child]:rounded-r-item",
                      onRowActivate && "cursor-pointer",
                      "[&>td]:transition-colors [&>td]:duration-[160ms]",
                      selected ? "[&>td]:bg-fill-hover" : "hover:[&>td]:bg-fill focus-visible:[&>td]:bg-fill",
                    )}
                  >
                    {cols.map((c) => {
                      const tone = c.tone?.(r);
                      const content = c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? "");
                      return (
                        <td
                          key={c.key}
                          style={pinStyle(c)}
                          className={cn("whitespace-nowrap bg-surface px-3 text-ink", ALIGN[c.align ?? "left"], pinClass(c))}
                        >
                          {tone ? (
                            <span className={cn("-mx-1.5 inline-block max-w-[calc(100%+12px)] truncate rounded-item px-1.5 align-middle leading-6", TONE[tone])}>{content}</span>
                          ) : (
                            <span className="block truncate">{content}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            {hasTotals && rows.length > 0 && (
              <tfoot className="sticky bottom-0 z-[2]">
                <tr className="h-row font-semibold">
                  {cols.map((c, i) => (
                    <td
                      key={c.key}
                      style={pinStyle(c)}
                      className={cn("whitespace-nowrap bg-surface px-3 text-ink", ALIGN[c.align ?? "left"], pinClass(c), pinned(c) && "z-[3]")}
                    >
                      <span className="block truncate">{c.total ? c.total(rows) : i === 0 ? totalLabel : null}</span>
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-surface to-transparent transition-opacity duration-[160ms]",
            edges.right ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
    </div>
  );
}
