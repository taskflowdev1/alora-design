import * as React from "react";
import { cn, prefersReducedMotion } from "@/lib/ad";

export type IslandStatus = "idle" | "syncing" | "progress" | "done";

const NEXT: Record<IslandStatus, IslandStatus> = { idle: "syncing", syncing: "progress", progress: "done", done: "idle" };
const SYNC_MS = 1700;
const PROGRESS_MS = 2800;
const DONE_MS = 2400;
const CHANNEL_MS = 520;
const STIFFNESS = 340;
const DAMPING = 29; // a touch under critical: the pill lands with the smallest give

/*
 * One pill and one mark. The mark is the same element through every state: a dot at rest, the hub of the orbit while
 * syncing, the bar while counting, and the bar pulled back into one small green dot when done.
 *
 * The pill takes the house island greys, dark in both themes; in dark it sits one step up so it reads on the page and on a card.
 */
const CSS = `
.ad-island { container-type: inline-size; }
.ad-island-layer {
  position: absolute; left: 50%; top: 50%; opacity: 0; pointer-events: none; white-space: nowrap;
  transform: translate(-50%, -50%) scale(0.96); filter: blur(3px);
  transition: opacity 140ms var(--ad-ease), transform 220ms var(--ad-ease), filter 140ms var(--ad-ease);
}
.ad-island-layer[data-on] { opacity: 1; transform: translate(-50%, -50%); filter: none; transition-delay: 70ms; }
.ad-island-mark { position: absolute; left: 50%; top: 50%; border-radius: 999px; transition: background-color 220ms var(--ad-ease); }
.ad-island-orbit {
  position: absolute; left: 50%; top: 50%; width: 18px; height: 18px; margin: -9px; opacity: 0; border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 20%, var(--ad-side-ink));
  mask-image: radial-gradient(closest-side, transparent 66%, #000 70%);
  transition: opacity 180ms var(--ad-ease);
  animation: ad-island-spin 820ms linear infinite; animation-play-state: paused;
}
.ad-island[data-status="syncing"][data-live] .ad-island-orbit { animation-play-state: running; }
.ad-island[data-status="syncing"] .ad-island-orbit { opacity: 1; }
.ad-island-channel { animation: ad-island-roll 220ms var(--ad-ease) both; }
@keyframes ad-island-spin { to { rotate: 360deg; } }
@keyframes ad-island-roll { from { opacity: 0; transform: translateY(7px); filter: blur(2px); } }
@media (prefers-reduced-motion: reduce) {
  .ad-island-layer, .ad-island-layer[data-on] { transition: opacity 120ms linear; transform: translate(-50%, -50%); filter: none; transition-delay: 0ms; }
  .ad-island-orbit { animation: none; }
  .ad-island-channel { animation: none; }
}`;

const subscribeMotion = (fn: () => void) => {
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
};

type Box = [w: number, h: number, x: number, y: number, mw: number, mh: number];

/** Where the pill and its mark should be, from the measured size of the state's content. */
function layout(status: IslandStatus, w: number, h: number, p: number): Box {
  if (status === "progress") {
    const track = Math.max(0, w - 44);
    const bar = Math.max(6, track * p);
    return [w, h, -track / 2 + bar / 2, h / 2 - 17, bar, 6];
  }
  if (status === "syncing") return [w, h, -w / 2 + 26, 0, 6, 6];
  if (status === "done") return [w, h, -w / 2 + 23, 0, 8, 8];
  return [w, h, -w / 2 + 22, 0, 7, 7];
}

export interface StatusIslandProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Controlled state. Leave out and a press plays idle → syncing → progress → done by itself. */
  status?: IslandStatus;
  /** 0…1 while `status` is "progress" and controlled. */
  progress?: number;
  /** Called with the next state on a press, and on each step of the self-running sequence. */
  onStatusChange?: (status: IslandStatus) => void;
  idleLabel?: string;
  syncLabel?: string;
  /** The names that roll past while syncing. */
  channels?: string[];
  progressLabel?: string;
  doneLabel?: string;
}

/**
 * A black pill that springs between four states and reshapes around what each one shows. Its box never changes size, so
 * nothing around it moves. Uncontrolled, a press starts the sequence and each further press skips ahead.
 */
