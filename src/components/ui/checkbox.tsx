import * as React from "react";
import { Checkbox as C } from "radix-ui";
import { Check, Minus } from "react-feather";
import { cn } from "@/lib/ad";

export function Checkbox({ className, ...props }: React.ComponentProps<typeof C.Root>) {
  return (
    <C.Root
      className={cn(
        "ad-hit grid size-[18px] shrink-0 cursor-pointer place-items-center rounded-small bg-fill-strong text-on-ink ad-press active:scale-[0.97]",
        "data-[state=checked]:bg-on data-[state=indeterminate]:bg-on hover:bg-ink-muted focus-visible:bg-ink-muted data-[state=checked]:hover:bg-ink-muted data-[state=indeterminate]:hover:bg-ink-muted data-[state=checked]:focus-visible:bg-ink-muted data-[state=indeterminate]:focus-visible:bg-ink-muted disabled:pointer-events-none disabled:opacity-45",
        className,
      )}
      {...props}
    >
      <C.Indicator className="grid place-items-center [--ad-icon-stroke:2.5]">
        {props.checked === "indeterminate" ? <Minus size={12} /> : <Check size={12} />}
      </C.Indicator>
    </C.Root>
  );
}

/** Checkbox with its label right next to it; the whole row is the target. */
export function CheckboxField({ label, className, ...props }: React.ComponentProps<typeof C.Root> & { label: React.ReactNode }) {
  const id = React.useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        "-mx-1.5 -my-[3px] inline-flex cursor-pointer select-none items-center gap-2 rounded-item px-1.5 py-[3px] text-body text-ink transition-colors duration-[150ms] ease-ad hover:bg-fill has-[:focus-visible]:bg-fill",
        className,
      )}
    >
      <Checkbox id={id} {...props} />
      {label}
    </label>
  );
}
