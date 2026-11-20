// /mobile: the Mobile half of the Components page. Phone screens composed from the mobile components in real use (the
// example app live first), each followed by links to the components it is made of.
import * as React from "react";
import { Grid, Maximize2, Package, Plus, RotateCcw, Tag, Truck } from "react-feather";
import { NOW, ORDERS, smartTime } from "./data";
import { findItem, itemPath } from "@/lib/registry";
import { formatRp } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Segmented } from "@/components/ui/segmented";
import { Thumb } from "@/components/ui/thumb";
import { MobileScreen, MobileBarButton } from "@/components/mobile/mobile-nav-bar";
import { MobileList, MobileListRow } from "@/components/mobile/mobile-list";
import { MobileSheet } from "@/components/mobile/mobile-sheet";
import { MobileDateSheet } from "@/components/mobile/mobile-wheel-picker";
import { MobileActionBar } from "@/components/mobile/mobile-action-bar";
import { PhoneFrame } from "./phone";
import { SLink } from "./config";
import { COURIERS, CourierPicker, MobileApp, findScreen } from "./mobile-app";
import { LazyPhone } from "./lazy-phone";

const TO_PACK = ORDERS.filter((o) => o.status === "Paid").slice(0, 8);

function Parts({ names }: { names: string[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {names.map((n) => {
        const item = findItem(n);
        return item ? (
          <SLink key={n} to={itemPath(item)} data-mobile-part={n} className="relative inline-flex h-7 items-center rounded-full bg-fill px-bubble-sm text-small text-ink-muted transition-colors duration-[150ms] ease-ad after:absolute after:inset-x-0 after:-inset-y-[2px] after:content-[''] hover:bg-fill-strong hover:text-ink focus-visible:bg-fill-strong focus-visible:text-ink">
            {item.title}
          </SLink>
        ) : null;
      })}
    </div>
  );
}

function Screen({ names, children, keyboard, extra }: { names: string[]; children: React.ReactNode; keyboard?: boolean; extra?: React.ReactNode }) {
  return (
    <section data-mobile-screen-tile className="grid min-w-0 content-start gap-4 rounded-sheet bg-surface p-4 shadow-card sm:p-6">
      {keyboard ? <PhoneFrame keyboard>{children}</PhoneFrame> : <LazyPhone>{children}</LazyPhone>}
      <Parts names={names} />
      {extra}
    </section>
  );
}

function CourierScreen() {
  const [open, setOpen] = React.useState(true);
  const [courier, setCourier] = React.useState("gosend");
  const c = COURIERS.find((x) => x.id === courier)!;
  return (
    <>
      <MobileScreen title="RMB-24809" large={false} back={{ label: "Orders", onClick: () => {} }} bottomInset="none">
        <div className="grid gap-5 pt-2">
          <MobileList title="Shipping">
            <MobileListRow media={<Truck />} title="Courier" value={c.name} chevron onClick={() => setOpen(true)} />
          </MobileList>
          <MobileList title="Items">
            {TO_PACK.slice(0, 3).map((o) => (
              <MobileListRow key={o.id} media={<Thumb alt={o.items} size={40} />} title={o.items} subtitle={`${o.qty} pcs`} value={formatRp(o.total)} />
            ))}
          </MobileList>
        </div>
      </MobileScreen>
      <MobileSheet
        open={open}
        onOpenChange={setOpen}
        title="Courier"
        detents={[0.5, 0.92]}
        footer={
          <Button variant="primary" onClick={() => setOpen(false)}>
            Use {c.name}
          </Button>
        }
      >
        <CourierPicker value={courier} onValueChange={setCourier} />
      </MobileSheet>
    </>
  );
}

function PickupScreen() {
  const [open, setOpen] = React.useState(true);
  const [when, setWhen] = React.useState(new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + 2));
  return (
    <>
      <MobileScreen title="Pickups" bottomInset="none">
        <MobileList>
          {TO_PACK.map((o) => (
            <MobileListRow key={o.id} media={<Thumb alt={o.items} size={40} />} title={o.customer} subtitle={`${o.items} · ${smartTime(o.at)}`} chevron onClick={() => setOpen(true)} />
          ))}
        </MobileList>
      </MobileScreen>
      <MobileDateSheet open={open} onOpenChange={setOpen} title="Pickup date" value={when} onValueChange={setWhen} />
    </>
  );
}

