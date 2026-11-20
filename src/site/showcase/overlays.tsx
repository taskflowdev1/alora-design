import * as React from "react";
import { Copy, Printer, Share2, Truck, X } from "react-feather";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { CheckboxField } from "@/components/ui/checkbox";
import { Popover } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";
import { toast, ToastView } from "@/components/ui/toast";
import { ORDERS, smartTime } from "../data";
import { BackPage, Mark, Tile, frame } from "../mark";
import { say } from "./shared";

/* ------------------------------------------------------------ Overlays, opened in place */

/** A small page behind an overlay: a few order rows, dimmed by the overlay that sits on it. */
export function DialogTile({ className }: { className?: string }) {
  const [reason, setReason] = React.useState("stock");
  return (
    <Tile className={className}>
      <Mark name="dialog" className="flex flex-1">
        <div className={frame}>
          <BackPage />
          <div className="absolute inset-0 bg-overlay" />
          <div className="absolute inset-x-3 top-1/2 mx-auto grid max-w-[380px] -translate-y-1/2 gap-4 rounded-sheet bg-surface p-pad shadow-dialog">
            <div className="flex min-h-control items-center justify-between gap-3">
              <span className="text-title font-semibold">Cancel order RMB-24817?</span>
              <Button variant="ghost" icon aria-label="Close" className="-mr-1">
                <X />
              </Button>
            </div>
            <Field label="Reason">
              <Select value={reason} onValueChange={setReason} options={[{ value: "stock", label: "Out of stock" }, { value: "buyer", label: "Buyer asked" }]} className="w-full" />
            </Field>
            <div className="flex flex-wrap justify-end gap-gap">
              <Button variant="ghost">Keep order</Button>
              <Button variant="primary" onClick={() => toast("Order cancelled")}>
                Cancel order
              </Button>
            </div>
          </div>
        </div>
      </Mark>
    </Tile>
  );
}

export function SheetTile({ className }: { className?: string }) {
  const o = ORDERS[0];
  return (
    <Tile className={className}>
      <Mark name="sheet" className="flex flex-1">
        <div className={frame}>
          <BackPage />
          <div className="absolute inset-0 bg-overlay" />
          <div className="absolute bottom-2 right-2 top-2 flex w-[min(300px,calc(100%-48px))] flex-col rounded-sheet bg-surface shadow-dialog">
            <div className="flex min-h-control items-center justify-between gap-3 px-pad pt-pad">
              <span className="truncate text-title font-semibold">{o.id}</span>
              <Button variant="ghost" icon aria-label="Close" className="-mr-1">
                <X />
              </Button>
            </div>
            <div className="grid min-h-0 flex-1 content-start gap-2 overflow-hidden px-pad py-3 text-body">
              {[
                ["Time", smartTime(o.at)],
                ["Shop", o.shop],
                ["Customer", o.customer],
                ["Payment", o.payment],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4">
                  <span className="text-ink-muted">{k}</span>
                  <span className="truncate">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 px-pad pb-pad">
              <Button variant="primary" onClick={() => toast("Marked as packed")}>
                Mark as packed
              </Button>
            </div>
          </div>
        </div>
      </Mark>
    </Tile>
  );
}

export function PopoverTile({ className }: { className?: string }) {
  return (
    <Tile className={className}>
      <Mark name="popover" className="grid justify-items-start gap-1.5 px-1">
        <Popover trigger={<Button className="bg-fill-strong">Filter</Button>}>
          <div className="grid w-56 gap-2.5">
            <CheckboxField label="Unpaid" defaultChecked />
            <CheckboxField label="To pack" defaultChecked />
            <CheckboxField label="Shipped" />
          </div>
        </Popover>
        <div className="w-full max-w-60 rounded-card bg-raised p-[calc(var(--ad-nest)*2)] text-ink shadow-raised">
          <div className="grid gap-2.5">
            <CheckboxField label="Unpaid" defaultChecked />
            <CheckboxField label="To pack" defaultChecked />
            <CheckboxField label="Shipped" />
          </div>
        </div>
      </Mark>
    </Tile>
  );
}

export function TooltipTile({ className }: { className?: string }) {
  return (
    <Tile className={className}>
      <Mark name="tooltip" className="flex items-center gap-1 px-1 pt-11">
        <Tooltip content="Copy order number">
          <Button variant="ghost" icon aria-label="Copy order number">
            <Copy />
          </Button>
        </Tooltip>
        <span className="relative">
          <span aria-hidden className="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-item bg-tip px-2.5 py-1.5 text-small text-tip-ink shadow-raised">
            Print packing slip
          </span>
          <Tooltip content="Print packing slip">
            <Button icon className="bg-fill-strong" aria-label="Print packing slip" onClick={say("Printing")}>
              <Printer />
            </Button>
          </Tooltip>
        </span>
          <Tooltip content="Book a courier">
            <Button variant="ghost" icon aria-label="Book a courier">
              <Truck />
            </Button>
          </Tooltip>
          <Tooltip content="Share">
            <Button variant="ghost" icon aria-label="Share">
              <Share2 />
            </Button>
          </Tooltip>
      </Mark>
      <div className="mt-auto flex h-row items-center gap-3 rounded-item bg-fill px-2.5 text-body">
        <span className="shrink-0">RMB-24816</span>
        <span className="min-w-0 flex-1 truncate text-ink-muted">{ORDERS[1].items}</span>
      </div>
    </Tile>
  );
}

export function ToastTile({ className }: { className?: string }) {
  return (
    <Tile className={className}>
      <Mark name="toast" className="grid content-start justify-items-start gap-2 px-1">
        <ToastView>Changes saved</ToastView>
        <ToastView tone="neutral">Copied RMB-24817</ToastView>
      </Mark>
      <div className="mt-auto flex flex-wrap gap-gap px-1">
        <Button variant="primary" onClick={() => toast("Changes saved")}>
          Save
        </Button>
        <Button onClick={() => toast("Copied RMB-24817", "neutral")}>Copy link</Button>
      </div>
    </Tile>
  );
}
