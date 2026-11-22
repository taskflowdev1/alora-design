/*
 * The Components page: every component live, composed into a bento like the landing's. Each category is a band of
 * tiles on one 12-column grid; each tile is that category's components in real use (an orders page, a form, a
 * filter, a table, an overlay opened in place). Every component sits inside a `Mark`: hover shows a soft fill and a
 * chip with its name that opens its page with the sliders; a click on its empty space does the same.
 */
import * as React from "react";
import { Search as SearchIcon } from "react-feather";
import { cn } from "@/lib/ad";
import { COMPONENT_ITEMS, GROUPS, findItem, type Group, type MobileGroup } from "@/lib/registry";
import { EmptyState } from "@/components/ui/empty-state";
import { useConfig } from "../config";
import { S, stack, type TileDef } from "../mark";
import { MORE_TILES } from "../showcase-more";
import { MOTION_TILES } from "../showcase-motion";
import { SHOWPIECE_TILES } from "../showpieces";
import { MenuOpenTile, OrdersActionsTile, SaveTile } from "./actions";
import { AlertsTile, EmptyLoadingStack, LowStockTile, NumbersStack, ShopCardTile, TableTile } from "./display";
import { CornerTile, ScrollTile } from "./foundations";
import { CheckoutTile, FindTile, NewOrderTile } from "./inputs";
import { CalendarTile, CompanyCardsTile, NotesTile, OrderTile, PackStack, PaletteTile, PayoutsTile, PricesTile, ProductTile, ShipmentTile } from "./niche";
import { DialogTile, PopoverTile, SheetTile, ToastTile, TooltipTile } from "./overlays";
import { DesktopShellTile } from "./shell";

/* ------------------------------------------------------------ the page */

const BASE_TILES: Record<Exclude<Group, "Charts" | "Navigation" | "Chat" | MobileGroup>, TileDef[]> = {
  Foundations: [
    { items: ["corner-shape"], render: (c) => <CornerTile config={c} className={S[8]} /> },
    { items: ["scrollbar"], render: () => <ScrollTile className={S[4]} /> },
  ],
  Actions: [
    { items: ["toolbar", "button"], render: () => <OrdersActionsTile className={S[8]} /> },
    {
      items: ["menu", "save-bar"],
      render: () => (
        <div className={cn(stack, "md:col-span-2 md:grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:grid-rows-[auto_1fr]")}>
          <MenuOpenTile />
          <SaveTile />
        </div>
      ),
    },
  ],
  Inputs: [
    { items: ["language-picker", "combobox", "field", "input", "date-picker"], render: () => <NewOrderTile className={S[4]} /> },
    { items: ["tabs", "search", "select", "multi-select", "period-stepper", "segmented"], render: () => <FindTile className={S[4]} /> },
    { items: ["switch", "checkbox", "radio", "slider"], render: () => <CheckoutTile className={cn(S[4], "md:col-span-2 lg:col-span-4")} /> },
  ],
  Display: [
    { items: ["status", "table", "thumb"], render: () => <TableTile className={S[8]} /> },
    { items: ["metric-card", "bar-chart"], render: () => <NumbersStack className="md:col-span-2 lg:col-span-4" /> },
    { items: ["card", "avatar"], render: () => <ShopCardTile className={S[3]} /> },
    { items: ["badge", "attention-list"], render: () => <LowStockTile className={S[3]} /> },
    { items: ["alert", "progress"], render: () => <AlertsTile className={S[3]} /> },
    { items: ["skeleton", "empty-state"], render: () => <EmptyLoadingStack className={S[3]} /> },
  ],
  Overlays: [
    { items: ["dialog"], render: () => <DialogTile className={S[6]} /> },
    { items: ["sheet"], render: () => <SheetTile className={S[6]} /> },
    { items: ["popover"], render: () => <PopoverTile className={S[4]} /> },
    { items: ["tooltip"], render: () => <TooltipTile className={S[4]} /> },
    { items: ["toast"], render: () => <ToastTile className={cn(S[4], "md:col-span-2 lg:col-span-4")} /> },
  ],
  Layout: [
    { items: ["sidebar"], render: () => <DesktopShellTile className={S[12]} /> },
  ],
  Niche: [
    { items: ["notification-bell", "shop-picker", "date-range-picker", "toggle-group", "column-menu", "context-menu", "marketplace-mark", "sparkline", "diff"], render: () => <PayoutsTile className={S[8]} /> },
    { items: ["command-palette", "kbd"], render: () => <PaletteTile className="md:col-span-2 lg:col-span-4" /> },
    { items: ["copy-chip", "steps", "fee-row", "time-picker"], render: () => <OrderTile className={S[4]} /> },
    { items: ["avatar-group", "hover-card", "comment-thread"], render: () => <NotesTile className={S[4]} /> },
    { items: ["dropzone", "tag-input", "currency-input", "quantity-stepper"], render: () => <ProductTile className={cn(S[4], "md:col-span-2 lg:col-span-4")} /> },
    { items: ["calendar-month"], render: () => <CalendarTile className={S[8]} /> },
    { items: ["split-button", "kanban-card", "progress-ring"], render: () => <PackStack className="md:col-span-2 lg:col-span-4" /> },
    { items: ["inline-edit"], render: () => <PricesTile className={S[6]} /> },
    { items: ["timeline"], render: () => <ShipmentTile className={S[6]} /> },
    { items: ["holo-card"], render: () => <CompanyCardsTile className={S[12]} /> },
  ],
  Showpieces: SHOWPIECE_TILES,
  AI: [],
  Backgrounds: [],
};

/** Each category's tiles: the originals, then the shadcn-parity ones (showcase-more.tsx). */
const TILES = Object.fromEntries(
  GROUPS.map((g) => [g, [...((BASE_TILES as Partial<Record<Group, TileDef[]>>)[g] ?? []), ...(MORE_TILES[g] ?? []), ...((MOTION_TILES as Partial<Record<Group, TileDef[]>>)[g] ?? [])]]),
) as Record<Group, TileDef[]>;

/** Every component's name, once, from the tiles (the coverage check compares it with the registry). */

/** The Components page body: a band of tiles per category, filtered by `query` (a tile shows if any part matches). */
export function ComponentBento({ query }: { query: string }) {
  const [config] = useConfig();
  const q = query.trim().toLowerCase();
  const match = (name: string) => {
    const i = findItem(name);
    return !q || name.includes(q) || !!i?.title.toLowerCase().includes(q);
  };
  const groups = GROUPS.map((g) => ({ g, tiles: TILES[g].filter((t) => t.items.some(match)) })).filter((x) => x.tiles.length);
  return (
    <div className="grid gap-10" data-components={COMPONENT_ITEMS.filter((i) => i.showcase !== false).map((i) => i.name).join(",")}>
      {groups.length === 0 ? <EmptyState icon={SearchIcon} title="No component by that name" /> : null}
      {groups.map(({ g, tiles }) => (
        <section key={g} aria-label={g} data-group={g} className="grid gap-3">
          <h2 className="text-title font-semibold text-ink">{g}</h2>
          <div className="grid grid-flow-row-dense grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
            {tiles.map((t) => (
              <React.Fragment key={t.items.join()}>{t.render(config)}</React.Fragment>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
