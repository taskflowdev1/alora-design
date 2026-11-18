import * as React from "react";
import { cn } from "@/lib/ad";
import { fieldBoxClass } from "@/components/ui/input";

export interface InputGroupProps {
  /** Before the value: an icon, a unit ("Rp"), a prefix ("https://"). Muted. */
  start?: React.ReactNode;
  /** After the value: a unit, a kbd hint or a small button (it sits one nest gap in, concentric). */
  end?: React.ReactNode;
  invalid?: boolean;
  className?: string;
  children: React.ReactElement;
}

/**
 * An input with things attached inside the same soft field: units, prefixes, icons, a button. One field, one fill,
 * one focus tint; nothing outlined. The child is a bare <input> (or textarea) that takes the rest.
 */
export function InputGroup({ start, end, invalid, className, children }: InputGroupProps) {
  return (
    <label className={cn(fieldBoxClass(invalid), "cursor-text", end != null && "pr-nest", className)}>
      {start != null ? <span className="flex shrink-0 items-center gap-1 text-ink-muted [&_svg]:size-4">{start}</span> : null}
      {React.cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: cn("h-full w-full min-w-0 bg-transparent text-ink outline-none placeholder:text-ink-muted", (children.props as { className?: string }).className),
      })}
      {end != null ? <span className="flex shrink-0 items-center gap-1 text-ink-muted [&_button]:h-[calc(var(--ad-control-h)-var(--ad-nest)*2)] [&_button]:rounded-item">{end}</span> : null}
    </label>
  );
}
