import * as React from "react";
import { Switch as S } from "radix-ui";
import { cn } from "@/lib/ad";

const sizes = {
  default: { root: "h-5 w-9", thumb: "size-4 data-[state=checked]:translate-x-4" },
  /** Beside 36 px controls in settings rows. */
  lg: { root: "h-6 w-11", thumb: "size-5 data-[state=checked]:translate-x-5" },
};

/**
 * Toggle: a circular thumb inside a pill track. The shapes match: track radius = thumb radius + inset.
 * On = solid ink track with an on-ink thumb, so it reads in both themes (never white on white).
 */
export function Switch({ size = "default", className, ...props }: React.ComponentProps<typeof S.Root> & { size?: keyof typeof sizes }) {
  return (
    <S.Root
      className={cn(
        "group inline-flex shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-[background-color,transform] duration-[220ms] ease-ad active:scale-95",
        "bg-fill-strong data-[state=unchecked]:hover:bg-fill-strong/80 data-[state=checked]:bg-on disabled:pointer-events-none disabled:opacity-45",
        sizes[size].root,
        className,
      )}
      {...props}
    >
      <S.Thumb className={cn("block rounded-full bg-thumb shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-[transform,background-color] duration-[220ms] ease-ad data-[state=checked]:bg-on-ink", sizes[size].thumb)} />
    </S.Root>
  );
}
