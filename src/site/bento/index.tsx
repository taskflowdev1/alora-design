/*
 * The landing bento: every component in use, inside real-looking ERP cards of varied sizes.
 * No per-component labels; card titles only where a real app would have one. Everything stays
 * interactive. `?loading=1` holds the skeletons (review shots).
 */
import { cn } from "@/lib/ad";
import { BoardCard, CalendarCard, FeesCard } from "./board-fees-calendar";
import { NotesCard, SettingsCard, ShipmentCard } from "./notes-shipment-settings";
import { OrdersCard } from "./orders";
import { LowStockCard, PhoneCard, ProductsCard } from "./products-stock-phone";
import { PromotionCard, ReturnsCard, TeamCard } from "./promo-team-returns";
import { PaletteCard, SalesCard, ShellCard } from "./sales-palette-shell";
import { ByShopCard, PhotosCard, SyncCard } from "./sync-photos-byshop";

/* ------------------------------------------------------------ the composition */

/**
 * Bands of a 12-column grid. Cards in a band share its height; a stack is a column of cards
 * whose last card takes the rest. Tablet: two columns. Phone: one column, in reading order.
 */
const band = "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12";
const stack = "grid min-w-0 grid-cols-1 gap-4 content-stretch [&>*:last-child]:h-full";

export function Bento() {
  return (
    <section aria-label="Components in use" className="mx-auto grid w-full max-w-[1280px] gap-4 px-4 sm:px-6">
      <div className={band} data-bento="1">
        <OrdersCard className="md:col-span-2 lg:col-span-8" />
        <div data-stack className={cn(stack, "md:col-span-2 md:grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:grid-rows-[auto_1fr]")}>
          <SalesCard />
          <PaletteCard />
        </div>
      </div>
      <div className={band} data-bento="2">
        <ShellCard className="lg:col-span-3" />
        <BoardCard className="lg:col-span-5" />
        <FeesCard className="md:col-span-2 lg:col-span-4" />
      </div>
      <div className={band} data-bento="3">
        <CalendarCard className="md:col-span-2 lg:col-span-8" />
        <div data-stack className={cn(stack, "md:col-span-2 md:grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:grid-rows-[auto_1fr]")}>
          <NotesCard />
          <ShipmentCard />
        </div>
      </div>
      <div className={band} data-bento="4">
        <SettingsCard className="lg:col-span-4" />
        <PromotionCard className="lg:col-span-4" />
        <div data-stack className={cn(stack, "md:col-span-2 md:grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:grid-rows-[auto_1fr]")}>
          <TeamCard />
          <ReturnsCard />
        </div>
      </div>
      <div className={band} data-bento="5">
        <ProductsCard className="md:col-span-2 lg:col-span-6" />
        <LowStockCard className="lg:col-span-3" />
        <PhoneCard className="lg:col-span-3" />
      </div>
      <div className={band} data-bento="6">
        <SyncCard className="lg:col-span-4" />
        <PhotosCard className="lg:col-span-4" />
        <ByShopCard className="md:col-span-2 lg:col-span-4" />
      </div>
    </section>
  );
}
