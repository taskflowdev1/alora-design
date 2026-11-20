import * as React from "react";
import { Inbox, Mail } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { Slider } from "@/components/ui/slider";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "@/components/ui/toast";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { MARKET_SHOPS, NOW, PRODUCTS, TEAM, dayFrom } from "../data";
import { setCard, setRow } from "./notes-shipment-settings";

/* ------------------------------------------------------------ B11 new promotion */

export function PromotionCard({ className }: { className?: string }) {
  const [name, setName] = React.useState("Rotan week");
  const [product, setProduct] = React.useState<string | null>("RMB-PR-022");
  const [shops, setShops] = React.useState(["Kemang", "Rimba Official"]);
  const [start, setStart] = React.useState<Date | null>(dayFrom(4));
  const [discount, setDiscount] = React.useState(15);
  const [limit, setLimit] = React.useState("once");
  return (
    <Card className={cn("flex min-w-0 flex-col gap-4", className)}>
      <CardHeader title="New promotion" />
      <Field label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Product">
        <Combobox
          aria-label="Product"
          value={product}
          onValueChange={setProduct}
          placeholder="Choose a product"
          searchPlaceholder="Search products"
          options={PRODUCTS.map((p) => ({ value: p.sku, label: p.name }))}
          className="w-full"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Field label="Shops">
          <MultiSelect aria-label="Shops" value={shops} onValueChange={setShops} maxChips={1} options={MARKET_SHOPS.map((s) => ({ value: s.name, label: s.name }))} />
        </Field>
        <Field label="Starts">
          <DatePicker value={start} onValueChange={setStart} today={NOW} />
        </Field>
      </div>
      <Slider label="Discount" value={discount} min={0} max={50} onValueChange={setDiscount} display={`${discount}%`} />
      <RadioGroup value={limit} onValueChange={setLimit} className="flex flex-wrap gap-x-5 gap-y-2.5">
        <Radio value="once" label="Once per buyer" />
        <Radio value="any" label="No limit" />
      </RadioGroup>
      <div className="mt-auto flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={() => toast("Draft saved", "neutral")}>
          Save draft
        </Button>
        <Button variant="primary" onClick={() => toast(`${name} scheduled`)}>
          Schedule
        </Button>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------ B12 team */

export function TeamCard({ className }: { className?: string }) {
  const team = TEAM.slice(0, 3);
  const [roles, setRoles] = React.useState(team.map((t) => t.role));
  const [email, setEmail] = React.useState("");
  const roleOptions = ["Owner", "Admin", "Cashier", "Stock"].map((r) => ({ value: r, label: r }));
  // One right-hand column: role selects, the owner's fixed role (text on the selects' text inset) and Invite.
  const ctl = "w-28";
  return (
    <Card inset="nest" className={cn(setCard, className)}>
      <CardHeader title="Team" action={<AvatarGroup people={[...TEAM, { name: "Wulan Sari" }, { name: "Eko Prasetyo" }]} max={4} />} className={setRow} />
      <div className="grid">
        {team.map((t, i) => (
          <div key={t.name} className={cn(setRow, "justify-start")}>
            <Avatar name={t.name} size="sm" />
            <span className="min-w-0 flex-1 truncate text-body">{t.name}</span>
            {i === 0 ? (
              <span className={cn(ctl, "shrink-0 pl-3 text-body text-ink-muted")}>Owner</span>
            ) : (
              <Select aria-label={`${t.name} role`} value={roles[i]} onValueChange={(v) => setRoles(roles.map((r, j) => (j === i ? v : r)))} align="end" options={roleOptions.slice(1)} className={cn(ctl, "shrink-0")} />
            )}
          </div>
        ))}
      </div>
      <form
        className={setRow}
        onSubmit={(e) => {
          e.preventDefault();
          toast(email ? `Invite sent to ${email}` : "Add an email first", email ? "success" : "neutral");
          setEmail("");
        }}
      >
        <Input aria-label="Email" placeholder="Email" icon={Mail} value={email} onChange={(e) => setEmail(e.target.value)} wrapperClassName="min-w-0 flex-1" />
        <Button type="submit" className={cn(ctl, "shrink-0")}>
          Invite
        </Button>
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------ B13 returns, none */

export function ReturnsCard({ className }: { className?: string }) {
  return (
    <Card className={cn("flex min-w-0 flex-col", className)}>
      <CardHeader title="Returns" />
      <EmptyState icon={Inbox} title="No returns yet" className="flex-1 py-6" />
    </Card>
  );
}
