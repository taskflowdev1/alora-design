import { Popover as P } from "radix-ui";
import { ChevronDown } from "react-feather";
import { cn } from "@/lib/ad";
import { Checkbox } from "@/components/ui/checkbox";
import { dropdownSurface, triggerClass } from "@/components/ui/select";
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
  const toggle = (id: string) => onValueChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  const quickBtn = (active: boolean) =>
    cn(
      "inline-flex h-item shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-control px-bubble text-body transition-[background-color,transform] duration-[160ms] ease-ad active:scale-[0.96]",
      active ? "bg-fill-hover text-ink" : "text-ink-muted hover:bg-fill hover:text-ink",
    );

  return (
    <P.Root>
      <P.Trigger className={cn(triggerClass, className)} aria-label="Shops">
        <span className="flex shrink-0 items-center gap-0.5">
          {(all || !markets.length ? [...new Set(shops.map((s) => s.market))] : markets).slice(0, 3).map((m) => (
            <MarketMark key={m} market={m} />
          ))}
        </span>
        <span className="truncate">{label}</span>
        <ChevronDown size={16} className="ml-auto shrink-0 text-ink-muted" />
      </P.Trigger>
      <P.Portal>
        <P.Content align="start" sideOffset={6} collisionPadding={8} className={cn(dropdownSurface, "w-80")}>
          <div className="flex flex-wrap gap-1 pb-nest">
            <button type="button" className={quickBtn(all)} onClick={() => onValueChange(shops.map((s) => s.id))}>
              All
            </button>
            {quick.map((m) => (
              <button
                key={m}
                type="button"
                className={quickBtn(only === m)}
                onClick={() => onValueChange(shops.filter((s) => s.market === m).map((s) => s.id))}
              >
                <MarketMark market={m} size={14} />
                Only {marketLabel(m).replace(" Shop", "")}
              </button>
            ))}
          </div>
          <div className="grid gap-px">
            {shops.map((s) => (
              <label key={s.id} className="flex h-item cursor-pointer select-none items-center gap-2.5 rounded-control px-2.5 text-body hover:bg-fill">
                <Checkbox checked={value.includes(s.id)} onCheckedChange={() => toggle(s.id)} />
                <MarketMark market={s.market} />
                <span className="min-w-0 flex-1 truncate">{s.name}</span>
              </label>
            ))}
          </div>
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}
