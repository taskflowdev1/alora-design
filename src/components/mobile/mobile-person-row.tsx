import * as React from "react";
import { ChevronRight } from "react-feather";
import { cn } from "@/lib/ad";
import { Avatar } from "@/components/ui/avatar";
import { CountBadge } from "./mobile-badge";

export interface MobilePersonRowProps {
  name: string;
  /** Photo URL; initials otherwise. */
  src?: string;
  /** One line under the name (last message, role, phone). */
  subtitle?: React.ReactNode;
  /** Top right: a time ("14:05"), a total. */
  meta?: React.ReactNode;
  /** Unread count under the meta. */
  unread?: number;
  /** Something instead of the avatar's initials: a marketplace mark as a small corner badge. */
  badge?: React.ReactNode;
  chevron?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * A person in a list (customer, buyer, teammate): a 40 px circle, the name, one line under it, and on the right the
 * time over an unread count. People are circles; the whole row is one target. Unread rows set the name in medium.
 */
export function MobilePersonRow({ name, src, subtitle, meta, unread, badge, chevron, onClick, className }: MobilePersonRowProps) {
  const body = (
    <>
      <span className="relative shrink-0">
        <Avatar name={name} src={src} className="size-[40px] text-[15px]" />
        {badge ? <span className="absolute -bottom-0.5 -right-0.5 flex">{badge}</span> : null}
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className={cn("truncate text-[15px] text-ink", unread ? "font-medium" : null)}>{name}</span>
        {subtitle ? <span className={cn("truncate text-[13px]", unread ? "text-ink" : "text-ink-muted")}>{subtitle}</span> : null}
      </span>
      {meta != null || unread ? (
        <span className="grid shrink-0 justify-items-end gap-1">
          {meta != null ? <span className="text-[13px] tabular-nums text-ink-muted">{meta}</span> : null}
          <CountBadge count={unread} aria-label="unread" />
        </span>
      ) : null}
      {chevron ? <ChevronRight size={18} className="-mr-1 shrink-0 text-ink-muted" /> : null}
    </>
  );
  const row = cn("flex min-h-[60px] w-full min-w-0 items-center gap-3 rounded-item px-[calc(var(--ad-pad)-var(--ad-nest))] py-2 text-left", className);
  return (
    <div role="listitem" className="flex min-w-0">
      {onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        row,
        "cursor-pointer touch-manipulation select-none transition-[background-color,transform] duration-[120ms] ease-ad [-webkit-tap-highlight-color:transparent] active:scale-[0.99] active:bg-fill focus-visible:bg-fill [@media(hover:hover)]:hover:bg-fill",
      )}
    >
      {body}
    </button>
  ) : (
    <div className={row}>{body}</div>
      )}
    </div>
  );
}
