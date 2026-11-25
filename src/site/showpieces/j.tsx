import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyField } from "@/components/ui/copy-chip";
import { Dropzone, type DropFile } from "@/components/ui/dropzone";
import { LineItems, type LineItem, type LineProduct } from "@/components/ui/line-items";
import { MarginWaterfall, type WaterfallPeriod } from "@/components/ui/margin-waterfall";
import { YearHeatmap, type HeatDay } from "@/components/ui/year-heatmap";
import { addDays, cn, prefersReducedMotion } from "@/lib/ad";
import type { Demo } from "../demos";
import { Mark, type TileDef } from "../mark";
import type { ShowpieceMoment } from "./types";

const INVOICE: LineItem[] = [
  { id: "a", name: "Gelas kopi tanah liat", qty: 12, price: 89000 },
  { id: "b", name: "Piring rotan bundar", qty: 4, price: 145000 },
  { id: "c", name: "Taplak meja tenun ikat", qty: 2, price: 329000 },
];
const CATALOG: LineProduct[] = [
  { name: "Gelas kopi tanah liat", price: 89000 },
  { name: "Piring rotan bundar", price: 145000 },
  { name: "Taplak meja tenun ikat", price: 329000 },
  { name: "Vas keramik glasir hijau", price: 210000 },
  { name: "Keranjang pandan besar", price: 239000 },
  { name: "Nampan anyaman bambu", price: 175000 },
];

/** A steady pseudo-random day: the same year on every load, so the page never changes between visits. */
const noise = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** The twelve months up to the demo's "today" (22 Nov 2026), so every cell is a day that really happened. */
const SALES_YEAR: HeatDay[] = Array.from({ length: 365 }, (_, i) => {
  const date = addDays(new Date(2025, 10, 23), i);
  const closed = date.getFullYear() === 2026 && date.getMonth() === 2 && date.getDate() >= 19 && date.getDate() <= 21;
  const weekend = date.getDay() === 0 || date.getDay() === 6 ? 1.45 : 1;
  const season = 1 + 0.4 * Math.sin(((i - 40) / 365) * Math.PI * 2);
  const twin = date.getDate() === date.getMonth() + 1 ? 2.3 : 1;
  const base = 1400000 + noise(i) * 3200000;
  return { date, value: closed ? 0 : Math.round((base * weekend * season * twin) / 1000) * 1000 };
});

const PERIODS: WaterfallPeriod[] = [
  {
    id: "this",
    label: "This month",
    revenue: 48240000,
    steps: [
      { id: "fees", label: "Marketplace fees", short: "Fees", value: 6271000 },
      { id: "ship", label: "Shipping", value: 3860000 },
      { id: "cogs", label: "Cost of goods", short: "Goods", value: 21708000 },
      { id: "ads", label: "Ads", value: 4342000 },
    ],
  },
  {
    id: "last",
    label: "Last month",
    revenue: 41620000,
    steps: [
      { id: "fees", label: "Marketplace fees", short: "Fees", value: 5828000 },
      { id: "ship", label: "Shipping", value: 4162000 },
      { id: "cogs", label: "Cost of goods", short: "Goods", value: 19562000 },
      { id: "ads", label: "Ads", value: 5411000 },
    ],
  },
];

const SAMPLES = [
  { name: "gelas-kopi-tanah-liat.webp", size: 1840000, thumb: "/photos/cup-terracotta.webp" },
  { name: "keranjang-pandan-besar.webp", size: 2310000, thumb: "/photos/products/kr-1.webp" },
  { name: "vas-keramik-hijau.webp", size: 1460000, thumb: "/photos/products/vs-2.webp" },
  { name: "piring-rotan-bundar.webp", size: 2780000, thumb: "/photos/products/pr-2.webp" },
];
const MAX_ROWS = 3;

/**
 * A believable upload for the demos: chunks arrive at an uneven pace. The second file of each round loses its
 * connection once, so Retry can be played; the row limit keeps the piece one fixed size.
 */
