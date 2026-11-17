/*
 * Gallery-grid thumbnails for components whose demo is only a trigger until clicked (menus, overlays).
 * A tile is inert, so each one shows the component open, drawn with the same classes and parts.
 * Small parts (badge, avatar, thumb) get a little real context so the tile isn't near-empty.
 */
import * as React from "react";
import { Bell, ChevronRight, Copy, Edit2, Folder, Package, Plus, Printer, Share2, ShoppingBag, Tag, Trash2, Truck, X, XCircle } from "react-feather";
import { cn, formatRp } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Thumb } from "@/components/ui/thumb";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Steps } from "@/components/ui/steps";
import { ToastView } from "@/components/ui/toast";
import { MarketMark } from "@/components/ui/marketplace-mark";
import { CommandPalette } from "@/components/ui/command-palette";
import { Status } from "@/components/ui/status";
import { ORDERS, PRODUCTS, TEAM } from "./data";

const panel = "rounded-card bg-raised p-nest text-ink shadow-raised";
const item = "flex h-item items-center gap-2.5 rounded-control px-2.5 text-body";

function MenuPanel({ items, active = 0, className }: { items: [React.ComponentType<{ size?: number; className?: string }> | null, string, string?, boolean?][]; active?: number; className?: string }) {
  return (
    <div className={cn(panel, "grid w-52 gap-px", className)}>
      {items.map(([I, label, shortcut, sub], i) => (
        <div key={label} className={cn(item, i === active && "bg-fill")}>
          {I ? <I size={16} className="shrink-0 text-ink-muted" /> : null}
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {shortcut ? <span className="pl-4 text-small text-ink-faint">{shortcut}</span> : null}
          {sub ? <ChevronRight size={16} className="-mr-1 shrink-0 text-ink-muted" /> : null}
        </div>
      ))}
    </div>
  );
}

const MENU: Parameters<typeof MenuPanel>[0]["items"] = [
  [Edit2, "Edit", "E"],
  [Copy, "Duplicate", "D"],
  [Folder, "Move to", undefined, true],
  [Share2, "Share", undefined, true],
  [Trash2, "Delete"],
];

