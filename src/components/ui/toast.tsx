import * as React from "react";
import { Check, Info } from "react-feather";
import { cn } from "@/lib/ad";

type ToastItem = { id: number; message: string; tone: "success" | "neutral"; leaving?: boolean };
let items: ToastItem[] = [];
let seq = 0;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

/** Show a short message after an action, e.g. toast("Changes saved"). */
export function toast(message: string, tone: ToastItem["tone"] = "success") {
  const id = ++seq;
  items = [...items.slice(-2), { id, message, tone }];
  emit();
  window.setTimeout(() => {
    items = items.map((t) => (t.id === id ? { ...t, leaving: true } : t));
    emit();
    window.setTimeout(() => {
      items = items.filter((t) => t.id !== id);
      emit();
    }, 200);
  }, 3200);
}

/**
 * Toasts sit at the far right and never cover actions: they rise above any
 * bottom bar marked data-toast-avoid, and move left of an open side pane
 * (data-toast-avoid="side").
 */
export function Toaster() {
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
      className="pointer-events-none fixed z-[80] flex flex-col items-end gap-2 transition-[right,bottom] duration-[220ms] ease-ad"
      style={pos}
    >
      {list.map((t) => (
        <ToastView
          key={t.id}
          tone={t.tone}
          className={cn("pointer-events-auto", t.leaving ? "animate-[ad-fade-out_200ms_ease-in_forwards]" : "animate-[ad-up_220ms_var(--ad-ease)]")}
        >
          {t.message}
        </ToastView>
      ))}
    </div>
  );
}

/** The toast itself, for showing one in place (a preview, a docs page). Toaster uses it too. */
export function ToastView({ tone = "success", children, className }: { tone?: ToastItem["tone"]; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex h-control w-fit items-center gap-2 rounded-card bg-on px-3.5 text-body text-on-ink shadow-raised", className)}>
      {tone === "success" ? <Check size={16} /> : <Info size={16} />}
      {children}
    </div>
  );
}
