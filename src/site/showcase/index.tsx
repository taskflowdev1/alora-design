/*
 * The Components page: every component live, composed into a bento like the landing's. Each band is a job a screen
 * does (Inputs, Workflow, Documents…) on one 12-column grid; each tile is components in real use (an orders page, a
 * form, a filter, a table, an overlay opened in place). Every component sits inside a `Mark`: hover shows a soft fill
 * and a chip with its name that opens its page with the sliders; a click on its empty space does the same.
 *
 * BANDS is the page's whole layout. Bands are not registry groups: the sidebar and docs list what a component is, this
 * page shows where it's used. A new tile needs a place here, or the smoke coverage check fails.
 */
import * as React from "react";
import { Search as SearchIcon } from "react-feather";
import { cn } from "@/lib/ad";
import { COMPONENT_ITEMS, findItem } from "@/lib/registry";
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

const BASE_TILES: TileDef[] = [
  { items: ["corner-shape"], render: (c, className) => <CornerTile config={c} className={className} /> },
  { items: ["scrollbar"], render: (_, c) => <ScrollTile className={c} /> },
  { items: ["toolbar", "filter-button", "button"], render: (_, c) => <OrdersActionsTile className={c} /> },
  {
    items: ["menu", "save-bar"],
    render: (_, c) => (
      <div className={cn(stack, "md:grid-cols-2 lg:grid-cols-1 lg:grid-rows-[auto_1fr]", c)}>
        <MenuOpenTile />
        <SaveTile />
      </div>
    ),
  },
  { items: ["language-picker", "combobox", "field", "input", "date-picker"], render: (_, c) => <NewOrderTile className={c} /> },
  { items: ["tabs", "search", "select", "multi-select", "period-stepper", "segmented"], render: (_, c) => <FindTile className={c} /> },
  { items: ["switch", "checkbox", "radio", "slider"], render: (_, c) => <CheckoutTile className={c} /> },
  { items: ["status", "table", "thumb"], render: (_, c) => <TableTile className={c} /> },
  { items: ["metric-card", "bar-chart"], render: (_, c) => <NumbersStack className={c} /> },
  { items: ["card", "avatar"], render: (_, c) => <ShopCardTile className={c} /> },
  { items: ["badge", "attention-list"], render: (_, c) => <LowStockTile className={c} /> },
  { items: ["alert", "progress"], render: (_, c) => <AlertsTile className={c} /> },
  { items: ["skeleton", "empty-state"], render: (_, c) => <EmptyLoadingStack className={c} /> },
  { items: ["dialog"], render: (_, c) => <DialogTile className={c} /> },
  { items: ["sheet"], render: (_, c) => <SheetTile className={c} /> },
  { items: ["popover"], render: (_, c) => <PopoverTile className={c} /> },
  { items: ["tooltip"], render: (_, c) => <TooltipTile className={c} /> },
  { items: ["toast"], render: (_, c) => <ToastTile className={c} /> },
  { items: ["sidebar"], render: (_, c) => <DesktopShellTile className={c} /> },
  { items: ["notification-bell", "shop-picker", "date-range-picker", "toggle-group", "column-menu", "context-menu", "marketplace-mark", "sparkline", "diff"], render: (_, c) => <PayoutsTile className={c} /> },
  { items: ["command-palette", "kbd"], render: (_, c) => <PaletteTile className={c} /> },
  { items: ["copy-chip", "steps", "fee-row", "time-picker"], render: (_, c) => <OrderTile className={c} /> },
  { items: ["avatar-group", "hover-card", "comment-thread"], render: (_, c) => <NotesTile className={c} /> },
  { items: ["dropzone", "tag-input", "currency-input", "quantity-stepper"], render: (_, c) => <ProductTile className={c} /> },
  { items: ["calendar-month"], render: (_, c) => <CalendarTile className={c} /> },
  { items: ["split-button", "kanban-card", "progress-ring"], render: (_, c) => <PackStack className={c} /> },
  { items: ["inline-edit"], render: (_, c) => <PricesTile className={c} /> },
  { items: ["timeline"], render: (_, c) => <ShipmentTile className={c} /> },
  { items: ["holo-card"], render: (_, c) => <CompanyCardsTile className={c} /> },
];

/** Every tile, by its first component's name (how BANDS refers to it). */
const TILES = new Map([...BASE_TILES, ...MORE_TILES, ...MOTION_TILES, ...SHOWPIECE_TILES].map((t) => [t.items[0], t]));

/** A span that also takes the full width on tablet: the odd tile out of a row of three. */
const wide = (n: 3 | 4 | 5) => cn(S[n], "md:col-span-2");
/** Drag-only pieces (slide, peel, scratch) are shown where the pointer is a finger. */
const TOUCH_ONLY = "pointer-fine:hidden";
const touch = (span: string) => cn(span, "md:col-span-2", TOUCH_ONLY);

/** One place on the grid: a tile, or several stacked in one column. */
type Place = [tile: string | string[], className: string];

