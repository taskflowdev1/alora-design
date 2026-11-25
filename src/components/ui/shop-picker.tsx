import { Popover as P } from "radix-ui";
import { ChevronDown } from "react-feather";
import { HoldLabel, SlidingPill } from "@/components/ui/sliding-pill";
import { cn } from "@/lib/ad";
import { usePopupOpen } from "@/lib/ad-hooks";
import { Checkbox } from "@/components/ui/checkbox";
import { dropdownSurface, triggerClass, usePressOpen } from "@/components/ui/select";
import { MarketMark, marketLabel, type Market } from "@/components/ui/marketplace-mark";

export interface Shop {
  id: string;
  name: string;
  market: Market;
}

export interface ShopPickerProps {
  shops: Shop[];
  /** Selected shop ids. All selected reads "All shops". */
  value: string[];
  onValueChange: (ids: string[]) => void;
  /** Markets that get a one-click "Only …" button. */
  quick?: Market[];
  className?: string;
}

/** Shops with their marketplace marks, plus one-click "Only Shopee" / "Only TikTok". */
export function ShopPicker({ shops, value, onValueChange, quick = ["shopee", "tiktok"], className }: ShopPickerProps) {
  const all = value.length === shops.length;
  const only = quick.find((m) => {
    const ids = shops.filter((s) => s.market === m).map((s) => s.id);
    return ids.length && value.length === ids.length && ids.every((id) => value.includes(id));
  });
  const markets = [...new Set(shops.filter((s) => value.includes(s.id)).map((s) => s.market))];
  const label = all ? "All shops" : only ? `${marketLabel(only)} only` : value.length === 1 ? shops.find((s) => s.id === value[0])?.name : value.length ? `${value.length} shops` : "No shops";
  const [open, setOpen] = usePopupOpen();
  const press = usePressOpen(open, setOpen);
  const toggle = (id: string) => onValueChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  const quickBtn = (active: boolean) =>
    cn(
      "relative inline-flex h-item shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-control px-bubble text-body ad-press active:scale-[0.97]",
      active ? "font-medium text-ink" : "text-ink-muted hover:bg-fill focus-visible:bg-fill hover:text-ink focus-visible:text-ink",
    );

  return (
    <P.Root open={open} onOpenChange={setOpen}>
      <P.Trigger {...press} data-ad-anchor="" className={cn(triggerClass, className)} aria-label="Shops">
        <span className="flex shrink-0 items-center gap-[4px]">
          {(all || !markets.length ? [...new Set(shops.map((s) => s.market))] : markets).slice(0, 3).map((m) => (
            <MarketMark key={m} market={m} />
          ))}
        </span>
        <span translate={value.length === 1 && !only && !all ? "no" : undefined} className="truncate">
          {label}
        </span>
        <ChevronDown size={16} className="ml-auto shrink-0 text-ink-muted" />
      </P.Trigger>
      <P.Portal>
        <P.Content align="start" sideOffset={6} collisionPadding={8} onEscapeKeyDown={() => setOpen(false, true)} className={cn(dropdownSurface, "w-[320px]")}>
          <div className="relative flex flex-wrap gap-1 pb-nest">
            <SlidingPill selector='[aria-pressed="true"]' className="rounded-control bg-fill-strong" />
            <button type="button" aria-pressed={all} className={quickBtn(all)} onClick={() => onValueChange(shops.map((s) => s.id))}>
              <HoldLabel>All</HoldLabel>
            </button>
            {quick.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={only === m}
                className={quickBtn(only === m)}
                onClick={() => onValueChange(shops.filter((s) => s.market === m).map((s) => s.id))}
              >
                <HoldLabel>
                  <MarketMark market={m} size={14} />
                  Only {marketLabel(m).replace(" Shop", "")}
                </HoldLabel>
              </button>
            ))}
          </div>
          <div className="grid gap-px">
            {shops.map((s) => (
              <label key={s.id} className="flex h-item cursor-pointer select-none items-center gap-2.5 rounded-control px-2.5 text-body hover:bg-fill has-[:focus-visible]:bg-fill">
                <Checkbox checked={value.includes(s.id)} onCheckedChange={() => toggle(s.id)} />
                <MarketMark market={s.market} />
                <span translate="no" className="min-w-0 flex-1 truncate">
                  {s.name}
                </span>
              </label>
            ))}
          </div>
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}
