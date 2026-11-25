import * as React from "react";
import { Switch as S } from "radix-ui";
import { cn } from "@/lib/ad";

const sizes = {
  default: { root: "h-[20px] w-[36px]", thumb: "size-[16px] data-[state=checked]:translate-x-[16px]" },
  /** Beside 36 px controls in settings rows. */
  lg: { root: "h-[24px] w-[44px]", thumb: "size-[20px] data-[state=checked]:translate-x-[20px]" },
};

/**
 * Toggle: a circular thumb inside a pill track. The shapes match: track radius = thumb radius + inset.
 * Neutral, never the accent: on = switch-on (ink in light, a light grey in dark), off = fill-strong, and the thumb stays
 * white in both themes. All three are steps of the grey ramp.
 */
export function Switch({ size = "default", className, ...props }: React.ComponentProps<typeof S.Root> & { size?: keyof typeof sizes }) {
  return (
    <S.Root
      className={cn(
        "group relative inline-flex shrink-0 cursor-pointer items-center rounded-full p-[2px] after:absolute after:-inset-[2px] after:rounded-full [transition:background-color_220ms_var(--ad-ease),transform_150ms_var(--ad-ease),scale_150ms_var(--ad-ease)] active:scale-[0.97]",
        "bg-fill-strong data-[state=checked]:bg-switch-on disabled:pointer-events-none disabled:opacity-45",
        "hover:bg-ink-muted focus-visible:bg-ink-muted data-[state=checked]:hover:bg-ink-muted data-[state=checked]:focus-visible:bg-ink-muted dark:data-[state=checked]:hover:bg-ink dark:data-[state=checked]:focus-visible:bg-ink",
        sizes[size].root,
        className,
      )}
      {...props}
    >
      <S.Thumb className={cn("block rounded-full bg-thumb shadow-thumb transition-[translate,background-color] duration-[220ms] ease-ad data-[state=checked]:bg-switch-thumb", sizes[size].thumb)} />
    </S.Root>
  );
}
