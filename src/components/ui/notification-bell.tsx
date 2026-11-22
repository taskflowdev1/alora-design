import * as React from "react";
import { Bell } from "react-feather";
import { cn, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { Tooltip } from "@/components/ui/tooltip";

export interface Notice {
  id: string;
  title: React.ReactNode;
  time: string;
  unread?: boolean;
  onOpen?: () => void;
}

export interface NotificationBellProps {
  notices: Notice[];
  onMarkAllRead?: () => void;
  className?: string;
  /** A fixed list height in px, so the panel never changes size. By default the list grows up to 320 px. */
  listHeight?: number;
  /** Unread rows carry a soft fill, which Mark all read sweeps away top to bottom. */
  unreadFill?: boolean;
  /** The panel opens in place (absolute, in the nearest positioned parent) instead of in a portal. */
  inline?: boolean;
  /** Inline only: start open. */
  defaultOpen?: boolean;
  /** Inline only: where the panel sits. */
  panelClassName?: string;
}

/** One row of the sweep, in ms. */
const STEP = 55;
const WIPE = 240;
const BADGE_HOLD = 160;
const BADGE_CLOSE = 200;

const CSS = `
.ad-bell-badge { transform-origin: 0 100%; transition: scale ${BADGE_CLOSE}ms var(--ad-ease) ${BADGE_HOLD}ms, translate ${BADGE_CLOSE}ms var(--ad-ease) ${BADGE_HOLD}ms, opacity ${BADGE_CLOSE - 40}ms var(--ad-ease) ${BADGE_HOLD + 40}ms; }
.ad-bell-badge[data-closed] { scale: 0.3; translate: -4px 4px; opacity: 0; }
.ad-bell-badge[data-pop] { animation: ad-bell-pop 220ms var(--ad-ease); }
@keyframes ad-bell-pop { from { scale: 0.5; opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .ad-bell-badge { transition: none; } }`;

const DIGITS = "0123456789".split("");

/** The badge's digit: a 0–9 strip, so a new count rolls in. */
function RollDigit({ value }: { value: number }) {
  return (
    <span aria-hidden className="block h-[10px] overflow-hidden">
      <span className="block transition-transform duration-[220ms] ease-ad motion-reduce:transition-none" style={{ transform: `translateY(${value * -10}px)` }}>
        {DIGITS.map((n) => (
          <span key={n} className="block h-[10px] leading-[10px]">
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * Bell with an unread count; the list opens under it. The count is neutral (ink), never a loud red. The count rolls;
 * Mark all read sweeps the unread rows top to bottom while it counts down, and at zero the badge closes into the bell.
 */
export function NotificationBell({ notices, onMarkAllRead, className, listHeight, unreadFill, inline, defaultOpen = false, panelClassName }: NotificationBellProps) {
  const unread = notices.filter((n) => n.unread);
  const [sweep, setSweep] = React.useState<{ ids: string[]; passed: number } | null>(null);
  const count = sweep ? Math.max(0, unread.length - sweep.passed) : unread.length;

  // The badge stays mounted at zero long enough to close.
  const [badge, setBadge] = React.useState(count > 0);
  const [pop, setPop] = React.useState(false);
  if (count > 0 && !badge) {
    setBadge(true);
    setPop(true);
  }
  React.useEffect(() => {
    if (count > 0 || !badge) return;
    const t = window.setTimeout(() => (setBadge(false), setPop(false)), prefersReducedMotion() ? 0 : BADGE_HOLD + BADGE_CLOSE);
    return () => window.clearTimeout(t);
  }, [count, badge]);

  const timers = React.useRef<number[]>([]);
  const commit = React.useRef(onMarkAllRead);
  React.useEffect(() => {
    commit.current = onMarkAllRead;
  });
  React.useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const head = React.useRef<HTMLDivElement>(null);
  const markAll = () => {
    if (sweep) return;
    if (prefersReducedMotion()) return onMarkAllRead?.();
    const ids = unread.map((n) => n.id);
    setSweep({ ids, passed: 0 });
    timers.current = ids.map((_, i) => window.setTimeout(() => setSweep((s) => s && { ...s, passed: i + 1 }), STEP * i));
    timers.current.push(
      window.setTimeout(() => {
        // Its button leaves with the last unread row: keep the focus in the panel.
        if (head.current?.contains(document.activeElement)) head.current.focus();
        setSweep(null);
        commit.current?.();
      }, STEP * ids.length + WIPE),
    );
  };

  const [open, setOpen] = React.useState(defaultOpen);

  const trigger = (
    <Tooltip content="Notifications">
      <Button
        variant="ghost"
        icon
        aria-label={count ? `Notifications, ${count} unread` : "Notifications"}
        aria-expanded={inline ? open : undefined}
        onClick={inline ? () => setOpen(!open) : undefined}
        className={cn("relative", className)}
      >
        <style>{CSS}</style>
        <Bell />
        {badge ? (
          // Pinned to the bell's top-right corner (the 16 px glyph sits in the middle), so it covers only the corner.
          <span
            data-closed={count === 0 ? "" : undefined}
            data-pop={pop ? "" : undefined}
            className="ad-bell-badge absolute left-[calc(50%+3px)] top-[calc(50%-13px)] grid h-[14px] min-w-[14px] place-items-center rounded-full bg-on px-[3px] text-[10px] font-semibold leading-none tabular-nums text-on-ink"
          >
            {count > 9 ? "9+" : <RollDigit value={count} />}
          </span>
        ) : null}
      </Button>
    </Tooltip>
  );

  const body = (
    <>
      <div ref={head} tabIndex={-1} className="flex min-h-item items-center justify-between gap-2 pb-1 pl-2">
        <span className="text-title font-semibold">Notifications</span>
        {unread.length && onMarkAllRead ? (
          <Button variant="ghost" size="sm" onClick={markAll}>
            Mark all read
          </Button>
        ) : null}
      </div>
      <div className={cn("grid content-start gap-px overflow-auto", listHeight === undefined && "max-h-80")} style={listHeight === undefined ? undefined : { height: listHeight }}>
        {notices.map((n) => {
          const at = sweep ? sweep.ids.indexOf(n.id) : -1;
          const isUnread = !!n.unread && !(at > -1 && at < sweep!.passed);
          return (
            <button
              key={n.id}
              type="button"
              onClick={n.onOpen}
              className={cn(
                "relative grid cursor-pointer grid-cols-[8px_minmax(0,1fr)] items-start gap-x-2.5 rounded-control px-2 py-2 text-left hover:bg-fill focus-visible:bg-fill",
                unreadFill && "hover:[&>[data-fill]]:bg-fill-strong focus-visible:[&>[data-fill]]:bg-fill-strong",
              )}
            >
              {unreadFill ? (
                <span
                  data-fill
                  aria-hidden
                  className="absolute inset-0 rounded-control bg-fill transition-[clip-path] ease-ad motion-reduce:transition-none"
                  style={{ clipPath: isUnread ? "inset(0 0 0 0)" : "inset(100% 0 0 0)", transitionDuration: `${WIPE}ms` }}
                />
              ) : null}
              <span className="relative grid h-5 place-items-center">
                {n.unread ? <span data-shape="round" className={cn("size-1.5 rounded-full bg-ink transition-opacity duration-[200ms] ease-ad motion-reduce:transition-none", !isUnread && "opacity-0")} /> : null}
              </span>
              <span className="relative min-w-0">
                <span className={cn("block text-body leading-5 transition-colors duration-[220ms] ease-ad", isUnread ? "text-ink" : "text-ink-muted")}>{n.title}</span>
                <span className="block text-small tabular-nums text-ink-muted">{n.time}</span>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );

  if (inline) {
    return (
      <>
        {trigger}
        <div
          role="region"
          aria-label="Notifications"
          inert={!open}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          className={cn(
            "absolute right-0 top-full z-20 mt-1.5 w-80 origin-top-right rounded-card bg-raised p-[calc(var(--ad-nest)*2)] text-ink shadow-raised",
            "transition-[opacity,scale,visibility] duration-[200ms] ease-ad motion-reduce:transition-none",
            !open && "invisible scale-[0.97] opacity-0",
            panelClassName,
          )}
        >
          {body}
        </div>
      </>
    );
  }
  return (
    <Popover align="end" className="w-80" trigger={trigger}>
      {body}
    </Popover>
  );
}
