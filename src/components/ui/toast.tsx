import * as React from "react";
import { Check, Info } from "react-feather";
import { cn } from "@/lib/ad";

type ToastItem = { id: number; message: string; tone: "success" | "neutral"; leaving?: boolean };
let items: ToastItem[] = [];
let seq = 0;
let ticker: number | undefined;
const left = new Map<number, number>();
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const SHOW = 3200;
const TICK = 100;

/* One clock for every toast. It stops while the pointer rests on a toast or the tab is hidden, so nothing goes unread. */
function tick() {
  if (document.hidden || document.querySelector("[data-ad-toast]:hover")) return;
  const done: number[] = [];
  for (const [id, ms] of left) {
    if (ms > TICK) {
      left.set(id, ms - TICK);
    } else {
      left.delete(id);
      done.push(id);
    }
  }
  if (!done.length) return;
  items = items.map((t) => (done.includes(t.id) ? { ...t, leaving: true } : t));
  emit();
  window.setTimeout(() => {
    items = items.filter((t) => !done.includes(t.id));
    if (!items.length) {
      window.clearInterval(ticker);
      ticker = undefined;
    }
    emit();
  }, 200);
}

/** Show a short message after an action, e.g. toast("Changes saved"). */
export function toast(message: string, tone: ToastItem["tone"] = "success") {
  const id = ++seq;
  for (const t of items.slice(0, -2)) left.delete(t.id);
  items = [...items.slice(-2), { id, message, tone }];
  left.set(id, SHOW);
  ticker ??= window.setInterval(tick, TICK);
  emit();
}

/**
 * Toasts sit at the far right and never cover actions: they rise above any
 * bottom bar marked data-toast-avoid, and move left of an open side pane
 * (data-toast-avoid="side").
 */
export function Toaster({ className }: { className?: string }) {
  const list = React.useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => items,
    () => items,
  );
  const [pos, setPos] = React.useState({ right: 16, bottom: 16 });
  React.useEffect(() => {
    if (!list.length) return;
    const place = () => {
      let right = 16;
      let bottom = 16;
      const w = window.innerWidth;
      const h = window.innerHeight;
      document.querySelectorAll<HTMLElement>("[data-toast-avoid]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || r.bottom < 0 || r.top > h) return;
        if (el.dataset.toastAvoid === "side") {
          if (r.left > w / 3) right = Math.max(right, w - r.left + 12);
        } else if (r.right > w - 380 && r.top > h / 2) {
          bottom = Math.max(bottom, h - r.top + 12);
        }
      });
      setPos((p) => (p.right === right && p.bottom === bottom ? p : { right, bottom }));
    };
    place();
    const id = window.setInterval(place, 150);
    return () => window.clearInterval(id);
  }, [list.length]);

  return (
    <div
      aria-live="polite"
      // Pinned to the corner and moved with transform (not right/bottom), so stepping clear of a bar never re-lays it out.
      className={cn("pointer-events-none fixed bottom-0 right-0 z-[80] flex flex-col items-end gap-2 transition-transform duration-[220ms] ease-ad", className)}
      style={{ transform: `translate(${-pos.right}px, ${-pos.bottom}px)` }}
    >
      {list.map((t) => (
        <ToastView
          key={t.id}
          tone={t.tone}
          data-ad-toast=""
          // Leaves the way it came: back down and out, a little faster than it rose.
          className={cn("pointer-events-auto", t.leaving ? "pointer-events-none animate-[ad-down_180ms_var(--ad-ease)_forwards]" : "animate-[ad-up_220ms_var(--ad-ease)]")}
        >
          {t.message}
        </ToastView>
      ))}
    </div>
  );
}

/** The toast itself, for showing one in place (a preview, a docs page). Toaster uses it too. */
export function ToastView({
  tone = "success",
  children,
  className,
  ...props
}: { tone?: ToastItem["tone"]; children: React.ReactNode; className?: string } & Omit<React.HTMLAttributes<HTMLDivElement>, "children">) {
  return (
    <div
      {...props}
      className={cn("flex h-control w-fit items-center gap-2 rounded-card bg-side-raised px-3.5 text-body text-side-ink shadow-raised", className)}
    >
      {tone === "success" ? <Check size={16} /> : <Info size={16} />}
      {children}
    </div>
  );
}