function UploadFlow() {
  const [files, setFiles] = React.useState<DropFile[]>([]);
  const timers = React.useRef(new Map<string, number>());
  const count = React.useRef(0);
  React.useEffect(() => {
    const live = timers.current;
    return () => live.forEach((t) => window.clearTimeout(t));
  }, []);

  const patch = (id: string, next: Partial<DropFile>) => setFiles((fs) => fs.map((f) => (f.id === id ? { ...f, ...next } : f)));
  const run = (id: string, failAt?: number) => {
    if (prefersReducedMotion()) return patch(id, { progress: undefined, error: failAt ? "Connection lost" : undefined });
    let p = 0;
    const tick = () => {
      p = Math.min(100, p + 7 + Math.random() * 15);
      if (failAt && p >= failAt) {
        timers.current.delete(id);
        return patch(id, { progress: undefined, error: "Connection lost" });
      }
      if (p >= 100) {
        patch(id, { progress: 100 });
        timers.current.set(id, window.setTimeout(() => patch(id, { progress: undefined }), 260));
        return;
      }
      patch(id, { progress: p });
      timers.current.set(id, window.setTimeout(tick, 170 + Math.random() * 130));
    };
    timers.current.set(id, window.setTimeout(tick, 320));
  };

  const addFiles = (incoming: Omit<DropFile, "id" | "progress">[]) => {
    const added = incoming.map((f) => ({ ...f, id: `up-${++count.current}`, progress: 0 }));
    setFiles((fs) => {
      const merged = [...fs, ...added];
      while (merged.length > MAX_ROWS) {
        const old = merged.findIndex((f) => f.progress == null);
        merged.splice(old < 0 ? 0 : old, 1);
      }
      return merged;
    });
    added.forEach((f) => run(f.id, Number(f.id.slice(3)) % 4 === 2 ? 62 : undefined));
  };

  const remove = (id: string) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setFiles((fs) => fs.filter((f) => f.id !== id));
  };

  return (
    <div className="grid w-full justify-items-center gap-3">
      <Card className="grid h-[348px] w-full">
        <Dropzone
          className="flex h-full min-h-0 flex-col"
          title="Drop product photos"
          accept="image/*"
          files={files}
          listClassName="shrink-0"
          onFiles={(fs) => addFiles(fs.slice(0, MAX_ROWS).map((f) => ({ name: f.name, size: f.size, thumb: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined })))}
          onRemove={remove}
          onRetry={(id) => {
            patch(id, { progress: 0, error: undefined });
            run(id);
          }}
        />
      </Card>
      <Button size="sm" variant="ghost" onClick={() => addFiles([SAMPLES[count.current % SAMPLES.length]])}>
        Add a sample photo
      </Button>
    </div>
  );
}

const CopyScene = () => (
  <Card className="grid w-full gap-2" inset="nest">
    <CopyField label="Virtual account BCA" value="880812345678" />
    <CopyField label="Invoice" value="INV/2026/11/0482" />
  </Card>
);

const Line = () => <LineItems defaultItems={INVOICE} catalog={CATALOG} />;
const Heat = () => <YearHeatmap days={SALES_YEAR} label="Sales, last 12 months" aria-label="Daily sales, last 12 months" />;
const Waterfall = () => <MarginWaterfall periods={PERIODS} />;

/** Keeps a press on a playable piece from also opening its page. */
const Play = ({ children }: { children: React.ReactNode }) => (
  <div className="contents" onClick={(e) => e.stopPropagation()}>
    {children}
  </div>
);

export const DEMOS: Record<string, Demo> = {
  "line-items": {
    render: () => (
      <div className="w-full max-w-[640px]">
        <Line />
      </div>
    ),
    usage: () =>
      `<LineItems\n  defaultItems={[{ id: "a", name: "Gelas kopi tanah liat", qty: 12, price: 89000 }]}\n  catalog={[{ name: "Vas keramik glasir hijau", price: 210000 }]}\n  taxRate={0.11}\n  taxLabel="PPN 11%"\n  onItemsChange={save}\n/>`,
  },
  "year-heatmap": {
    render: () => (
      <div className="w-full max-w-[820px]">
        <Heat />
      </div>
    ),
    usage: () => `<YearHeatmap\n  days={days} // [{ date: new Date(2026, 0, 1), value: 2450000 }, …]\n  label="Sales, last 12 months"\n/>`,
  },
  "margin-waterfall": {
    render: () => (
      <div className="w-full max-w-[640px]">
        <Waterfall />
      </div>
    ),
    usage: () =>
      `<MarginWaterfall\n  periods={[{\n    id: "this", label: "This month", revenue: 48240000,\n    steps: [{ id: "fees", label: "Marketplace fees", short: "Fees", value: 6271000 }],\n  }]}\n/>`,
  },
};

export const TILES: TileDef[] = [
  {
    items: ["line-items"],
    render: (_, c) => (
      <div className={cn("grid min-w-0", c)}>
        <Mark name="line-items" className="grid grid-cols-1">
          <Play>
            <Line />
          </Play>
        </Mark>
      </div>
    ),
  },
  {
    items: ["year-heatmap"],
    render: (_, c) => (
      <div className={cn("grid min-w-0", c)}>
        <Mark name="year-heatmap" className="grid grid-cols-1">
          <Play>
            <Heat />
          </Play>
        </Mark>
      </div>
    ),
  },
  {
    items: ["margin-waterfall"],
    render: (_, c) => (
      <div className={cn("grid min-w-0", c)}>
        <Mark name="margin-waterfall" className="grid grid-cols-1">
          <Play>
            <Waterfall />
          </Play>
        </Mark>
      </div>
    ),
  },
];

export const MOMENTS: ShowpieceMoment[] = [
  { id: "file-upload", title: "File upload", to: "/components/dropzone", width: "max-w-[480px]", render: () => <UploadFlow /> },
  { id: "line-items", title: "Invoice line items", to: "/components/line-items", width: "max-w-[640px]", render: () => <Line /> },
  { id: "copy-field", title: "Copy field", to: "/components/copy-chip", width: "max-w-[400px]", render: () => <CopyScene /> },
  { id: "year-heatmap", title: "Year heatmap", to: "/components/year-heatmap", width: "max-w-[820px]", render: () => <Heat /> },
  { id: "margin-waterfall", title: "Margin waterfall", to: "/components/margin-waterfall", width: "max-w-[640px]", render: () => <Waterfall /> },
];