const BANDS: { title: string; places: Place[] }[] = [
  { title: "Foundations", places: [["corner-shape", S[8]], ["scrollbar", S[4]]] },
  {
    title: "Actions",
    places: [
      ["toolbar", S[8]],
      ["menu", wide(4)],
      ["hold-to-confirm", S[3]],
      ["save-morph", S[3]],
      ["dust-delete", S[3]],
      ["undo-fuse", S[3]],
      ["slide-to-pay", touch(S[6])],
    ],
  },
  {
    title: "Inputs",
    places: [
      ["language-picker", S[4]],
      ["input-group", S[4]],
      ["label", wide(4)],
      ["step-form", S[7]],
      ["password-input", wide(5)],
      ["number-dial", wide(5)],
      ["rubber-band-stepper", S[3]],
      ["theme-switch", S[4]],
      ["detent-knob", S[4]],
      ["shift-ring-clock", S[4]],
      ["calendar", wide(4)],
    ],
  },
  { title: "Selection", places: [["tabs", S[4]], ["switch", S[4]], ["filter-search", wide(4)]] },
  {
    title: "Workflow",
    places: [
      ["bulk-action-bar", S[7]],
      [["status-select", "sla-fuse"], wide(5)],
      ["approval-flow", S[6]],
      ["timeline", S[6]],
      ["calendar-month", S[8]],
      ["split-button", wide(4)],
    ],
  },
  {
    title: "Documents",
    places: [
      ["line-items", S[8]],
      ["inline-edit", wide(4)],
      ["copy-chip", S[4]],
      ["avatar-group", S[4]],
      ["dropzone", wide(4)],
      ["peel-label", touch(S[6])],
    ],
  },
  {
    title: "Data display",
    places: [
      ["status", S[8]],
      ["metric-card", wide(4)],
      ["data-table", S[8]],
      [["card", "badge"], wide(4)],
      ["carousel", S[4]],
      ["item", S[4]],
      ["accordion", wide(4)],
    ],
  },
  {
    title: "Metrics",
    places: [
      ["balance-privacy-wave", S[5]],
      ["odometer-total", S[4]],
      ["stock-battery", wide(3)],
      ["target-gauge", S[3]],
      ["goal-rings", S[5]],
      ["split-flap-board", wide(4)],
      ["dot-matrix-number", S[7]],
      ["foil-badge", wide(5)],
    ],
  },
  {
    title: "Charts",
    places: [
      ["chart", S[8]],
      ["area-chart", wide(4)],
      ["pie-chart", S[4]],
      ["radar-chart", S[4]],
      ["radial-chart", wide(4)],
      ["ghost-compare", S[6]],
      ["margin-waterfall", S[6]],
      ["brush", S[12]],
      ["year-heatmap", S[12]],
    ],
  },
  {
    title: "Media",
    places: [["before-after", S[4]], ["product-hotspots", S[4]], ["photo-stack", wide(4)], ["scratch-voucher", touch(S[6])]],
  },
  { title: "Navigation", places: [["navigation-menu", S[7]], ["menubar", wide(5)]] },
  {
    title: "Overlays",
    places: [["dialog", S[4]], ["sheet", S[4]], ["alert-dialog", wide(4)], ["popover", S[3]], ["tooltip", S[3]], ["toast", S[3]], ["status-island", S[3]]],
  },
  {
    title: "Feedback",
    places: [
      ["alert", S[4]],
      ["skeleton", S[4]],
      ["flip-countdown", wide(4)],
    ],
  },
  { title: "Layout", places: [["sidebar", S[12]]] },
  {
    title: "Chat",
    places: [
      ["marker", S[7]],
      ["streaming-text", wide(5)],
      ["questionnaire", S[6]],
      ["proposed-change", S[6]],
    ],
  },
  { title: "Niche", places: [["notification-bell", S[8]], ["command-palette", wide(4)], ["holo-card", S[12]]] },
];

/** The Components page body: a band of tiles per job, filtered by `query` (a tile shows if any part matches). */
export function ComponentBento({ query }: { query: string }) {
  const [config] = useConfig();
  const q = query.trim().toLowerCase();
  const match = (name: string) => {
    const i = findItem(name);
    return !q || name.includes(q) || !!i?.title.toLowerCase().includes(q);
  };
  const shown = (key: string) => {
    const t = TILES.get(key);
    return t && t.items.some(match) ? t : undefined;
  };
  // A search on a mouse skips the touch-only tiles, so a band never shows a heading over nothing.
  const skipTouch = !!q && window.matchMedia("(pointer: fine)").matches;
  const bands = BANDS.map((b) => ({
    title: b.title,
    places: b.places.flatMap(([tile, className]): { key: string; className: string; tiles: TileDef[] }[] => {
      if (skipTouch && className.includes(TOUCH_ONLY)) return [];
      const tiles = [tile].flat().flatMap((k) => shown(k) ?? []);
      return tiles.length ? [{ key: [tile].flat().join(), className, tiles }] : [];
    }),
  })).filter((b) => b.places.length);
  return (
    <div className="grid gap-10" data-components={COMPONENT_ITEMS.filter((i) => i.showcase !== false).map((i) => i.name).join(",")}>
      {bands.length === 0 ? <EmptyState icon={SearchIcon} title="No component by that name" /> : null}
      {bands.map((b) => (
        // Phones and tablets: off screen a band isn't rendered at all, so a frame's work never covers the whole page (the
        // header's slide on a scroll turn re-sorted every layer of it, a visible hitch). Each band keeps
        // the height it last showed ("auto"), so nothing above the view changes size as you scroll back. Not on desktop: the
        // side list jumps mid-page, and Safari has no scroll anchoring to absorb bands above filling in.
        <section key={b.title} aria-label={b.title} data-group={b.title} className="grid gap-3 max-lg:[contain-intrinsic-size:auto_900px] max-lg:[content-visibility:auto]">
          <h2 className="text-title font-semibold text-ink">{b.title}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
            {b.places.map((p) =>
              p.tiles.length === 1 ? (
                <React.Fragment key={p.key}>{p.tiles[0].render(config, p.className)}</React.Fragment>
              ) : (
                <div key={p.key} className={cn(stack, p.className)}>
                  {p.tiles.map((t) => (
                    <React.Fragment key={t.items.join()}>{t.render(config, "")}</React.Fragment>
                  ))}
                </div>
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