function ReturnsScreen() {
  const [stage, setStage] = React.useState("returns");
  return (
    <MobileScreen
      title="Orders"
      bottomInset="none"
      header={
        <Segmented
          size="touch"
          className="w-full"
          aria-label="Stage"
          value={stage}
          onValueChange={setStage}
          options={[
            { value: "pack", label: "To pack" },
            { value: "returns", label: "Returns" },
          ]}
        />
      }
    >
      {stage === "returns" ? (
        <EmptyState icon={RotateCcw} title="No returns this week" className="py-28" />
      ) : (
        <MobileList>
          {TO_PACK.map((o) => (
            <MobileListRow key={o.id} media={<Thumb alt={o.items} size={40} />} title={o.customer} subtitle={o.items} value={formatRp(o.total)} />
          ))}
        </MobileList>
      )}
    </MobileScreen>
  );
}

function NewProductScreen() {
  const field = "h-touch w-full min-w-0 bg-transparent text-right text-[16px] text-ink outline-none placeholder:text-ink-muted";
  return (
    <>
      <MobileScreen
        title="New product"
        large={false}
        back={{ label: "Products", onClick: () => {} }}
        bottomInset="action-bar"
        trailing={
          <MobileBarButton aria-label="Add a photo">
            <Plus />
          </MobileBarButton>
        }
      >
        <div className="grid gap-5 pt-2">
          <MobileList>
            <MobileListRow media={<Package />} title="Name" value={<input aria-label="Name" defaultValue="Gelas kopi tanah liat" className={field} />} />
            <MobileListRow media={<Tag />} title="Price" value={<input aria-label="Price" inputMode="numeric" defaultValue="Rp 89.000" className={field} />} />
          </MobileList>
        </div>
      </MobileScreen>
      <MobileActionBar>
        <Button>Save draft</Button>
        <Button variant="primary">Add product</Button>
      </MobileActionBar>
    </>
  );
}

/** Screens from the example app that show the rest of the set in real use (every mobile item is linked from a tile). */
const APP_TILES: [string, Record<string, string>?][] = [
  ["home"],
  ["reports"],
  ["inbox"],
  ["chat", { id: "ch1" }],
  // Products shows the list's floating button (D4); Product is where the KPI carousel lives now (photos), since Home
  // moved to a 2 × 2 stat grid. 21 tiles fill seven rows of three.
  ["products"],
  ["product", { sku: "RMB-GL-014" }],
  ["product-edit", { sku: "RMB-GL-014" }],
  ["stock-count"],
  ["delivery", { photos: "1" }],
  ["customers"],
  ["order", { id: "RMB-24811" }],
  ["pos"],
  ["pos-receipt", { method: "cash", received: "500000" }],
  ["otp"],
  ["onboarding"],
];

export function MobileOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Screen
        names={["mobile-tab-bar", "mobile-nav-bar", "mobile-search-bar", "mobile-segmented", "mobile-list", "mobile-swipe-row", "mobile-pull-refresh", "mobile-list-skeleton", "mobile-snackbar"]}
        extra={
          <div className="flex flex-wrap justify-center gap-gap">
            <SLink to="/mobile/app" className="inline-flex h-control items-center gap-2 rounded-control bg-fill px-3.5 text-body font-medium text-ink transition-colors duration-[150ms] ease-ad hover:bg-fill-strong focus-visible:bg-fill-strong">
              <Maximize2 size={16} />
              Open full screen
            </SLink>
            <SLink to="/mobile/screens" data-all-screens className="inline-flex h-control items-center gap-2 rounded-control bg-fill px-3.5 text-body font-medium text-ink transition-colors duration-[150ms] ease-ad hover:bg-fill-strong focus-visible:bg-fill-strong">
              <Grid size={16} />
              All screens
            </SLink>
          </div>
        }
      >
        <MobileApp screen="orders" />
      </Screen>
      <Screen names={["mobile-action-sheet", "mobile-stepper", "mobile-action-bar"]}>
        <MobileApp screen="order" params={{ actions: "1" }} />
      </Screen>
      <Screen names={["mobile-sheet"]}>
        <CourierScreen />
      </Screen>
      <Screen names={["mobile-date-picker"]}>
        <PickupScreen />
      </Screen>
      <Screen names={["mobile-empty-state"]}>
        <ReturnsScreen />
      </Screen>
      <Screen names={["mobile-action-bar"]} keyboard>
        <NewProductScreen />
      </Screen>
      {APP_TILES.map(([id, params]) => (
        <Screen key={id} names={findScreen(id)!.parts.filter((n) => !["mobile-nav-bar", "mobile-list", "mobile-tab-bar"].includes(n))}>
          <MobileApp screen={id} params={params} />
        </Screen>
      ))}
    </div>
  );
}
