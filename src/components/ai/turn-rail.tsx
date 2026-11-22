/*
 * Adapted from T3 Code's timeline minimap (apps/web/src/components/chat/TimelineMinimap.tsx, github.com/pingdotgg/t3code):
 *
 * MIT License
 *
 * Copyright (c) 2026 T3 Tools Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
 * Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import * as React from "react";
import { cn, prefersReducedMotion } from "@/lib/ad";

export interface RailTurn {
  id: string;
  question: string;
  reply?: string;
}

export interface TurnRailProps {
  turns: RailTurn[];
  /** The scrolling thread. Each question inside it carries `data-turn="<id>"`. */
  scrollRef: React.RefObject<HTMLElement | null>;
  /** Called on a jump, so the thread can stop following new text. */
  onJump?: () => void;
  className?: string;
}

const SPACING = 8;
const JUMP_OFFSET = 16;

const CSS = `
.ad-rail-tick { position: absolute; left: 0; width: 24px; height: 8px; padding: 0; background: none; cursor: pointer; translate: 0 -50%; border-radius: var(--ad-radius-small); }
.ad-rail-bar { position: absolute; top: 3px; left: 0; width: 24px; height: 2px; border-radius: 99px; background: var(--ad-fill-strong); transform: scaleX(.333); transform-origin: left; transition: transform 150ms var(--ad-ease), background-color 150ms var(--ad-ease); }
.ad-rail-tick[data-in-view="true"] .ad-rail-bar { background: var(--ad-ink-muted); }
.ad-rail-tick[data-near="0"] .ad-rail-bar { transform: scaleX(1); background: var(--ad-ink); }
.ad-rail-tick[data-near="1"] .ad-rail-bar { transform: scaleX(.667); }
.ad-rail-tick[data-near="2"] .ad-rail-bar { transform: scaleX(.417); }
.ad-rail-tick:focus-visible .ad-rail-bar { transform: scaleX(1); background: var(--ad-ink); }
.ad-rail-preview { animation: ad-rail-in 150ms var(--ad-ease); }
@keyframes ad-rail-in { from { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .ad-rail-bar { transition: none; } .ad-rail-preview { animation: none; } }`;

const top = (i: number, n: number) => (n <= 1 ? 0 : (i / (n - 1)) * 100);

/**
 * A map of the conversation on the thread's left edge: one tick per question, brighter for the ones on screen. Moving
 * along it swells the nearby ticks like a dock and previews that turn; a click or Enter jumps there, and the arrow keys
 * walk it. It needs two turns and a mouse; on touch the thread just scrolls.
 */
export function TurnRail({ turns, scrollRef, onJump, className }: TurnRailProps) {
  const [active, setActive] = React.useState<number | null>(null);
  const [current, setCurrent] = React.useState<number | null>(null);
  const ticks = React.useRef<(HTMLButtonElement | null)[]>([]);
  const count = turns.length;
  const ids = turns.map((t) => t.id).join();

  const element = React.useCallback((id: string) => scrollRef.current?.querySelector<HTMLElement>(`[data-turn="${id}"]`) ?? null, [scrollRef]);

  // Which turns are on screen flips on every scroll frame, so it goes straight to the DOM.
  React.useEffect(() => {
    const list = scrollRef.current;
    if (!list) return;
    let frame = 0;
    const refresh = () => {
      frame = 0;
      const view = list.getBoundingClientRect();
      const tops = turns.map((t) => element(t.id)?.getBoundingClientRect().top ?? Infinity);
      const end = view.top - list.scrollTop + list.scrollHeight;
      let now: number | null = null;
      tops.forEach((y, i) => {
        const on = y < view.bottom && (tops[i + 1] ?? end) > view.top;
        const tick = ticks.current[i];
        if (tick) tick.dataset.inView = String(on);
        if (y < view.bottom - 40) now = i;
      });
      setCurrent(now);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(refresh);
    };
    refresh();
    list.addEventListener("scroll", schedule, { passive: true });
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    ro?.observe(list);
    if (list.firstElementChild) ro?.observe(list.firstElementChild);
    return () => {
      list.removeEventListener("scroll", schedule);
      ro?.disconnect();
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `ids` stands for the turns.
  }, [ids, scrollRef, element]);

  if (count < 2) return null;

  const jump = (i: number) => {
    const list = scrollRef.current;
    const el = element(turns[i].id);
    if (!list || !el) return;
    onJump?.();
    const y = list.scrollTop + el.getBoundingClientRect().top - list.getBoundingClientRect().top - JUMP_OFFSET;
    list.scrollTo({ top: y, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };
  const fromPointer = (e: React.MouseEvent<HTMLElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    return Math.round(Math.max(0, Math.min(1, (e.clientY - b.top) / b.height)) * (count - 1));
  };
  const shown = active !== null && active < count ? active : null;
  const preview = shown === null ? null : turns[shown];
  const roving = current ?? count - 1;

  return (
    <div data-turn-rail className={cn("pointer-events-none absolute inset-y-0 left-0 z-10 w-12 select-none [@media(hover:none)]:hidden", className)}>
      <style href="ad-turn-rail" precedence="default">
        {CSS}
      </style>
      <nav
        aria-label="Conversation turns"
        className="pointer-events-auto absolute left-3 top-1/2 w-6 -translate-y-1/2 cursor-pointer before:absolute before:-inset-x-2 before:-inset-y-3 before:content-['']"
        style={{ height: `min(${(count - 1) * SPACING}px, calc(100% - 96px))` }}
        onPointerMove={(e) => e.pointerType !== "touch" && setActive(fromPointer(e))}
        onPointerLeave={() => setActive(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) jump(fromPointer(e));
        }}
      >
        {turns.map((t, i) => {
          const near = shown === null ? undefined : Math.min(Math.abs(i - shown), 3);
          return (
            <button
              key={t.id}
              ref={(n) => {
                ticks.current[i] = n;
              }}
              type="button"
              className="ad-rail-tick"
              style={{ top: `${top(i, count)}%` }}
              data-near={near}
              data-in-view="false"
              tabIndex={i === roving ? 0 : -1}
              aria-label={`Jump to message ${i + 1} of ${count}: ${t.question.slice(0, 80)}`}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              onClick={() => jump(i)}
              onKeyDown={(e) => {
                const next = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? count - 1 : null;
                if (next !== null) {
                  e.preventDefault();
                  ticks.current[Math.max(0, Math.min(count - 1, next))]?.focus();
                } else if (e.key === "Escape") setActive(null);
              }}
            >
              <span className="ad-rail-bar" />
            </button>
          );
        })}
        {preview && shown !== null ? (
          <div
            className="ad-rail-preview absolute left-8 grid w-[300px] cursor-pointer gap-1 rounded-card bg-pop p-3 text-left text-body text-ink shadow-raised"
            style={{ top: `${top(shown, count)}%`, transform: `translateY(${shown === 0 ? "-12px" : shown === count - 1 ? "calc(-100% + 12px)" : "-50%"})` }}
            onPointerMove={(e) => e.stopPropagation()}
            onClick={() => jump(shown)}
          >
            <span className="truncate font-medium">{preview.question}</span>
            {preview.reply ? <span className="line-clamp-3 text-ink-muted">{preview.reply}</span> : null}
          </div>
        ) : null}
      </nav>
    </div>
  );
}
