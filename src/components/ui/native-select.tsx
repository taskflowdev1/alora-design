import * as React from "react";
import { ChevronDown } from "react-feather";
import { cn } from "@/lib/ad";
import { triggerClass } from "@/components/ui/select";

/**
 * The browser's own <select>, dressed exactly like our Select trigger. Closed, the two look the same; open, the phone
 * shows its own wheel or sheet. Use it for long forms on phones; everywhere else use Select (custom list, search,
 * keyboard type-ahead).
 */
export function NativeSelect({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={cn("relative inline-flex min-w-0", className)}>
      <select className={cn(triggerClass, "w-full appearance-none pr-8 [&>option]:bg-raised [&>option]:text-ink")} {...props}>
        {children}
      </select>
      <ChevronDown size={16} aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted" />
    </span>
  );
}
