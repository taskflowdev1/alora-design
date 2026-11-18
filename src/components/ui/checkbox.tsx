import * as React from "react";
import { Checkbox as C } from "radix-ui";
import { Check, Minus } from "react-feather";
import { cn } from "@/lib/ad";

export function Checkbox({ className, ...props }: React.ComponentProps<typeof C.Root>) {
  return (
    <C.Root
      className={cn(
        "grid size-[18px] shrink-0 cursor-pointer place-items-center rounded-small bg-fill-strong text-on-ink transition-[background-color,transform] duration-[220ms] ease-ad active:scale-90",
        "hover:bg-fill-strong data-[state=checked]:bg-on data-[state=indeterminate]:bg-on disabled:pointer-events-none disabled:opacity-45",
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
    <label htmlFor={id} className={cn("inline-flex cursor-pointer select-none items-center gap-2 text-body text-ink", className)}>
      <Checkbox id={id} {...props} />
      {label}
    </label>
  );
}
