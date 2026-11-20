import * as React from "react";
import { cn } from "@/lib/ad";

// fill on a surface in light; in dark, fill sits too close to the surface at the pulse's low point, so it takes fill-strong.
// On a fill surface (attention rows, a filled card) pass `onFill`: the bar is fill-strong in both themes.
const pulse = (onFill?: boolean) => cn("animate-ad-pulse", onFill ? "bg-fill-strong" : "bg-fill dark:bg-fill-strong");

export interface SkeletonToneProps {
  /** The skeleton sits on a fill (not a surface): the bar takes fill-strong so it still shows. */
  onFill?: boolean;
}

/** A pulsing block. Give it the exact size of what will load. */
export function Skeleton({ className, onFill, ...props }: React.HTMLAttributes<HTMLDivElement> & SkeletonToneProps) {
  return <div aria-hidden className={cn("rounded-item", pulse(onFill), className)} {...props} />;
}

/**
 * Renders the real content invisibly with a pulsing block on top, so the
 * skeleton is exactly the size and position of the loaded UI.
 * Pass placeholder content of the same shape while loading.
 */
export function Loading({ loading, onFill, children, className }: { loading: boolean; children: React.ReactNode; className?: string } & SkeletonToneProps) {
  if (!loading) return <>{children}</>;
  return (
    <span aria-busy className={cn("relative inline-flex max-w-full align-top", className)}>
      <span className="invisible inline-flex max-w-full">{children}</span>
      <span aria-hidden className={cn("absolute inset-0 rounded-small", pulse(onFill))} />
    </span>
  );
}

/** Text that pulses in place while loading: same line box, same width. */
export function LoadingText({ loading, onFill, children, className }: { loading: boolean; children: React.ReactNode; className?: string } & SkeletonToneProps) {
  if (!loading) return <>{children}</>;
  return (
    <span aria-busy className={cn("rounded-small text-transparent [box-decoration-break:clone] select-none", pulse(onFill), className)}>
      {children}
    </span>
  );
}
