import * as React from "react";
import { cn } from "@/lib/ad";

const pulse = "animate-[ad-pulse_1.6s_ease-in-out_infinite] bg-fill";

/** A pulsing block. Give it the exact size of what will load. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("rounded-item", pulse, className)} {...props} />;
}

/**
 * Renders the real content invisibly with a pulsing block on top, so the
 * skeleton is exactly the size and position of the loaded UI.
 * Pass placeholder content of the same shape while loading.
 */
export function Loading({ loading, children, className }: { loading: boolean; children: React.ReactNode; className?: string }) {
  if (!loading) return <>{children}</>;
  return (
    <span aria-busy className={cn("relative inline-flex max-w-full align-top", className)}>
      <span className="invisible inline-flex max-w-full">{children}</span>
      <span aria-hidden className={cn("absolute inset-0 rounded-small", pulse)} />
    </span>
  );
}

/** Text that pulses in place while loading: same line box, same width. */
export function LoadingText({ loading, children, className }: { loading: boolean; children: React.ReactNode; className?: string }) {
  if (!loading) return <>{children}</>;
  return (
    <span aria-busy className={cn("rounded-small text-transparent [box-decoration-break:clone] select-none", pulse, className)}>
      {children}
    </span>
  );
}
