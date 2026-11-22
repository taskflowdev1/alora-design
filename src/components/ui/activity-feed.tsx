import * as React from "react";
import { ArrowUp } from "react-feather";
import { cn, prefersReducedMotion } from "@/lib/ad";
import { useEdgeFade } from "@/lib/ad-hooks";

export interface ActivityEvent {
  id: string;
  /** When it happened, in ms since the epoch. */
  at: number;
  title: React.ReactNode;
  /** An Avatar for a person, a Feather icon for the system. */
  media?: React.ReactNode;
}

const CSS = `
@keyframes ad-feed-time { from { opacity: 0; transform: translateY(40%); } }
.ad-feed-time { display: inline-block; animation: ad-feed-time 220ms var(--ad-ease) both; }`;

const DIGITS = "0123456789".split("");

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

function ago(ms: number) {
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min`;
  const hours = Math.floor(min / 60);
  return hours < 24 ? `${hours} h` : `${Math.floor(hours / 24)} d`;
}

/** The relative time; it rolls only when its words change. */
function Ago({ at, now }: { at: number; now: number }) {
  const label = ago(Math.max(0, now - at));
  const mounted = React.useRef(false);
  React.useEffect(() => {
    mounted.current = true;
  }, []);
  return (
    <time dateTime={new Date(at).toISOString()} className="shrink-0 overflow-hidden text-small tabular-nums text-ink-muted">
      <span key={label} className={cn(mounted.current && "ad-feed-time")}>
        {label}
      </span>
    </time>
  );
}

export interface ActivityFeedProps {
  /** Newest first. Add to the front and the row slides in; the list keeps its size. */
  events: ActivityEvent[];
  /** The list's fixed height in px. */
  height?: number;
  className?: string;
}

/**
 * What just happened in the shop. New events slide in at the top and older ones settle down; relative times update.
 * Scrolled down, the list stays exactly where it is and a "3 new" pill offers the way back up.
 */
export function ActivityFeed({ events, height = 320, className }: ActivityFeedProps) {
  const box = React.useRef<HTMLDivElement>(null);
  const known = React.useRef<string[]>([]);
  const [now, setNow] = React.useState(() => Date.now());
  const [unseen, setUnseen] = React.useState(0);
  const [pillCount, setPillCount] = React.useState(0);
  if (unseen > 0 && unseen !== pillCount) setPillCount(unseen);
  useEdgeFade(box, { size: 20 });

  // Times tick only while the list is on screen.
  React.useEffect(() => {
    const el = box.current;
    if (!el) return;
    let timer = 0;
    const stop = () => {
      window.clearInterval(timer);
      timer = 0;
    };
    const start = () => {
      if (timer || document.hidden) return;
      setNow(Date.now());
      timer = window.setInterval(() => setNow(Date.now()), 1000);
    };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(el);
    const onVisible = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  React.useLayoutEffect(() => {
    const el = box.current;
    const before = known.current;
    known.current = events.map((e) => e.id);
    if (!el || !before.length) return;
    const seen = new Set(before);
    const fresh = events.filter((e) => !seen.has(e.id));
    if (!fresh.length) return;
    const rows = Array.from(el.querySelectorAll<HTMLElement>("[data-event]"));
    const anchor = rows.find((r) => r.dataset.event === before[0]);
    if (!anchor || !rows[0]) return;
    const added = anchor.offsetTop - rows[0].offsetTop;
    // Reading further down: the rows stay under the eye and the pill counts what came in.
    if (el.scrollTop > 4) {
      el.scrollTop += added;
      setUnseen((n) => n + fresh.length);
      return;
    }
    if (prefersReducedMotion()) return;
    const isFresh = new Set(fresh.map((e) => e.id));
    for (const r of rows) {
      if (isFresh.has(r.dataset.event!)) r.animate([{ opacity: 0, transform: "translateY(-10px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
      else r.animate([{ transform: `translateY(${-added}px)` }, { transform: "none" }], { duration: 280, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    }
  }, [events]);

  const toTop = () => box.current?.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });

  return (
    <div className={cn("relative", className)} style={{ height }}>
      <style>{CSS}</style>
      <div
        ref={box}
        role="log"
        aria-label="Activity"
        tabIndex={0}
        onScroll={(e) => e.currentTarget.scrollTop <= 4 && setUnseen(0)}
        className="h-full overflow-y-auto rounded-item [overflow-anchor:none] focus-visible:bg-fill"
      >
        <ol className="grid gap-px">
          {events.map((e) => (
            <li key={e.id} data-event={e.id} className="flex h-row items-center gap-2.5 rounded-item px-2">
              <span className="grid size-[24px] shrink-0 place-items-center text-ink-muted [&_svg]:size-[16px]">{e.media ?? <span className="size-1.5 rounded-full bg-ink-muted" />}</span>
              <span className="min-w-0 flex-1 truncate text-body text-ink">{e.title}</span>
              <Ago at={e.at} now={now} />
            </li>
          ))}
        </ol>
      </div>
      <button
        type="button"
        inert={!unseen}
        onClick={toTop}
        className={cn(
          "absolute left-1/2 top-2 z-10 inline-flex h-item -translate-x-1/2 cursor-pointer select-none items-center gap-1.5 rounded-full bg-on px-bubble text-body font-medium text-on-ink shadow-raised ad-press hover:bg-ink-muted focus-visible:bg-ink-muted active:scale-[0.97]",
          "transition-[opacity,translate,scale,background-color] duration-[200ms] ease-ad motion-reduce:transition-none",
          !unseen && "pointer-events-none -translate-y-1 opacity-0",
        )}
      >
        <ArrowUp size={16} />
        <span className="flex items-baseline gap-[0.3em]">
          <RollCount value={pillCount} /> new
        </span>
      </button>
    </div>
  );
}
