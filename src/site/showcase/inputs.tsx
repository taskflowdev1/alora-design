import * as React from "react";
import { Archive, Box, Mail, Truck } from "react-feather";
import { CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "@/components/ui/search";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { PeriodStepper } from "@/components/ui/period-stepper";
import { LanguagePicker } from "@/components/ui/language-picker";
import { Segmented } from "@/components/ui/segmented";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { CheckboxField } from "@/components/ui/checkbox";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { Slider } from "@/components/ui/slider";
import { Thumb } from "@/components/ui/thumb";
import { NOW, ORDERS, PRODUCTS, SHOPS } from "../data";
import { Head, Mark, Tile } from "../mark";

/* ------------------------------------------------------------ Inputs */

export function NewOrderTile({ className }: { className?: string }) {
  const [sku, setSku] = React.useState<string | null>(PRODUCTS[0].sku);
  const [date, setDate] = React.useState<Date | null>(NOW);
  const [lang, setLang] = React.useState("id");
  return (
    <Tile inset="pad" className={className}>
      <CardHeader
        title="New order"
        action={
          <Mark name="language-picker">
            <LanguagePicker value={lang} onValueChange={setLang} />
          </Mark>
        }
      />
      <Field label="Product">
        <Mark name="combobox">
          <Combobox aria-label="Product" value={sku} onValueChange={setSku} placeholder="Choose a product" searchPlaceholder="Search products" options={PRODUCTS.map((p) => ({ value: p.sku, label: p.name }))} className="w-full" />
        </Mark>
      </Field>
      <Mark name="field">
        <Field label="Customer email" error="Add the part after @, like rina@rimba.example">
          <Mark name="input">
            <Input icon={Mail} defaultValue="rina@" invalid />
          </Mark>
        </Field>
      </Mark>
      <Field label="Ship on">
        <Mark name="date-picker">
          <DatePicker value={date} onValueChange={setDate} today={NOW} />
        </Mark>
      </Field>
    </Tile>
  );
}

export function FindTile({ className }: { className?: string }) {
  const [q, setQ] = React.useState("Gelas");
  const [shop, setShop] = React.useState("Kemang");
  const [st, setSt] = React.useState(["Paid", "Packed"]);
  const [d, setD] = React.useState(NOW);
  const [range, setRange] = React.useState("week");
  return (
    <Tile className={className}>
      <Mark name="tabs" className="px-1">
        <Tabs defaultValue="pack">
          <TabsList>
            <TabsTrigger value="pack">
              <Box />
              To pack
            </TabsTrigger>
            <TabsTrigger value="ship">
              <Truck />
              To ship
            </TabsTrigger>
            <TabsTrigger value="done">
              <Archive />
              Done
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pack" />
          <TabsContent value="ship" />
          <TabsContent value="done" />
        </Tabs>
      </Mark>
      <div className="grid gap-gap px-2">
        <Mark name="search">
          <Search value={q} onValueChange={setQ} placeholder="Order or product" className="w-full" />
        </Mark>
        <div className="flex flex-wrap gap-gap">
          <Mark name="select">
            <Select aria-label="Shop" prefix="Shop" value={shop} onValueChange={setShop} options={SHOPS.slice(0, 4).map((s) => ({ value: s, label: s }))} />
          </Mark>
          <Mark name="multi-select">
            <MultiSelect aria-label="Status" value={st} onValueChange={setSt} placeholder="Status" options={["Paid", "Packed", "Shipped", "Unpaid"].map((s) => ({ value: s, label: s }))} />
          </Mark>
        </div>
        <div className="flex flex-wrap items-center gap-gap">
          <Mark name="period-stepper">
            <PeriodStepper value={d} period={range === "month" ? "month" : range === "day" ? "day" : "week"} onValueChange={setD} max={NOW} />
          </Mark>
          <Mark name="segmented">
            <Segmented
              aria-label="Period"
              value={range}
              onValueChange={setRange}
              options={[
                { value: "day", label: "Day" },
                { value: "week", label: "Week" },
                { value: "month", label: "Month" },
              ]}
            />
          </Mark>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-px">
        {ORDERS.filter((o) => o.items.toLowerCase().includes(q.toLowerCase()))
          .slice(0, 4)
          .map((o) => (
            <div key={o.id} className="flex h-row items-center gap-3 rounded-item px-2 text-body hover:bg-fill">
              <Thumb alt={o.items} size={24} />
              <span className="min-w-0 flex-1 truncate">{o.items}</span>
              <span className="shrink-0 tabular-nums text-ink-muted">{o.id}</span>
            </div>
          ))}
      </div>
    </Tile>
  );
}

export function CheckoutTile({ className }: { className?: string }) {
  const [print, setPrint] = React.useState(true);
  const [round, setRound] = React.useState(false);
  const [disc, setDisc] = React.useState(15);
  return (
    <Tile className={className}>
      <Head title="Checkout" />
      <Mark name="switch" className="grid grid-cols-1 gap-px">
        {(
          [
            ["Print receipts", print, setPrint],
            ["Round cash totals", round, setRound],
          ] as const
        ).map(([l, v, s]) => (
          <label key={l} className="flex h-row cursor-pointer items-center justify-between gap-3 rounded-item px-2 text-body hover:bg-fill has-[:focus-visible]:bg-fill">
            {l}
            <Switch checked={v} onCheckedChange={s} />
          </label>
        ))}
      </Mark>
      <div className="grid gap-4 px-2 sm:grid-cols-2">
        <Mark name="checkbox" className="grid content-start gap-2.5">
          <span className="text-body text-ink-muted">Show</span>
          <CheckboxField label="Unpaid" defaultChecked />
          <CheckboxField label="To pack" defaultChecked />
          <CheckboxField label="Cancelled" />
        </Mark>
        <Mark name="radio" className="grid content-start gap-2.5">
          <span className="text-body text-ink-muted">Courier</span>
          <RadioGroup defaultValue="jne">
            <Radio value="jne" label="JNE Regular" />
            <Radio value="sicepat" label="SiCepat" />
            <Radio value="pickup" label="Pick up" />
          </RadioGroup>
        </Mark>
      </div>
      <Mark name="slider" className="mx-2 mt-auto">
        <Slider label="Member discount" value={disc} min={0} max={50} onValueChange={setDisc} display={`${disc}%`} />
      </Mark>
    </Tile>
  );
}
