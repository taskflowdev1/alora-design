import * as React from "react";
import { RadioGroup as R } from "radix-ui";
import { cn } from "@/lib/ad";

export function RadioGroup({ className, ...props }: React.ComponentProps<typeof R.Root>) {
  return <R.Root className={cn("grid gap-2.5", className)} {...props} />;
}

export function Radio({ label, className, ...props }: React.ComponentProps<typeof R.Item> & { label: React.ReactNode }) {
  const id = React.useId();
  return (
    <label htmlFor={id} className={cn("inline-flex cursor-pointer select-none items-center gap-2 text-body text-ink", className)}>
      <R.Item
        id={id}
        className="grid size-[18px] shrink-0 cursor-pointer place-items-center rounded-full bg-fill-strong transition-[background-color,transform] duration-[220ms] ease-ad hover:bg-fill-hover active:scale-90 data-[state=checked]:bg-on"
        {...props}
      >
        <R.Indicator className="block size-1.5 rounded-full bg-on-ink" />
      </R.Item>
      {label}
    </label>
  );
}
