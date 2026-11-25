import * as React from "react";
import { ToggleGroup as T } from "radix-ui";
import { cn } from "@/lib/ad";
import { HoldLabel, SlidingPill } from "@/components/ui/sliding-pill";

type Option = { value: string; label: React.ReactNode; "aria-label"?: string };

export type ToggleGroupProps = {
  options: Option[];
  className?: string;
  "aria-label"?: string;
} & (
  | { type?: "multiple"; value: string[]; onValueChange: (value: string[]) => void }
  /** One of N (alignment, view): the raised pill slides to the new choice, and the choice can't be cleared. */
  | { type: "single"; value: string; onValueChange: (value: string) => void }
);

/**
 * On/off choices in one track: several at once (default), or one of N with `type="single"`.
 * Pressed items get the raised pill (sel + shadow-sel) on the grey track, in ink and medium; the rest stay muted and
 * regular. Track and pills are concentric.
 */
export function ToggleGroup(props: ToggleGroupProps) {
  const { options, className } = props;
  const single = props.type === "single";
  const item = (o: Option) => (
    <T.Item
      key={o.value}
      value={o.value}
      aria-label={o["aria-label"]}
      className={cn(
        "relative inline-flex cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-item px-bubble text-body transition-[background-color,color,box-shadow,transform,scale,filter] duration-[150ms] ease-ad active:scale-[0.97] [&_svg]:size-[16px]",
        "text-ink-muted data-[state=off]:hover:text-ink data-[state=off]:focus-visible:text-ink data-[state=on]:font-medium data-[state=on]:text-ink",
        single
          ? "data-[state=off]:focus-visible:bg-fill-strong"
          : "data-[state=off]:focus-visible:bg-fill-strong data-[state=on]:bg-sel data-[state=on]:shadow-sel data-[state=on]:hover:brightness-[0.94] dark:data-[state=on]:hover:brightness-[0.85] data-[state=on]:focus-visible:brightness-[0.88] dark:data-[state=on]:focus-visible:brightness-[0.78]",
      )}
    >
      <HoldLabel>{o.label}</HoldLabel>
    </T.Item>
  );
  const track = cn("relative inline-flex h-control shrink-0 items-stretch gap-nest rounded-control bg-track p-nest", className);
  if (props.type === "single") {
    const { value, onValueChange } = props;
    return (
      <T.Root type="single" value={value} onValueChange={(v) => v && onValueChange(v)} aria-label={props["aria-label"]} className={track}>
        <SlidingPill selector='[data-state="on"]' className="rounded-item bg-sel shadow-sel" />
        {options.map(item)}
      </T.Root>
    );
  }
  return (
    <T.Root type="multiple" value={props.value} onValueChange={props.onValueChange} aria-label={props["aria-label"]} className={track}>
      {options.map(item)}
    </T.Root>
  );
}
