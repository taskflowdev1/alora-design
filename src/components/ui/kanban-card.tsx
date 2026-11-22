import * as React from "react";
import { Calendar } from "react-feather";
import { cn, prefersReducedMotion } from "@/lib/ad";
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
  /** A small control in the card's top row, beside the id (a move menu). */
  action?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

/** A card on a board: title, a picture, at most two tags, who and when. Lifts on hover. */
export function KanbanCard({ title, id, media, tags = [], people = [], due, attention, action, onClick, className }: KanbanCardProps) {
  const code = id ? (
    <p translate="no" className="truncate text-small tabular-nums text-ink-muted">
      {id}
    </p>
  ) : null;
  // The picture's corner nests in the card's: card radius minus the card padding (p-3).
  const picture = media != null ? <span className={cn("shrink-0 [&>*]:!rounded-[max(4px,calc(var(--ad-radius-card)-0.75rem))]", action != null && "max-sm:hidden")}>{media}</span> : null;
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => onClick && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onClick())}
      className={cn(
        "grid gap-2.5 rounded-card p-3 text-body shadow-card",
        attention ? "bg-brand-soft" : "bg-surface",
        onClick && "cursor-pointer transition-[translate,scale,box-shadow] duration-[150ms] ease-ad hover:-translate-y-0.5 hover:shadow-raised focus-visible:-translate-y-0.5 focus-visible:shadow-raised active:scale-[0.99]",
        action != null && "gap-1",
        className,
      )}
    >
      {action != null ? (
        <>
          <div className="-mr-1 -mt-1 flex h-item items-center justify-between gap-1">
            {code}
            {action}
          </div>
          <div className="flex items-start gap-2.5">
            {picture}
            <p className="line-clamp-2 min-w-0 flex-1 font-medium leading-5 text-ink">{title}</p>
          </div>
        </>
      ) : (
        <div className="flex items-start gap-2.5">
          {picture}
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 font-medium leading-5 text-ink">{title}</p>
            {code}
          </div>
        </div>
      )}
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
export function KanbanColumn({ title, count, children, className }: { title: React.ReactNode; count?: React.ReactNode; children: React.ReactNode; className?: string }) {
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

const DIGITS = "0123456789".split("");

/** A count that rolls: each place is a 0–9 strip one line tall, so only the digits that changed move. */
function RollCount({ value }: { value: number }) {
  const places = String(value).split("");
  return (
    <span className="relative inline-flex tabular-nums">
      <span className="sr-only">{value}</span>
      {places.map((d, i) => (
        <span key={places.length - i} aria-hidden className="block h-[1lh] overflow-hidden">
          <span className="block transition-transform duration-[260ms] ease-ad motion-reduce:transition-none" style={{ transform: `translateY(calc(${d} * -1lh))` }}>
            {DIGITS.map((n) => (
              <span key={n} className="block h-[1lh]">
                {n}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

export interface KanbanBoardColumn {
  id: string;
  title: string;
}

export interface KanbanBoardCard extends Pick<KanbanCardProps, "title" | "media" | "tags" | "people" | "due" | "attention"> {
  /** Stable id, shown on the card. */
  id: string;
  /** The column it is in. */
  column: string;
}

export interface KanbanBoardProps {
  columns: KanbanBoardColumn[];
  cards?: KanbanBoardCard[];
  defaultCards?: KanbanBoardCard[];
  onCardsChange?: (cards: KanbanBoardCard[]) => void;
  onMove?: (id: string, column: string) => void;
  /** The card's move control. Give it your Menu: `targets` are the other columns, `move` sends the card there. */
  moveMenu?: (card: KanbanBoardCard, targets: KanbanBoardColumn[], move: (column: string) => void) => React.ReactNode;
  /** The columns' fixed height in px. */
  height?: number;
  className?: string;
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
/** A card in the hand: lifted a little and tilted toward where it's going. */
const LIFT = 1.03;
const TILT = 3;
type Snapshot = { id: string; rects: Map<string, DOMRect>; focus: boolean; tilt?: number };
type Flight = { ghost: HTMLElement; anim: Animation };
type Drag = { id: string; el: HTMLElement; from: DOMRect; x: number; y: number; dx: number; dy: number; tilt: number; ghost?: HTMLElement; still?: number };

/** A copy of a card on the board's top layer, where a column's scroll box can't clip it. */
function lift(el: HTMLElement, at: DOMRect, origin: DOMRect) {
  const ghost = el.cloneNode(true) as HTMLElement;
  ghost.removeAttribute("data-card");
  ghost.removeAttribute("tabindex");
  ghost.inert = true;
  Object.assign(ghost.style, { position: "absolute", left: `${at.left - origin.left}px`, top: `${at.top - origin.top}px`, width: `${at.width}px`, height: `${at.height}px`, margin: "0", borderRadius: "var(--ad-radius-card)", boxShadow: "var(--ad-shadow-raised)" });
  return ghost;
}

/**
 * A small board. A card moves with its menu or the arrow keys (dragging works too): it flies to the top of the other
 * column while the cards around it close up and the column counts roll. The columns keep their height.
 */
export function KanbanBoard({ columns, cards, defaultCards = [], onCardsChange, onMove, moveMenu, height = 320, className }: KanbanBoardProps) {
  const [inner, setInner] = React.useState(defaultCards);
  const list = cards ?? inner;
  const [over, setOver] = React.useState<string | null>(null);
  const root = React.useRef<HTMLDivElement>(null);
  const layer = React.useRef<HTMLDivElement>(null);
  const snapshot = React.useRef<Snapshot | null>(null);
  const flights = React.useRef(new Map<string, Flight>());
  const drag = React.useRef<Drag | null>(null);

  const move = (id: string, column: string, dropped?: { at: DOMRect; tilt: number }) => {
    const card = list.find((c) => c.id === id);
    if (!card || card.column === column || !root.current) return;
    const rects = new Map<string, DOMRect>();
    root.current.querySelectorAll<HTMLElement>("[data-card]").forEach((el) => rects.set(el.dataset.card!, el.getBoundingClientRect()));
    // Already in the air: it takes off again from where it is now.
    const flying = flights.current.get(id);
    if (flying) rects.set(id, flying.ghost.getBoundingClientRect());
    if (dropped) rects.set(id, dropped.at);
    snapshot.current = { id, rects, focus: document.activeElement === root.current.querySelector(`[data-card="${CSS.escape(id)}"]`), tilt: dropped?.tilt };
    const next = [{ ...card, column }, ...list.filter((c) => c.id !== id)];
    if (cards === undefined) setInner(next);
    onCardsChange?.(next);
    onMove?.(id, column);
  };

  React.useLayoutEffect(() => {
    const snap = snapshot.current;
    const box = root.current;
    if (!snap || !box) return;
    snapshot.current = null;
    const self = box.querySelector<HTMLElement>(`[data-card="${CSS.escape(snap.id)}"]`);
    if (snap.focus) self?.focus({ preventScroll: true });
    self?.parentElement?.scrollTo({ top: 0 });
    if (prefersReducedMotion()) return;

    const origin = box.getBoundingClientRect();
    box.querySelectorAll<HTMLElement>("[data-card]").forEach((el) => {
      const id = el.dataset.card!;
      const from = snap.rects.get(id);
      if (!from) return;
      el.getAnimations().forEach((a) => a.cancel());
      const to = el.getBoundingClientRect();
      const dx = from.left - to.left;
      const dy = from.top - to.top;
      if (id !== snap.id) {
        if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 260, easing: EASE });
        return;
      }
      flights.current.get(id)?.anim.cancel();
      const ghost = lift(el, new DOMRect(from.left, from.top, to.width, to.height), origin);
      layer.current?.appendChild(ghost);
      el.style.opacity = "0";
      const tx = to.left - from.left;
      const ty = to.top - from.top;
      // Dropped from the hand it settles from its lift and tilt; moved by menu or key it hops over.
      const anim = ghost.animate(
        snap.tilt != null
          ? [{ transform: `rotate(${snap.tilt}deg) scale(${LIFT})` }, { transform: `translate(${tx}px, ${ty}px)` }]
          : [
              { transform: "translate(0, 0) scale(1)" },
              { transform: `translate(${tx * 0.55}px, ${ty * 0.55 - 6}px) scale(${LIFT})`, offset: 0.5 },
              { transform: `translate(${tx}px, ${ty}px) scale(1)` },
            ],
        { duration: snap.tilt != null ? 260 : 320, easing: EASE },
      );
      const land = () => {
        ghost.remove();
        el.style.opacity = "";
        if (flights.current.get(id)?.anim === anim) flights.current.delete(id);
      };
      anim.onfinish = land;
      anim.oncancel = land;
      flights.current.set(id, { ghost, anim });
    });
  }, [list]);

  React.useEffect(() => {
    const all = flights.current;
    return () => {
      all.forEach((f) => f.anim.cancel());
      drag.current?.ghost?.remove();
    };
  }, []);

  /*
   * Dragging is our own, with the mouse: the browser's drag picture is a flat, see-through rectangle that loses the
   * card's corners. The card lifts out of its column, follows the pointer tilting toward where it's heading, and
   * settles into the column it's dropped on, or back where it was. On touch the columns scroll and the menu moves cards.
   */
  const columnAt = (x: number, y: number) => {
    for (const el of root.current?.querySelectorAll<HTMLElement>("[data-column]") ?? []) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return el.dataset.column!;
    }
    return null;
  };

  const startDrag = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || (e.target as HTMLElement).closest("button, a, input, select, textarea")) return;
    const el = e.currentTarget;
    drag.current = { id, el, from: el.getBoundingClientRect(), x: e.clientX, y: e.clientY, dx: 0, dy: 0, tilt: 0 };
    el.setPointerCapture(e.pointerId);
  };

  const pose = (d: Drag) => {
    if (!d.ghost) return;
    d.ghost.style.translate = `${d.dx}px ${d.dy}px`;
    d.ghost.style.rotate = `${d.tilt}deg`;
  };

  const dragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || !root.current) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.ghost) {
      // A few pixels first, so a click stays a click.
      if (Math.hypot(dx, dy) < 4) return;
      const ghost = lift(d.el, d.from, root.current.getBoundingClientRect());
      Object.assign(ghost.style, { boxShadow: "var(--ad-shadow-card)", transition: `scale 180ms ${EASE}, rotate 220ms ${EASE}, box-shadow 180ms ${EASE}`, cursor: "grabbing" });
      layer.current?.appendChild(ghost);
      d.ghost = ghost;
      d.el.style.opacity = "0";
      if (!prefersReducedMotion()) {
        void ghost.offsetWidth;
        ghost.style.scale = String(LIFT);
      }
      ghost.style.boxShadow = "var(--ad-shadow-raised)";
    }
    // Tilts with the pointer's sideways speed and rights itself when the pointer rests.
    if (!prefersReducedMotion()) d.tilt = Math.max(-TILT, Math.min(TILT, (dx - d.dx) * 0.35));
    d.dx = dx;
    d.dy = dy;
    pose(d);
    window.clearTimeout(d.still);
    d.still = window.setTimeout(() => {
      d.tilt = 0;
      pose(d);
    }, 90);
    setOver(columnAt(e.clientX, e.clientY));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>, cancel = false) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    window.clearTimeout(d.still);
    setOver(null);
    const ghost = d.ghost;
    if (!ghost) return;
    const column = cancel ? null : columnAt(e.clientX, e.clientY);
    const card = list.find((c) => c.id === d.id);
    if (column && card && card.column !== column) {
      ghost.remove();
      move(d.id, column, { at: new DOMRect(d.from.left + d.dx, d.from.top + d.dy, d.from.width, d.from.height), tilt: d.tilt });
      return;
    }
    // Not moved: it settles back into its slot.
    const back = ghost.animate(
      [
        { translate: `${d.dx}px ${d.dy}px`, rotate: `${d.tilt}deg`, scale: String(ghost.style.scale || 1) },
        { translate: "0px 0px", rotate: "0deg", scale: "1" },
      ],
      { duration: prefersReducedMotion() ? 0 : 240, easing: EASE },
    );
    const done = () => {
      ghost.remove();
      d.el.style.opacity = "";
    };
    back.onfinish = done;
    back.oncancel = done;
  };

  const onCardKey = (e: React.KeyboardEvent<HTMLDivElement>, card: KanbanBoardCard) => {
    if (e.target !== e.currentTarget) return;
    const at = columns.findIndex((c) => c.id === card.column);
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = columns[at + (e.key === "ArrowRight" ? 1 : -1)];
      if (next) move(card.id, next.id);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const el = e.key === "ArrowDown" ? e.currentTarget.nextElementSibling : e.currentTarget.previousElementSibling;
      (el as HTMLElement | null)?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.currentTarget.querySelector("button")?.click();
    }
  };

  return (
    <div ref={root} className={cn("relative grid gap-gap", className)} style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
      {columns.map((col) => {
        const here = list.filter((c) => c.column === col.id);
        return (
          <div
            key={col.id}
            data-column={col.id}
            className="grid min-w-0"
          >
            <KanbanColumn
              title={col.title}
              count={<RollCount value={here.length} />}
              className={cn("min-w-0 grid-rows-[auto_minmax(0,1fr)] content-stretch transition-colors duration-[150ms] ease-ad", over === col.id && "bg-fill-strong")}
            >
              <div style={{ height }} className="-mx-nest -mb-nest flex flex-col gap-2 overflow-y-auto px-nest pb-nest [scrollbar-width:none]">
                {here.map((card) => {
                  const { id, column, ...rest } = card;
                  const targets = columns.filter((c) => c.id !== column);
                  return (
                    <div
                      key={id}
                      data-card={id}
                      tabIndex={0}
                      role="group"
                      aria-label={`${id}, in ${col.title}. Left and right arrows move it.`}
                      onPointerDown={(e) => startDrag(e, id)}
                      onPointerMove={dragMove}
                      onPointerUp={(e) => endDrag(e)}
                      onPointerCancel={(e) => endDrag(e, true)}
                      onKeyDown={(e) => (e.key === "Escape" && drag.current ? endDrag(e as never, true) : onCardKey(e, card))}
                      className="shrink-0 cursor-grab select-none rounded-card active:cursor-grabbing focus-visible:[&>*]:bg-fill-strong"
                    >
                      <KanbanCard {...rest} id={id} action={moveMenu?.(card, targets, (to) => move(id, to))} />
                    </div>
                  );
                })}
              </div>
            </KanbanColumn>
          </div>
        );
      })}
      <div ref={layer} aria-hidden className="pointer-events-none absolute inset-0 z-30" />
    </div>
  );
}