export function StatusIsland({
  status: statusProp,
  progress = 0,
  onStatusChange,
  idleLabel = "Sync 7 shops",
  syncLabel = "Syncing",
  channels = ["Shopee", "Tokopedia", "TikTok Shop", "Rimba Kemang"],
  progressLabel = "248 products",
  doneLabel = "248 products synced",
  className,
  ...props
}: StatusIslandProps) {
  const [inner, setInner] = React.useState<IslandStatus>("idle");
  const status = statusProp ?? inner;
  const controlled = statusProp !== undefined;
  const reduced = React.useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => false);
  const [onScreen, setOnScreen] = React.useState(true);
  const [channel, setChannel] = React.useState(0);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const pillRef = React.useRef<HTMLButtonElement>(null);
  const markRef = React.useRef<HTMLSpanElement>(null);
  const pctRef = React.useRef<HTMLSpanElement>(null);
  const layers = React.useRef<Partial<Record<IslandStatus, HTMLSpanElement | null>>>({});

  // Everything the frame loop reads, kept in one ref so a state change never restarts the spring mid-flight.
  const live = React.useRef({ status, p: controlled ? progress : 0, cur: null as Box | null, vel: [0, 0, 0, 0, 0, 0] as Box, raf: 0, last: 0, onScreen: true, reduced, tick: () => {} });
  live.current.status = status;
  live.current.reduced = reduced;
  if (controlled) live.current.p = Math.max(0, Math.min(1, progress));

  const go = React.useCallback(
    (next: IslandStatus) => {
      if (!controlled) setInner(next);
      onStatusChange?.(next);
    },
    [controlled, onStatusChange],
  );

  React.useLayoutEffect(() => {
    const l = live.current;
    const paint = (b: Box) => {
      const pill = pillRef.current;
      const mark = markRef.current;
      if (!pill || !mark) return;
      pill.style.width = `${b[0].toFixed(2)}px`;
      pill.style.height = `${b[1].toFixed(2)}px`;
      mark.style.width = `${b[4].toFixed(2)}px`;
      mark.style.height = `${b[5].toFixed(2)}px`;
      mark.style.transform = `translate(${(b[2] - b[4] / 2).toFixed(2)}px, ${(b[3] - b[5] / 2).toFixed(2)}px)`;
      if (pctRef.current) pctRef.current.textContent = `${Math.round(l.p * 100)}%`;
    };
    const target = (): Box | null => {
      const el = layers.current[l.status];
      if (!el) return null;
      return layout(l.status, el.offsetWidth, el.offsetHeight, l.p);
    };
    const frame = (t: number) => {
      l.raf = 0;
      const dt = Math.min(Math.max(t - l.last, 1) / 1000, 1 / 30);
      l.last = t;
      const counting = !controlled && l.status === "progress" && l.p < 1;
      if (counting) l.p = Math.min(1, l.p + (dt * 1000) / PROGRESS_MS);
      const to = target();
      if (!to || !l.cur) return;
      let moving = counting;
      for (let i = 0; i < 6; i++) {
        l.vel[i] += (STIFFNESS * (to[i] - l.cur[i]) - DAMPING * l.vel[i]) * dt;
        l.cur[i] += l.vel[i] * dt;
        if (Math.abs(to[i] - l.cur[i]) > 0.05 || Math.abs(l.vel[i]) > 0.5) moving = true;
        else {
          l.cur[i] = to[i];
          l.vel[i] = 0;
        }
      }
      paint(l.cur);
      if (counting && l.p >= 1) go("done");
      if (moving && l.onScreen) l.raf = requestAnimationFrame(frame);
    };
    l.tick = () => {
      const to = target();
      if (!to) return;
      if (!l.cur || l.reduced) {
        l.cur = [...to] as Box;
        l.vel = [0, 0, 0, 0, 0, 0];
        paint(l.cur);
        return;
      }
      if (l.raf || !l.onScreen) return;
      l.last = performance.now();
      l.raf = requestAnimationFrame(frame);
    };
    l.tick();
    const ro = new ResizeObserver(() => l.tick());
    for (const el of Object.values(layers.current)) if (el) ro.observe(el);
    const io = new IntersectionObserver(([entry]) => {
      l.onScreen = entry.isIntersecting;
      setOnScreen(entry.isIntersecting);
      if (l.onScreen) l.tick();
      else {
        cancelAnimationFrame(l.raf);
        l.raf = 0;
      }
    });
    if (rootRef.current) io.observe(rootRef.current);
    return () => {
      ro.disconnect();
      io.disconnect();
      cancelAnimationFrame(l.raf);
      l.raf = 0;
    };
  }, [controlled, go]);

  // Each state change (and each controlled progress value) aims the spring again.
  React.useLayoutEffect(() => {
    if (status === "idle" && !controlled) live.current.p = 0;
    if (status === "done" && !controlled) live.current.p = 1;
    live.current.tick();
  }, [status, progress, controlled, channel]);

  // The self-running sequence. The count itself lives in the frame loop; these are the two timed holds.
  React.useEffect(() => {
    if (controlled || !onScreen) return;
    if (status === "syncing") {
      const id = window.setTimeout(() => go("progress"), SYNC_MS);
      return () => window.clearTimeout(id);
    }
    if (status === "done") {
      const id = window.setTimeout(() => go("idle"), DONE_MS);
      return () => window.clearTimeout(id);
    }
    if (status === "progress" && reduced) {
      const id = window.setTimeout(() => {
        live.current.p = 1;
        go("done");
      }, 900);
      return () => window.clearTimeout(id);
    }
  }, [status, controlled, onScreen, reduced, go]);

  React.useEffect(() => {
    if (status !== "syncing" || !onScreen || reduced) return;
    const id = window.setInterval(() => setChannel((c) => (c + 1) % channels.length), CHANNEL_MS);
    return () => window.clearInterval(id);
  }, [status, onScreen, reduced, channels.length]);

  const spoken = { idle: idleLabel, syncing: `${syncLabel} ${channels[channel % channels.length]}`, progress: progressLabel, done: doneLabel }[status];
  const set = (s: IslandStatus) => (el: HTMLSpanElement | null) => {
    layers.current[s] = el;
  };
  const on = (s: IslandStatus) => (status === s ? { "data-on": "" } : {});

  return (
    <div ref={rootRef} data-status={status} data-live={onScreen ? "" : undefined} className={cn("ad-island relative grid h-24 w-full max-w-[360px] place-items-center", className)} {...props}>
      <style href="ad-status-island" precedence="default">
        {CSS}
      </style>
      <button
        ref={pillRef}
        type="button"
        data-shape="round"
        aria-label={spoken}
        onClick={() => go(NEXT[status])}
        className="ad-island-pill ad-press relative block h-11 w-40 cursor-pointer select-none overflow-hidden rounded-full bg-side text-title font-medium text-side-ink shadow-raised hover:bg-side-raised focus-visible:bg-side-raised active:scale-[0.97] dark:bg-side-raised dark:hover:bg-side-fill-strong dark:focus-visible:bg-side-fill-strong"
      >
        <span aria-hidden className="absolute inset-0">
          <span ref={set("idle")} {...on("idle")} className="ad-island-layer flex h-11 items-center pl-[38px] pr-5">
            {idleLabel}
          </span>
          <span ref={set("syncing")} {...on("syncing")} className="ad-island-layer flex h-12 items-center gap-1 pl-[46px] pr-5">
            <span>{syncLabel}</span>
            <span className="grid text-side-muted">
              {channels.map((c, i) => (
                <span key={c} className={cn("col-start-1 row-start-1", i === channel % channels.length ? "ad-island-channel" : "invisible")}>
                  {c}
                </span>
              ))}
            </span>
          </span>
          <span ref={set("progress")} {...on("progress")} className="ad-island-layer block h-[76px] w-[min(320px,calc(100cqw-8px))] px-[22px] pt-3.5">
            <span className="flex items-baseline justify-between gap-4">
              <span>{progressLabel}</span>
              <span ref={pctRef} className="tabular-nums text-side-muted">
                0%
              </span>
            </span>
            <span className="absolute inset-x-[22px] bottom-[14px] h-[6px] rounded-full bg-side-fill-strong" />
          </span>
          <span ref={set("done")} {...on("done")} className="ad-island-layer flex h-12 items-center pl-[42px] pr-6">
            {doneLabel}
          </span>
        </span>
        <span
          ref={markRef}
          aria-hidden
          data-shape="round"
          className={cn("ad-island-mark", status === "done" ? "bg-success" : status === "progress" ? "bg-brand" : status === "syncing" ? "bg-side-ink" : "bg-side-muted")}
        >
          <span data-shape="round" className="ad-island-orbit" />
        </span>
      </button>
      <span role="status" className="sr-only">
        {status === "idle" ? "" : spoken}
      </span>
    </div>
  );
}
