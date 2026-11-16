import * as React from "react";
import { cn } from "@/lib/ad";
import { PopoverGroup } from "@/components/ui/popover";

/** Every control in a toolbar shares one height and one centre line. Popovers in it never stack. */
export function Toolbar({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <PopoverGroup>
      <div role="toolbar" className={cn("flex min-h-control flex-wrap items-center gap-2", className)}>
        {children}
      </div>
    </PopoverGroup>
  );
}

export function ToolbarSpacer() {
  return <span aria-hidden className="flex-1" />;
}

/** The same header on every page: the title, then the page's actions on the right. */
export function PageHeader({ title, children, className }: { title: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-control flex-wrap items-center gap-3", className)}>
      <h1 className="mr-auto truncate text-heading font-semibold text-ink">{title}</h1>
      {children}
    </div>
  );
}
