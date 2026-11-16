import * as React from "react";
import { Switch as S } from "radix-ui";
import { cn } from "@/lib/ad";

/** Toggle: a circular thumb inside a pill track. The shapes match: track radius = thumb radius + inset. */
export function Switch({ className, ...props }: React.ComponentProps<typeof S.Root>) {
  return (
    <S.Root
      className={cn(
        "group inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-[background-color,transform] duration-[220ms] ease-ad active:scale-95",
        "bg-fill-strong hover:bg-fill-strong/80 data-[state=checked]:bg-on disabled:pointer-events-none disabled:opacity-45",
        className,
      )}
      {...props}
    >
      <S.Thumb className="block size-4 rounded-full bg-thumb shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform duration-[220ms] ease-ad data-[state=checked]:translate-x-4" />
    </S.Root>
  );
}
