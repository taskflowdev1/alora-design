import * as React from "react";
import { ArrowDown, ArrowUp, Search as SearchIcon } from "react-feather";
import { cn } from "@/lib/ad";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnMenu } from "@/components/ui/column-menu";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, TBody, TD, TH, THead, TRow } from "@/components/ui/table";

export interface DataColumn<T> {
  key: string;
  header: string;
  /** Cell content; defaults to the row's value at `key`. */
  cell?: (row: T) => React.ReactNode;
  /** Value for sorting and search; defaults to the row's value at `key`. */
  value?: (row: T) => string | number;
  align?: "left" | "right";
  sortable?: boolean;
  /** Always shown (the row's name, money-check columns). */
  locked?: boolean;
  /** Hidden until turned on in the column menu. */
  hidden?: boolean;
  /** Long text truncates at this width. */
  maxWidth?: number;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: DataColumn<T>[];
  rowKey: (row: T) => string;
  /** Checkbox column; the selection is yours to hold. */
  selected?: string[];
  onSelectedChange?: (keys: string[]) => void;
  /** Whole-row click (opens the side pane). */
  onRowClick?: (row: T) => void;
  /** Rows per page; the standard bar shows the count and pages. */
  pageSize?: number;
  /** A search box over every column's value. */
  search?: boolean;
  /** Extra toolbar controls (filters), left of the column menu. */
  toolbar?: React.ReactNode;
  /** Header and body with the same boxes, pulsing (filters swap rows for this, never a spinner). */
  loading?: boolean;
  className?: string;
}

const pulse = "animate-[ad-pulse_1.6s_ease-in-out_infinite] rounded-small bg-fill text-transparent";

/**
 * The full table: search, filters and the column menu in one row of equal-height controls; sortable headers; a
 * checkbox column; whole-row click; the standard bottom bar (count + pages, 50 a page). Built on Table, so rows have
 * no lines, the header is sticky, cells stay on one line and money columns are tabular.
 */
export function DataTable<T>({ rows, columns, rowKey, selected, onSelectedChange, onRowClick, pageSize = 50, search = true, toolbar, loading, className }: DataTableProps<T>) {
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = React.useState(1);
  const [visible, setVisible] = React.useState(() => columns.filter((c) => !c.hidden).map((c) => c.key));
  const valueOf = (c: DataColumn<T>, r: T) => (c.value ? c.value(r) : ((r as Record<string, unknown>)[c.key] as string | number));
  const shown = columns.filter((c) => c.locked || visible.includes(c.key));
  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = needle ? rows.filter((r) => columns.some((c) => String(valueOf(c, r) ?? "").toLowerCase().includes(needle))) : rows;
    if (sort) {
      const c = columns.find((x) => x.key === sort.key);
      if (c) out = [...out].sort((a, b) => (valueOf(c, a) > valueOf(c, b) ? 1 : valueOf(c, a) < valueOf(c, b) ? -1 : 0) * sort.dir);
    }
    return out;
  }, [rows, columns, q, sort]); // eslint-disable-line react-hooks/exhaustive-deps
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const slice = filtered.slice((current - 1) * pageSize, current * pageSize);
  const sel = selected ?? [];
  const keys = slice.map(rowKey);
  const allOn = keys.length > 0 && keys.every((k) => sel.includes(k));
  const someOn = keys.some((k) => sel.includes(k));
  const toggle = (k: string) => onSelectedChange?.(sel.includes(k) ? sel.filter((x) => x !== k) : [...sel, k]);

  return (
    <div className={cn("grid min-w-0 grid-cols-1 gap-2", className)}>
      {search || toolbar || columns.length > 2 ? (
        <div className="flex min-w-0 flex-wrap items-center gap-gap px-1">
          {search ? (
            <Input
              icon={SearchIcon}
              aria-label="Search rows"
              placeholder="Search"
              value={q}
              onChange={(e) => (setQ(e.target.value), setPage(1))}
              wrapperClassName="w-full sm:w-56"
            />
          ) : null}
          {toolbar}
          <ColumnMenu className="ml-auto" columns={columns.map((c) => ({ key: c.key, label: c.header, locked: c.locked }))} visible={visible} onVisibleChange={setVisible} defaults={columns.filter((c) => !c.hidden).map((c) => c.key)} />
        </div>
      ) : null}
      <Table>
        <THead>
          <tr>
            {onSelectedChange ? (
              <TH width={36} className="pl-3 pr-0">
                <Checkbox aria-label="Select page" checked={allOn ? true : someOn ? "indeterminate" : false} onCheckedChange={() => onSelectedChange(allOn ? sel.filter((k) => !keys.includes(k)) : [...new Set([...sel, ...keys])])} />
              </TH>
            ) : null}
            {shown.map((c) => (
              <TH key={c.key} align={c.align}>
                {c.sortable ? (
                  <button
                    type="button"
                    onClick={() => setSort((s) => (s?.key !== c.key ? { key: c.key, dir: 1 } : s.dir === 1 ? { key: c.key, dir: -1 } : null))}
                    aria-sort={sort?.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : undefined}
                    className={cn("-mx-1.5 inline-flex cursor-pointer items-center gap-1 rounded-small px-1.5 py-0.5 transition-colors duration-[160ms] hover:bg-fill hover:text-ink", sort?.key === c.key && "text-ink", c.align === "right" && "flex-row-reverse")}
                  >
                    {c.header}
                    {sort?.key === c.key ? sort.dir === 1 ? <ArrowUp size={14} /> : <ArrowDown size={14} /> : <span className="w-3.5" />}
                  </button>
                ) : (
                  c.header
                )}
              </TH>
            ))}
          </tr>
        </THead>
        <TBody>
          {loading
            ? Array.from({ length: Math.min(pageSize, 6) }, (_, i) => (
                <tr key={i} className="h-row">
                  {onSelectedChange ? <TD className="pl-3 pr-0"><span className={cn(pulse, "block size-[18px]")} /></TD> : null}
                  {shown.map((c) => (
                    <TD key={c.key} align={c.align}>
                      <span className={pulse}>{"0000000000".slice(0, 6 + ((i + c.key.length) % 5))}</span>
                    </TD>
                  ))}
                </tr>
              ))
            : slice.map((r) => {
                const k = rowKey(r);
                return (
                  <TRow key={k} selected={sel.includes(k)} onActivate={onRowClick ? () => onRowClick(r) : undefined}>
                    {onSelectedChange ? (
                      <TD className="pl-3 pr-0">
                        <span onClick={(e) => e.stopPropagation()} className="flex">
                          <Checkbox aria-label={`Select ${k}`} checked={sel.includes(k)} onCheckedChange={() => toggle(k)} />
                        </span>
                      </TD>
                    ) : null}
                    {shown.map((c) => (
                      <TD key={c.key} align={c.align} maxWidth={c.maxWidth}>
                        {c.cell ? c.cell(r) : String(valueOf(c, r) ?? "")}
                      </TD>
                    ))}
                  </TRow>
                );
              })}
        </TBody>
      </Table>
      {!loading && slice.length === 0 ? <p className="px-3 py-6 text-center text-body text-ink-muted">No rows match “{q}”</p> : null}
      {filtered.length > pageSize ? <Pagination page={current} pageCount={pages} onPageChange={setPage} total={filtered.length} pageSize={pageSize} className="px-1" /> : null}
    </div>
  );
}
