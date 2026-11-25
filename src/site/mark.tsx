import * as React from "react";
import { useNavigate } from "react-router";
import { Sliders } from "react-feather";
import { cn, formatRp } from "@/lib/ad";
import type { Config } from "@/lib/config";
import { findItem, itemPath } from "@/lib/registry";
import { Card, CardHeader } from "@/components/ui/card";
import { SLink, useHref } from "./config";
import { ORDERS } from "./data";

/** Inside this, marks keep their layout but drop the hover chip and link (the landing shows components bare). */
export const PlainMarks = React.createContext(false);

const CONTROLS =
  "a,button,input,textarea,select,label,[role=button],[role=combobox],[role=slider],[role=switch],[role=checkbox],[role=radio],[role=tab],[role=option],[role=menuitem],[contenteditable=true]";
const POPUPS = "[data-radix-popper-content-wrapper],[role=dialog]";

/**
 * A click on a mark's or spot's empty space opens `href`; a click on a control inside it (or in a pop-up opened from
 * it) doesn't. `innermost`: only the innermost `[data-spot]` answers. `rows`: table rows count as controls (off where
 * a row click should still open the page).
 */
export function useOpenOnEmptyClick(href: string, { innermost = false, rows = true }: { innermost?: boolean; rows?: boolean } = {}) {
  const navigate = useNavigate();
  return (e: React.MouseEvent<HTMLElement>) => {
    const t = e.target as Element;
    if (!e.currentTarget.contains(t)) return;
    if (innermost && t.closest("[data-spot]") !== e.currentTarget) return;
    if (t.closest(rows ? `${CONTROLS},[role=row]` : CONTROLS) || t.closest(POPUPS)) return;
    navigate(href);
  };
}

/**
 * One component inside a tile. Hover (only the innermost mark) shows a soft fill and its name chip just above it; the
 * chip opens the component's page with the sliders, and so does a click on the mark's empty space. The component
 * itself stays fully interactive. The mark pads itself by as much as it pulls out, so it never moves the layout.
 */
export function Mark({ name, className, children }: { name: string; className?: string; children: React.ReactNode }) {
  const item = findItem(name);
  const open = useOpenOnEmptyClick(useHref(item ? itemPath(item) : "/components"), { innermost: true });
  const plain = React.useContext(PlainMarks);
  if (!item) return <>{children}</>;
  if (plain)
    return (
      <div data-spot={name} className={cn("min-w-0", className)}>
        {children}
      </div>
    );
  return (
    <div
      data-spot={name}
      onClick={open}
      className={cn("ad-mark -m-1.5 min-w-0 cursor-pointer p-1.5", className)}
    >
      <SLink to={itemPath(item)} className="ad-mark-chip focus-visible:pointer-events-auto! focus-visible:transform-none! focus-visible:bg-fill-strong! focus-visible:opacity-100!">
        <Sliders size={14} />
        {item.title}
      </SLink>
      {children}
    </div>
  );
}

/** A tile: a soft surface on the grid. `inset="nest"` for rows and tables (concentric), otherwise content padding. */
export function Tile({ className, inset = "nest", children }: { className?: string; inset?: "pad" | "nest" | "none"; children: React.ReactNode }) {
  return (
    <Card inset={inset} className={cn("flex min-w-0 flex-col gap-3", className)}>
      {children}
    </Card>
  );
}

/** Title row inside a nest-inset tile, on the rows' inset. */
export const Head = ({ title, action }: { title: React.ReactNode; action?: React.ReactNode }) => <CardHeader title={title} action={action} className="px-2 pt-1" />;

export const stack = "grid min-w-0 grid-cols-1 content-stretch gap-4 [&>*:last-child]:h-full";

export interface TileDef {
  /** The components marked in it (for search and the coverage check). */
  items: string[];
  /** `className` is its place on the grid, from the band that shows it (showcase/index.tsx). */
  render: (config: Config, className: string) => React.ReactNode;
}

/** Spans per breakpoint: phone one column, tablet two, desktop twelve. */
export const S = {
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "md:col-span-2 lg:col-span-7",
  8: "md:col-span-2 lg:col-span-8",
  12: "md:col-span-2 lg:col-span-12",
} as const;

/** A quiet page behind an overlay drawn open in place. */
export function BackPage({ rows = 6, compact }: { rows?: number; compact?: boolean }) {
  return (
    <div aria-hidden className="grid gap-px p-3">
      <div className="mb-2 flex h-control items-center px-2 text-title font-semibold">Orders</div>
      {ORDERS.slice(0, rows).map((o) => (
        <div key={o.id} className="flex h-row items-center gap-4 rounded-item px-2 text-body">
          <span className="w-24 shrink-0">{o.id}</span>
          {compact ? <span className="flex-1" /> : <span className="min-w-0 flex-1 truncate text-ink-muted">{o.items}</span>}
          <span className="tabular-nums">{formatRp(o.total)}</span>
        </div>
      ))}
    </div>
  );
}

export const frame = "relative min-h-[300px] flex-1 overflow-hidden rounded-item bg-page [transform:translateZ(0)]";

