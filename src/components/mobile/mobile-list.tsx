import * as React from "react";
import { ChevronRight } from "react-feather";
import { cn } from "@/lib/ad";

export interface MobileListProps {
  /** A plain heading above the group. */
  title?: string;
  /** "inset" (default): a soft rounded card with margin. "plain": rows run edge to edge on the page. */
  variant?: "inset" | "plain";
  children: React.ReactNode;
  className?: string;
}

/**
 * A grouped list: rows on one soft card, inset from the screen edge, no lines between them. The row height and the
 * press fill do the separating. Titles sit above the card, never inside it.
 */
export function MobileList({ title, variant = "inset", children, className }: MobileListProps) {
  return (
    <section className={cn("grid gap-1.5", variant === "inset" && "px-pad", className)}>
      {title ? <h2 className="px-1 text-[13px] text-ink-muted">{title}</h2> : null}
      <div role="list" className={cn("grid", variant === "inset" ? "rounded-card bg-surface p-nest" : "px-nest")}>
        {children}
      </div>
    </section>
  );
}

export interface MobileListRowProps {
  /** A Feather icon (20 px) or a thumbnail / avatar node. */
  media?: React.ReactNode;
  title: React.ReactNode;
  /** A second line under the title. */
  subtitle?: React.ReactNode;
  /** Right side: a value, a status, a switch. */
  value?: React.ReactNode;
  /** Shows a chevron: the row opens another screen. */
  chevron?: boolean;
  onClick?: () => void;
  /** Extra controls at the far right (a "more" button that offers the same actions as a swipe). */
  trailing?: React.ReactNode;
  /** A Switch or Checkbox on the right: the whole row becomes its label, so the whole row toggles it. */
  toggle?: React.ReactNode;
  className?: string;
}

/**
 * One row. At least 44 px (56 with a second line); the whole row is the target. Press shows a fill at once and a tiny
 * shrink, so a tap is felt; hover fill only on devices that hover.
 */
export function MobileListRow({ media, title, subtitle, value, chevron, onClick, trailing, toggle, className }: MobileListRowProps) {
  const body = (
    <>
      {media ? <span className="grid shrink-0 place-items-center text-ink [&>svg]:size-5 [&>svg]:stroke-[1.75]">{media}</span> : null}
      <span className="grid min-w-0 flex-1 gap-0.5 text-left">
        <span className="truncate text-[15px] text-ink">{title}</span>
        {subtitle ? <span className="truncate text-[13px] text-ink-muted">{subtitle}</span> : null}
      </span>
      {value != null ? <span className="shrink-0 text-[15px] tabular-nums text-ink-muted">{value}</span> : null}
      {toggle ? <span className="flex shrink-0">{toggle}</span> : null}
      {chevron ? <ChevronRight size={18} className="-mr-1 shrink-0 text-ink-muted" /> : null}
    </>
  );
  const row = cn(
    "flex w-full min-w-0 items-center gap-3 rounded-item px-[calc(var(--ad-pad)-var(--ad-nest))] text-left",
    subtitle ? "min-h-14 py-2" : "min-h-touch py-1.5",
  );
  return (
    <div role="listitem" className={cn("flex min-w-0 items-center", className)}>
      {toggle ? (
        <label className={cn(row, "cursor-pointer touch-manipulation select-none [-webkit-tap-highlight-color:transparent]")}>{body}</label>
      ) : onClick ? (
        <button
          type="button"
          onClick={onClick}
          className={cn(
            row,
            "cursor-pointer touch-manipulation select-none transition-[background-color,transform] duration-[120ms] ease-ad [-webkit-tap-highlight-color:transparent] active:scale-[0.99] active:bg-fill [@media(hover:hover)]:hover:bg-fill",
          )}
        >
          {body}
        </button>
      ) : (
        <div className={row}>{body}</div>
      )}
      {trailing}
    </div>
  );
}

export interface MobileListSkeletonProps {
  rows?: number;
  /** Match the loaded rows: a 40 px thumbnail, an icon, or none. */
  media?: "thumb" | "icon" | "none";
  subtitle?: boolean;
  value?: boolean;
  chevron?: boolean;
  title?: boolean;
  className?: string;
}

const pulse = "animate-[ad-pulse_1.6s_ease-in-out_infinite] bg-fill";
/** Pulsing text that keeps the exact line box of the real text. */
const Line = ({ text, className }: { text: string; className?: string }) => (
  <span aria-hidden className={cn("w-fit max-w-full truncate rounded-small text-transparent select-none", pulse, className)}>
    {text}
  </span>
);

/**
 * The loading state of a MobileList: the same card, rows, heights and paddings, with pulsing blocks where text and
 * thumbnails will be, so nothing moves when the data lands. No spinner.
 */
export function MobileListSkeleton({ rows = 6, media = "thumb", subtitle = true, value = true, chevron = false, title = false, className }: MobileListSkeletonProps) {
  const widths = ["Kopi Gayo 250 g", "Teh Melati 100 g", "Gula Aren 500 g", "Kacang Mete", "Kerupuk Udang", "Sambal Bawang"];
  return (
    <section aria-busy aria-label="Loading" className={cn("grid gap-1.5 px-pad", className)}>
      {title ? <Line text="Today" className="mx-1 text-[13px]" /> : null}
      <div className="grid rounded-card bg-surface p-nest">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className={cn("flex items-center gap-3 px-[calc(var(--ad-pad)-var(--ad-nest))]", subtitle ? "min-h-14 py-2" : "min-h-touch py-1.5")}>
            {media === "thumb" ? <span className={cn("size-10 shrink-0 rounded-small", pulse)} /> : media === "icon" ? <span className={cn("size-5 shrink-0 rounded-small", pulse)} /> : null}
            <span className="grid min-w-0 flex-1 gap-0.5">
              <Line text={widths[i % widths.length]} className="text-[15px]" />
              {subtitle ? <Line text="ORD-1043 · 2 items" className="text-[13px]" /> : null}
            </span>
            {value ? <Line text="Rp 128.000" className="shrink-0 text-[15px]" /> : null}
            {chevron ? <span className="size-[18px] shrink-0" /> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
