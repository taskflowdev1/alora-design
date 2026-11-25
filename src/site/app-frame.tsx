import * as React from "react";
import { cn } from "@/lib/ad";

const FRAME = {
  "--frame-inset": "calc(var(--ad-nest) * 2)",
  "--frame-r": "calc(var(--ad-radius-card) + min(var(--ad-radius-card) * 99, var(--frame-inset)))",
} as React.CSSProperties;

/**
 * One rounded window: the sidebar and the main panel are rounded panels inside it, one inset from its edge, so the app
 * reads as a single thing on the page. Below lg (no sidebar column) the window dissolves and the content uses the width.
 */
export function AppFrame({ sidebar, children, className, mainClassName }: { sidebar?: React.ReactNode; children: React.ReactNode; className?: string; mainClassName?: string }) {
  return (
    <div
      data-app-frame
      style={FRAME}
      className={cn("flex min-h-0 w-full gap-[var(--frame-inset)] rounded-[var(--frame-r)] bg-surface p-[var(--frame-inset)] shadow-card max-lg:block max-lg:rounded-none max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none", className)}
    >
      {sidebar}
      <div data-app-main className={cn("relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-card bg-page max-lg:h-full max-lg:overflow-visible max-lg:rounded-none max-lg:bg-transparent", mainClassName)}>
        {children}
      </div>
    </div>
  );
}
