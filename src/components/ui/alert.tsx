import * as React from "react";
import { AlertCircle, Info } from "react-feather";
import { cn } from "@/lib/ad";

export interface AlertProps {
  tone?: "neutral" | "attention" | "danger";
  title: React.ReactNode;
  children?: React.ReactNode;
  /** One action on the right, such as a Button. */
  action?: React.ReactNode;
  className?: string;
}

const tones = {
  neutral: { box: "bg-fill text-ink", icon: "text-ink-muted", Icon: Info },
  attention: { box: "bg-brand-soft text-ink", icon: "text-brand-soft-ink", Icon: Info },
  danger: { box: "bg-danger-soft text-ink", icon: "text-danger", Icon: AlertCircle },
};

/** The icon sits on the first line of text, never centred on a two-line message. */
export function Alert({ tone = "neutral", title, children, action, className }: AlertProps) {
  const t = tones[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex items-start gap-2.5 rounded-card px-3.5 py-3", t.box, className)}>
      <span className={cn("flex h-[1.45em] shrink-0 items-center", t.icon)}>
        <t.Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        {children ? <div className="text-ink-muted">{children}</div> : null}
      </div>
      {action ? <div className="-my-1 shrink-0">{action}</div> : null}
    </div>
  );
}
