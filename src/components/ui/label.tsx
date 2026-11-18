import * as React from "react";
import { Label as L } from "radix-ui";
import { cn } from "@/lib/ad";

/**
 * The one label style: body size, grey, regular weight, right next to its control. `required` adds a quiet dot,
 * not a red star. Field uses the same look; use Label on its own beside a checkbox, switch or custom control.
 */
export function Label({ required, className, children, ...props }: React.ComponentProps<typeof L.Root> & { required?: boolean }) {
  return (
    <L.Root className={cn("inline-flex cursor-pointer select-none items-center gap-1.5 text-body text-ink-muted peer-disabled:opacity-45", className)} {...props}>
      {children}
      {required ? <span aria-label="required" className="size-1 rounded-full bg-ink-muted" /> : null}
    </L.Root>
  );
}
