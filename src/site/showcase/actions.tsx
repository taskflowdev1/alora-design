import * as React from "react";
import { Archive, Box, ChevronRight, Copy, Edit2, Folder, MoreHorizontal, Plus, Printer, Trash2 } from "react-feather";
import { cn, formatRp } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "@/components/ui/search";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Segmented } from "@/components/ui/segmented";
import { Checkbox, CheckboxField } from "@/components/ui/checkbox";
import { Status } from "@/components/ui/status";
import { Popover } from "@/components/ui/popover";
import { toast } from "@/components/ui/toast";
import { Menu, MenuItem, menuSurface } from "@/components/ui/menu";
import { Toolbar, ToolbarSpacer } from "@/components/ui/toolbar";
import { SaveBar } from "@/components/ui/save-bar";
import { ORDERS, SHOPS, type Order } from "../data";
import { Head, Mark, Tile } from "../mark";
import { say } from "./shared";

/* ------------------------------------------------------------ Actions */

export const tone = (o: Order) => (o.status === "Unpaid" ? "attention" : o.status === "Cancelled" ? "muted" : "default");

export function OrdersActionsTile({ className }: { className?: string }) {
  const [q, setQ] = React.useState("");
  const [shop, setShop] = React.useState("all");
  const [range, setRange] = React.useState("week");
  const rows = ORDERS.slice(0, 5);
  const [sel, setSel] = React.useState<string[]>([rows[1].id, rows[3].id]);
  return (
    <Tile className={className}>
      <div className="flex min-h-control flex-wrap items-center gap-gap px-2 pt-1">
        <h3 className="mr-auto text-title font-semibold">Orders</h3>
        <Menu
          align="end"
          trigger={
            <Button variant="ghost" icon aria-label="More">
              <MoreHorizontal />
            </Button>
          }
        >
          <MenuItem icon={Printer}>Print all slips</MenuItem>
          <MenuItem icon={Archive}>Archive shipped</MenuItem>
        </Menu>
        <Button onClick={say("Exported 1.240 orders")}>Export</Button>
        <Button variant="primary" onClick={say("New order")}>
          <Plus />
          Add order
        </Button>
      </div>
      <Mark name="toolbar" className="mx-2">
        <Toolbar>
          <Search value={q} onValueChange={setQ} placeholder="Order or product" />
          <Select prefix="Shop" aria-label="Shop" value={shop} onValueChange={setShop} options={[{ value: "all", label: "All" }, ...SHOPS.slice(0, 4).map((s) => ({ value: s, label: s }))]} />
          <Popover trigger={<Button>Filter</Button>}>
            <div className="grid w-56 gap-2.5">
              <CheckboxField label="Unpaid" defaultChecked />
              <CheckboxField label="To pack" />
              <CheckboxField label="Shipped" />
            </div>
          </Popover>
          <ToolbarSpacer />
          <Segmented
            aria-label="Range"
            value={range}
            onValueChange={setRange}
            options={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
          />
        </Toolbar>
      </Mark>
      <div className="grid grid-cols-1 gap-px">
        {rows.map((o) => {
          const on = sel.includes(o.id);
          return (
            <label key={o.id} className={cn("flex h-row cursor-pointer items-center gap-3 rounded-item px-2 text-body", on ? "bg-fill-strong" : "hover:bg-fill has-[:focus-visible]:bg-fill")}>
              <Checkbox aria-label={o.id} checked={on} onCheckedChange={(v) => setSel(v ? [...sel, o.id] : sel.filter((x) => x !== o.id))} />
              <span className="w-24 shrink-0">{o.id}</span>
              <span className="min-w-0 flex-1 truncate">{o.items}</span>
              <span className="hidden w-24 shrink-0 sm:block">
                <Status tone={tone(o)}>{o.status}</Status>
              </span>
              <span className="w-28 shrink-0 text-right tabular-nums">{formatRp(o.total)}</span>
            </label>
          );
        })}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-gap rounded-item bg-fill p-nest pl-3">
        <span className="mr-auto text-body tabular-nums">{sel.length} selected</span>
        <Mark name="button" className="flex flex-wrap items-center gap-gap">
          <Button variant="ghost" onClick={() => setSel([])}>
            Clear
          </Button>
          <Button onClick={say(`Printing ${sel.length} slips`)}>
            <Printer />
            Print slips
          </Button>
          <Button icon aria-label="Copy order numbers" onClick={say("Copied")}>
            <Copy />
          </Button>
          <Button variant="primary" onClick={() => toast(`${sel.length} orders packed`)}>
            <Box />
            Mark packed
          </Button>
        </Mark>
      </div>
    </Tile>
  );
}

/** A menu row as the menu draws it, for a menu shown open in place. */
function MenuRow({ icon: Icon, children, sub, shortcut, active }: { icon: typeof Edit2; children: React.ReactNode; sub?: boolean; shortcut?: string; active?: boolean }) {
  return (
    <div className={cn("flex h-item items-center gap-2.5 rounded-control px-2.5 text-body", active ? "bg-fill" : "hover:bg-fill")}>
      <Icon size={16} className="shrink-0" />
      <span className="flex-1 truncate">{children}</span>
      {shortcut ? <span className="text-small text-ink-muted">{shortcut}</span> : null}
      {sub ? <ChevronRight size={16} className="text-ink-muted" /> : null}
    </div>
  );
}

export function MenuOpenTile({ className }: { className?: string }) {
  return (
    <Tile className={className}>
      <Head
        title="RMB-24817"
        action={
          <Menu align="end" trigger={<Button className="bg-fill-strong">Actions</Button>}>
            <MenuItem icon={Edit2} shortcut="E">
              Edit
            </MenuItem>
            <MenuItem icon={Copy} shortcut="D">
              Duplicate
            </MenuItem>
            <MenuItem icon={Trash2}>Delete</MenuItem>
          </Menu>
        }
      />
      <Mark name="menu" className="flex justify-end">
        <div role="presentation" className={cn(menuSurface, "relative w-56 animate-none")}>
          <div className="grid grid-cols-1 gap-px">
            <MenuRow icon={Edit2} shortcut="E">
              Edit
            </MenuRow>
            <MenuRow icon={Copy} shortcut="D">
              Duplicate
            </MenuRow>
            <MenuRow icon={Folder} sub active>
              Move to
            </MenuRow>
            <MenuRow icon={Trash2}>Delete</MenuRow>
          </div>
        </div>
      </Mark>
    </Tile>
  );
}

export function SaveTile({ className }: { className?: string }) {
  const [dirty, setDirty] = React.useState(true);
  const [name, setName] = React.useState("Rimba Kemang Baru");
  return (
    <Tile className={className}>
      <Field label="Shop name" layout="row" className="px-2">
        <Input value={name} onChange={(e) => (setName(e.target.value), setDirty(true))} />
      </Field>
      <Mark name="save-bar" className="mt-auto">
        {dirty ? (
          <SaveBar inline open onDiscard={() => (setName("Rimba Kemang"), setDirty(false))} onSave={() => (setDirty(false), toast("Changes saved"))} />
        ) : (
          <div className="flex h-[calc(var(--ad-control-h)+var(--ad-nest)*2)] items-center px-2 text-body text-ink-muted">Saved</div>
        )}
      </Mark>
    </Tile>
  );
}
