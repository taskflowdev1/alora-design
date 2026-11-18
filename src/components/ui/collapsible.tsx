import * as React from "react";
import { Collapsible as C } from "radix-ui";
import { ChevronDown } from "react-feather";
import { cn } from "@/lib/ad";

export interface CollapsibleProps extends Omit<React.ComponentProps<typeof C.Root>, "title"> {
  /** The row that opens it: whole row is the target, the chevron turns. */
  title: React.ReactNode;
  /** Something on the right of the row, before the chevron (a count, a status). */
  meta?: React.ReactNode;
}

/**
 * One section that opens and closes in place. The trigger row gets the hover fill; the body slides open (height
 * eases out). For detail people rarely need, never for a data table (show tables as sections).
 */
export function Collapsible({ title, meta, className, children, ...props }: CollapsibleProps) {
  return (
    <C.Root className={cn("grid", className)} {...props}>
      <C.Trigger className="group flex h-row w-full cursor-pointer select-none items-center gap-2 rounded-item px-2.5 text-left text-body text-ink transition-colors duration-[160ms] ease-ad hover:bg-fill">
        <span className="min-w-0 flex-1 truncate font-medium">{title}</span>
        {meta != null ? <span className="shrink-0 text-ink-muted">{meta}</span> : null}
        <ChevronDown size={16} className="shrink-0 text-ink-muted transition-transform duration-[220ms] ease-ad group-data-[state=open]:rotate-180" />
      </C.Trigger>
      <C.Content className="ad-collapse overflow-hidden">
        <div className="px-2.5 pb-2 pt-1 text-body text-ink">{children}</div>
      </C.Content>
      <style href="ad-collapse" precedence="default">{COLLAPSE_CSS}</style>
    </C.Root>
  );
}

/** Height animation for Radix collapsible/accordion content (shared with Accordion). */
export const COLLAPSE_CSS = `
.ad-collapse[data-state=open] { animation: ad-collapse-open 220ms var(--ad-ease); }
.ad-collapse[data-state=closed] { animation: ad-collapse-close 160ms ease-in; }
@keyframes ad-collapse-open { from { height: 0; opacity: 0; } to { height: var(--radix-collapsible-content-height, var(--radix-accordion-content-height)); opacity: 1; } }
@keyframes ad-collapse-close { from { height: var(--radix-collapsible-content-height, var(--radix-accordion-content-height)); opacity: 1; } to { height: 0; opacity: 0; } }`;
