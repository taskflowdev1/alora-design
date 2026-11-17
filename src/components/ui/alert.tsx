import * as React from "react";
import { AlertCircle, Info } from "react-feather";
import { cn } from "@/lib/ad";

export interface AlertProps {
  tone?: "neutral" | "attention" | "danger";
  title: React.ReactNode;
  /** A second line. Without it the alert is one line and everything centres on it. */
  children?: React.ReactNode;
  /** One action on the right, such as a Button size="sm". */
  action?: React.ReactNode;
  className?: string;
}

const tones = {
  neutral: { box: "bg-fill text-ink", icon: "text-ink-muted", Icon: Info },
  attention: { box: "bg-brand-soft text-ink", icon: "text-brand-soft-ink", Icon: Info },
  danger: { box: "bg-danger-soft text-ink", icon: "text-danger", Icon: AlertCircle },
};

/**
 * One line: icon, text and action share one centre line.
 * Two lines: the icon and the action sit on the first line, never centred on the block.
 * Padding is the same on every side; with an action the right side matches the button's inset.
 */
export function Alert({ tone = "neutral", title, children, action, className }: AlertProps) {
  const t = tones[tone];
  const multi = children != null && children !== false;
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex gap-2.5 rounded-card pl-3.5 text-body",
        multi ? "items-start py-3 pr-3.5" : "min-h-[calc(var(--ad-item-h)+var(--ad-nest)*4)] items-center py-[calc(var(--ad-nest)*2)]",
        !multi && (action ? "pr-[calc(var(--ad-nest)*2)]" : "pr-3.5"),
        t.box,
        className,
      )}
    >
      <span className={cn("flex h-5 shrink-0 items-center", t.icon)}>
        <t.Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-5">{title}</p>
        {multi ? <div className="mt-0.5 leading-5 text-ink-muted">{children}</div> : null}
      </div>
      {action ? <div className={cn("flex shrink-0 items-center", multi && "-my-1.5 h-8")}>{action}</div> : null}
    </div>
  );
}
