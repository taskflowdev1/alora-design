import * as React from "react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/ad";

export interface ItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** A thumb, avatar or bare 16 px icon on the left. */
  media?: React.ReactNode;
  title: React.ReactNode;
  /** One short line under the title, only when it's needed (a SKU, an email). */
  description?: React.ReactNode;
  /** On the right: a value, a status, a button or a chevron. */
  end?: React.ReactNode;
  /** "soft" gives the row its own soft card (lists that need attention). */
  variant?: "plain" | "soft";
  /** The whole row is a link or button: hover fill, one target. */
  asChild?: boolean;
}

/**
 * The generic list row: media, title (and at most one short line), something on the right. Rows separate by space,
 * never lines; long text truncates cleanly. Build lists, menus of records and settings rows from it.
 */
export function Item({ media, title, description, end, variant = "plain", asChild, className, children, ...props }: ItemProps) {
  const Comp = asChild ? Slot.Root : "div";
  const body = (
    <>
      {media != null ? <span className="grid shrink-0 place-items-center text-ink-muted [&>svg]:size-4">{media}</span> : null}
      <span className="grid min-w-0 flex-1">
        <span className="truncate text-body text-ink">{title}</span>
        {description != null ? <span className="truncate text-small text-ink-muted">{description}</span> : null}
      </span>
      {end != null ? <span className="flex shrink-0 items-center gap-2 text-body text-ink">{end}</span> : null}
    </>
  );
  return (
    <Comp
      className={cn(
        "flex min-h-row min-w-0 items-center gap-3 rounded-item px-2.5 py-1.5 text-left",
        variant === "soft" && "bg-fill",
        asChild && "cursor-pointer transition-colors duration-[160ms] ease-ad hover:bg-fill focus-visible:bg-fill",
        asChild && variant === "soft" && "hover:bg-fill-strong",
        className,
      )}
      {...props}
    >
      {asChild && React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ children?: React.ReactNode }>, undefined, body)
        : body}
    </Comp>
  );
}

/** A list of items with a 1 px breathing gap (no lines). */
export function ItemList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-px", className)} {...props} />;
}
