import * as React from "react";
import { cn } from "@/lib/ad";

export interface MarkerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** A bare 16 px Feather icon before the text. */
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  /**
   * "note": an inline status line in the conversation ("Changed the courier to JNE").
   * "soft": the same on its own soft card, for something worth a second look.
   * "label": a centred chip marking a point in the thread ("Today"); space on both sides, never a rule.
   */
  variant?: "note" | "soft" | "label";
  /** Still happening: it's announced politely as it changes. */
  live?: boolean;
}

/** A quiet note inside a conversation: what the agent did, or where the day changed. Muted, small, icon-led. */
export function Marker({ icon: Icon, variant = "note", live, className, children, ...props }: MarkerProps) {
  return (
    <div
      role={live ? "status" : undefined}
      className={cn(
        "flex min-w-0 items-center gap-2 text-body text-ink-muted",
        variant === "soft" && "w-fit max-w-full rounded-item bg-fill px-2.5 py-1.5",
        variant === "label" && "mx-auto w-fit rounded-full bg-fill px-bubble-sm py-0.5 text-small",
        className,
      )}
      {...props}
    >
      {Icon ? <Icon size={variant === "label" ? 12 : 16} className="shrink-0" /> : null}
      <span className="min-w-0 truncate">{children}</span>
    </div>
  );
}
