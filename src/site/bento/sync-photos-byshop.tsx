import * as React from "react";
import { Box, RefreshCw } from "react-feather";
import { cn, formatRp } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading, LoadingText } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toast";
import { DateRangePicker, DEFAULT_PRESETS, type DateRange } from "@/components/ui/date-range-picker";
import { MarketMark } from "@/components/ui/marketplace-mark";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Sparkline } from "@/components/ui/sparkline";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Dropzone, type DropFile } from "@/components/ui/dropzone";
import { TagInput } from "@/components/ui/tag-input";
import { NOW, SPARK } from "../data";
import { type Market, useBusy } from "./shared";

/* ------------------------------------------------------------ B17 sync */

export function SyncCard({ className }: { className?: string }) {
  const [syncing, setSyncing] = React.useState(false);
  const rings: [Market | "tokopedia", string, number][] = [
    ["shopee", "Shopee", 100],
    ["tiktok", "TikTok", 72],
    ["tokopedia", "Tokopedia", 38],
  ];
  return (
    <Card className={cn("flex min-w-0 flex-col gap-4", className)}>
      <CardHeader
        title="Stock sync"
        action={
          <Tooltip content="Last full sync 09:40">
            <Button
              variant="ghost"
              icon
              aria-label="Sync now"
              onClick={() => {
                setSyncing(true);
                toast("Syncing 7 shops", "neutral");
                window.setTimeout(() => setSyncing(false), 1200);
              }}
            >
              <RefreshCw className={cn(syncing && "animate-spin")} />
            </Button>
          </Tooltip>
        }
      />
      <Alert title="2 shops haven’t synced since 09:40" />
      <div className="grid grid-cols-3 gap-2">
        {rings.map(([m, l, v]) => (
          <div key={m} className="grid justify-items-center gap-2 rounded-item bg-fill py-3">
            <ProgressRing value={v} size={48} aria-label={`${l} synced`} />
            <span className="flex items-center gap-1.5 text-body">
              <MarketMark market={m} size={14} />
              {l}
            </span>
          </div>
        ))}
      </div>
      {/* At the card's foot: when the band is taller than this card, the room sits between the rings and the bar. */}
      <div className="mt-auto grid gap-2 text-body">
        <div className="flex justify-between">
          <span>Adding up 1.240 sales</span>
          <span className="tabular-nums text-ink-muted">64%</span>
        </div>
        <Progress value={64} aria-label="Adding up sales" />
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------ B18 photos and tags */

export function PhotosCard({ className }: { className?: string }) {
  const [files, setFiles] = React.useState<DropFile[]>([
    { id: "a", name: "gelas-kopi-hijau.jpg", size: 1840000 },
    { id: "b", name: "gelas-kopi-set.jpg", size: 2310000, progress: 64 },
  ]);
  const [tags, setTags] = React.useState(["Keramik", "Handmade"]);
  return (
    <Card className={cn("flex min-w-0 flex-col gap-4", className)}>
      <CardHeader title="Gelas kopi tanah liat" />
      <div className="grid gap-2">
        <Dropzone
          title="Drop product photos"
          accept="image/*"
          files={files}
          onRemove={(id) => setFiles(files.filter((f) => f.id !== id))}
          onFiles={(fs) => setFiles([...files, ...fs.map((f, i) => ({ id: `${Date.now()}-${i}`, name: f.name, size: f.size }))])}
        />
        <TagInput aria-label="Tags" value={tags} onValueChange={setTags} suggestions={["Rotan", "Kayu jati", "Bambu", "Best seller", "Pre-order"]} />
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------ B19 sales by shop */

export function ByShopCard({ className }: { className?: string }) {
  const [range, setRange] = React.useState<DateRange>(DEFAULT_PRESETS[2].range(NOW));
  const [channels, setChannels] = React.useState<string[]>(["offline", "shopee", "tiktok"]);
  const [loading, kick] = useBusy();
  const rows: [Market, string, number, number[]][] = [
    ["offline", "Kemang", 12400000, SPARK],
    ["offline", "Senopati", 9800000, [9, 11, 10, 9, 12, 11, 10, 9, 11, 10, 12, 11]],
    ["shopee", "Rimba Official", 8900000, [6, 7, 9, 8, 10, 12, 11, 13, 12, 14, 15, 16]],
    ["offline", "Dago", 7100000, [14, 13, 12, 12, 11, 10, 11, 9, 9, 8, 8, 7]],
    ["offline", "Darmo", 5200000, [7, 6, 8, 7, 6, 7, 5, 6, 6, 5, 6, 5]],
    ["tiktok", "Rimba Live", 4800000, [3, 4, 4, 6, 5, 7, 8, 7, 9, 10, 9, 11]],
  ];
  return (
    <Card inset="nest" className={cn("flex min-w-0 flex-col gap-nest", className)}>
      <div className="flex min-h-control flex-wrap items-center justify-between gap-gap px-2 pt-2">
        <h3 className="text-title font-semibold">By shop</h3>
        <DateRangePicker value={range} onValueChange={(r) => (setRange(r), kick())} today={NOW} />
      </div>
      <ToggleGroup
        aria-label="Channels"
        value={channels}
        onValueChange={(v) => (setChannels(v), kick())}
        className="mx-2 w-fit"
        options={[
          { value: "offline", label: <><MarketMark market="offline" />Shops</> },
          { value: "shopee", label: <><MarketMark market="shopee" />Shopee</> },
          { value: "tiktok", label: <><MarketMark market="tiktok" />TikTok</> },
        ]}
      />
      <div className="grid gap-px">
        {rows
          .filter(([m]) => channels.includes(m))
          .map(([m, s, v, d]) => (
            <div key={s} className="flex min-h-row items-center gap-3 rounded-item px-2">
              <MarketMark market={m} />
              <span className="min-w-0 flex-1 truncate text-body">{s}</span>
              <Loading loading={loading}>
                <Sparkline data={d} width={72} height={22} aria-label={`${s}, last 12 weeks`} />
              </Loading>
              <span className="w-30 shrink-0 whitespace-nowrap text-right text-body font-medium tabular-nums">
                <LoadingText loading={loading}>{formatRp(v)}</LoadingText>
              </span>
            </div>
          ))}
        {channels.length === 0 ? <EmptyState icon={Box} title="No channel picked" className="py-6" /> : null}
      </div>
    </Card>
  );
}
