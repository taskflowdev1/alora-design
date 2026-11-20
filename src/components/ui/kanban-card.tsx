import * as React from "react";
import { Calendar } from "react-feather";
import { cn } from "@/lib/ad";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { Badge } from "@/components/ui/badge";

export interface KanbanCardProps {
  title: React.ReactNode;
  /** Order or task id. */
  id?: string;
  media?: React.ReactNode;
  /** Up to two short tags; more is clutter. */
  tags?: React.ReactNode[];
  people?: { name: string; src?: string }[];
  due?: string;
  /** Highlights the one card that needs attention (a soft accent fill, no border). */
  attention?: boolean;
  onClick?: () => void;
  className?: string;
}

/** A card on a board: title, a picture, at most two tags, who and when. Lifts on hover. */
export function KanbanCard({ title, id, media, tags = [], people = [], due, attention, onClick, className }: KanbanCardProps) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => onClick && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onClick())}
      className={cn(
        "grid gap-2.5 rounded-card p-3 text-body shadow-card",
        attention ? "bg-brand-soft" : "bg-surface",
        onClick && "cursor-pointer transition-[transform,box-shadow] duration-[150ms] ease-ad hover:-translate-y-0.5 hover:shadow-raised focus-visible:-translate-y-0.5 focus-visible:shadow-raised active:scale-[0.99]",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* The picture's corner nests in the card's: card radius minus the card padding (p-3). */}
        {media != null ? <span className="shrink-0 [&>*]:!rounded-[max(4px,calc(var(--ad-radius-card)-0.75rem))]">{media}</span> : null}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-medium leading-5 text-ink">{title}</p>
          {id ? <p className="text-small tabular-nums text-ink-muted">{id}</p> : null}
        </div>
      </div>
      {tags.length || people.length || due ? (
        <div className="flex items-center gap-1.5">
          {tags.slice(0, 2).map((t, i) => (
            <span key={i} className="inline-flex h-[24px] items-center rounded-item bg-fill px-bubble-sm text-small text-ink-muted">
              {t}
            </span>
          ))}
          <span className="ml-auto flex items-center gap-2">
            {due ? (
              <span className="inline-flex items-center gap-1 text-small tabular-nums text-ink-muted">
                <Calendar size={14} />
                {due}
              </span>
            ) : null}
            {people.length ? <AvatarGroup people={people} size="sm" max={2} /> : null}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/** A board column: a soft lane with its title and count, cards stacked with even gaps. */
export function KanbanColumn({ title, count, children, className }: { title: React.ReactNode; count?: number; children: React.ReactNode; className?: string }) {
  return (
        // Cards inside are rounded-card at a nest inset, so the lane is card + nest: the corners run concentric.
    <section className={cn("grid min-w-64 content-start gap-2 rounded-[calc(var(--ad-radius-card)+var(--ad-nest))] bg-fill p-nest", className)}>
      <header className="flex h-item items-center justify-between gap-2 px-3">
        <h3 className="truncate text-body font-semibold">{title}</h3>
        {count != null ? <Badge className="bg-surface">{count}</Badge> : null}
      </header>
      {children}
    </section>
  );
}