export const THUMBS: Record<string, () => React.ReactNode> = {
  menu: () => (
    <div className="flex items-start gap-1.5">
      <Button>Actions</Button>
      <MenuPanel items={MENU.slice(0, 4)} />
    </div>
  ),
  "context-menu": () => (
    <div className="relative w-[420px]">
      <div className="grid gap-px rounded-card bg-surface p-nest shadow-card">
        {ORDERS.slice(0, 4).map((o, i) => (
          <div key={o.id} className={cn("flex h-row items-center gap-6 rounded-item px-2.5 text-body", i === 1 && "bg-fill")}>
            <span className="w-24">{o.id}</span>
            <span className="flex-1">{o.customer}</span>
            <span className="tabular-nums">{formatRp(o.total)}</span>
          </div>
        ))}
      </div>
      <MenuPanel
        className="absolute left-40 top-16"
        items={[
          [Edit2, "Edit", "E"],
          [Copy, "Copy order number"],
          [Truck, "Move to", undefined, true],
          [Trash2, "Cancel order"],
        ]}
      />
    </div>
  ),
  "split-button": () => (
    <div className="grid justify-items-end gap-1.5">
      <div className="inline-flex h-control rounded-control bg-brand text-body font-medium text-brand-ink">
        <span className="inline-flex items-center gap-2 pl-3.5 pr-3 [&_svg]:size-4">
          <Package />
          Pack 12 orders
        </span>
        <span className="inline-flex w-8 items-center justify-center rounded-r-control bg-brand-hover">
          <ChevronRight size={16} className="rotate-90" />
        </span>
      </div>
      <MenuPanel
        items={[
          [Printer, "Pack and print slips"],
          [Truck, "Pack and book courier"],
        ]}
      />
    </div>
  ),
  popover: () => (
    <div className="grid justify-items-start gap-1.5">
      <Button>Filter</Button>
      <div className={cn(panel, "grid w-52 gap-2.5 p-[calc(var(--ad-nest)*2)]")}>
        <CheckboxField label="Unpaid" defaultChecked />
        <CheckboxField label="To pack" />
        <CheckboxField label="Shipped" />
      </div>
    </div>
  ),
  tooltip: () => (
    <div className="grid justify-items-center gap-1.5">
      <span className="rounded-item bg-on px-2.5 py-1.5 text-small text-on-ink shadow-raised">2–8 Nov</span>
      <div className="flex items-center gap-1">
        <Button icon aria-label="Previous week">
          <ChevronRight className="rotate-180" />
        </Button>
        <Button>9–15 Nov</Button>
      </div>
    </div>
  ),
  dialog: () => (
    <div className="grid w-[380px] gap-4 rounded-sheet bg-surface p-pad shadow-dialog">
      <div className="flex min-h-control items-center justify-between gap-3">
        <span className="text-title font-semibold">Cancel order RMB-24817?</span>
        <X size={16} className="text-ink-muted" />
      </div>
      <Field label="Reason">
        <Select value="stock" onValueChange={() => {}} options={[{ value: "stock", label: "Out of stock" }]} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="ghost">Keep order</Button>
        <Button variant="primary">Cancel order</Button>
      </div>
    </div>
  ),
  sheet: () => (
    <div className="flex w-[460px] justify-end rounded-card bg-page p-3">
      <div className="grid w-72 gap-4 rounded-sheet bg-surface p-pad shadow-dialog">
        <div className="flex min-h-control items-center justify-between">
          <span className="text-title font-semibold">{ORDERS[0].id}</span>
          <X size={16} className="text-ink-muted" />
        </div>
        <Steps steps={["Ordered", "Paid", "Packed", "Shipped"]} current={2} />
        <div className="grid gap-2 text-body">
          {[
            ["Customer", ORDERS[0].customer],
            ["Payment", ORDERS[0].payment],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-ink-muted">{k}</span>
              {v}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="primary">Mark as packed</Button>
        </div>
      </div>
    </div>
  ),
  toast: () => (
    <div className="grid justify-items-end gap-2">
      <ToastView>Changes saved</ToastView>
      <ToastView tone="neutral">Link copied</ToastView>
    </div>
  ),
  "command-palette": () => (
    <CommandPalette
      inline
      className="w-[420px] shadow-dialog"
      groups={[
        {
          label: "Actions",
          items: [
            { id: "n", label: "New order", icon: Plus, shortcut: ["N"], onSelect: () => {} },
            { id: "p", label: "Print packing slips", icon: Printer, shortcut: ["mod", "P"], onSelect: () => {} },
          ],
        },
        {
          label: "Go to",
          items: [
            { id: "o", label: "Orders", icon: ShoppingBag, onSelect: () => {} },
            { id: "t", label: "Promotions", icon: Tag, onSelect: () => {} },
          ],
        },
      ]}
    />
  ),
  "hover-card": () => (
    <div className="grid justify-items-start gap-1.5">
      <p className="text-body text-ink-muted">
        Last order from <span className="font-medium text-ink">{ORDERS[3].customer}</span>
      </p>
      <div className="w-72 rounded-card bg-raised p-pad shadow-raised">
        <div className="flex items-center gap-3">
          <Avatar name={ORDERS[3].customer} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-body font-semibold">{ORDERS[3].customer}</p>
            <p className="text-small text-ink-muted">Customer since Mar 2025</p>
          </div>
        </div>
      </div>
    </div>
  ),
  "notification-bell": () => (
    <div className="grid justify-items-end gap-1.5">
      <span className="relative grid size-9 place-items-center">
        <Bell size={16} />
        <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-on px-1 text-[10px] font-semibold text-on-ink">2</span>
      </span>
      <div className={cn(panel, "grid w-72 gap-px p-[calc(var(--ad-nest)*2)]")}>
        <span className="px-2 pb-1 text-title font-semibold">Notifications</span>
        {[
          ["2 shops haven't synced since 09:40", "Today, 10:10", true],
          ["Payout of Rp 12.840.000 sent", "Today, 08:02", true],
          ["Dewi changed the courier for Dago", "Yesterday, 15:20", false],
        ].map(([t, time, unread]) => (
          <div key={t as string} className="grid grid-cols-[8px_minmax(0,1fr)] items-start gap-x-2.5 rounded-control px-2 py-1.5">
            <span className="grid h-5 place-items-center">{unread ? <span className="size-1.5 rounded-full bg-ink" /> : null}</span>
            <span className="min-w-0">
              <span className={cn("block truncate text-body leading-5", unread ? "text-ink" : "text-ink-muted")}>{t}</span>
              <span className="block text-small text-ink-muted">{time}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  ),
  badge: () => (
    <div className="grid w-56 gap-px rounded-card bg-surface p-nest shadow-card">
      {[
        [ShoppingBag, "Orders", 23],
        [Package, "Products", null],
        [XCircle, "Cancellations", 4],
      ].map(([I, l, c]) => {
        const Icon = I as typeof Package;
        return (
          <div key={l as string} className={cn(item, l === "Orders" && "bg-fill")}>
            <Icon size={16} className="text-ink-muted" />
            <span className="flex-1">{l as string}</span>
            {c ? <Badge>{c as number}</Badge> : null}
          </div>
        );
      })}
    </div>
  ),
  avatar: () => (
    <div className="grid w-60 gap-px rounded-card bg-surface p-nest shadow-card">
      {TEAM.slice(0, 3).map((t, i) => (
        <div key={t.name} className={item}>
          <Avatar name={t.name} size={i === 0 ? "md" : "sm"} />
          <span className="flex-1 truncate">{t.name}</span>
          <span className="text-ink-muted">{t.role}</span>
        </div>
      ))}
    </div>
  ),
  thumb: () => (
    <div className="grid w-64 gap-px rounded-card bg-surface p-nest shadow-card">
      {PRODUCTS.slice(0, 3).map((p) => (
        <div key={p.sku} className={cn(item, "h-row")}>
          <Thumb alt={p.name} />
          <span className="flex-1 truncate">{p.name}</span>
        </div>
      ))}
    </div>
  ),
  "marketplace-mark": () => (
    <div className="grid w-80 gap-px rounded-card bg-surface p-nest shadow-card">
      {(["shopee", "tiktok", "tokopedia", "offline"] as const).map((m) => (
        <div key={m} className={item}>
          <MarketMark market={m} size={20} />
          <span className="flex-1">{{ shopee: "Rimba Official", tiktok: "Rimba Live", tokopedia: "Rimba Tokopedia", offline: "Kemang" }[m]}</span>
          <Status>{m === "tokopedia" ? "Syncing" : "Synced"}</Status>
        </div>
      ))}
    </div>
  ),
};
