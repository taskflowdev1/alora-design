import * as React from "react";
import { Dialog as D } from "radix-ui";
import { cn } from "@/lib/ad";
import { overlayClass } from "@/components/ui/dialog";

export interface DrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
  title: React.ReactNode;
  children?: React.ReactNode;
  /** Buttons at the bottom, full width on phones. */
  footer?: React.ReactNode;
  className?: string;
}

/**
 * The phone's bottom sheet: it floats with a margin and full rounding (never glued to the edge), slides up, and drags
 * down to close (grab the handle or the title row; past 80 px or a quick flick it closes, otherwise it springs back
 * keeping the speed you let go with; dragging up meets a rubber band). Desktop uses Sheet or Dialog.
 */
export function Drawer({ open: openProp, onOpenChange, trigger, title, children, footer, className }: DrawerProps) {
  const [own, setOwn] = React.useState(false);
  const open = openProp ?? own;
  const setOpen = (o: boolean) => (onOpenChange ? onOpenChange(o) : setOwn(o));
  const content = React.useRef<HTMLDivElement>(null);
  const g = React.useRef({ y: 0, t: 0, v: 0, at: 0, on: false, raf: 0 });
  React.useEffect(() => () => cancelAnimationFrame(g.current.raf), []);
  React.useEffect(() => {
    if (open) g.current.at = 0;
  }, [open]);
  // The sheet follows the pointer 1:1 through a ref (no re-render per frame); upward it pulls against a rubber band.
  const place = (y: number) => {
    g.current.at = y;
    const el = content.current;
    if (!el) return;
    el.style.transform = y ? `translateY(${y}px)` : "";
    el.style.transition = y ? "none" : "";
  };
  /** Back to rest on a critically damped spring that starts at the release velocity (px/s): no wobble, no jump. */
  const settle = (v: number) => {
    const s = g.current;
    cancelAnimationFrame(s.raf);
    const y0 = s.at;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return place(0);
    const w = 18;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = (now - t0) / 1000;
      const y = (y0 + (v + w * y0) * t) * Math.exp(-w * t);
      place(Math.abs(y) < 0.5 ? 0 : y);
      if (Math.abs(y) >= 0.5) s.raf = requestAnimationFrame(step);
    };
    s.raf = requestAnimationFrame(step);
  };
  const end = () => {
    const s = g.current;
    if (!s.on) return;
    s.on = false;
    // A pause before letting go counts as no throw.
    const v = performance.now() - s.t > 80 ? 0 : s.v;
    if (s.at > 80 || (v > 600 && s.at > 12)) setOpen(false);
    else settle(v);
  };
  const grab = {
    onPointerDown: (e: React.PointerEvent) => {
      cancelAnimationFrame(g.current.raf);
      Object.assign(g.current, { y: e.clientY - g.current.at, t: performance.now(), v: 0, on: true });
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent) => {
      const s = g.current;
      if (!s.on) return;
      const raw = e.clientY - s.y;
      const y = raw >= 0 ? raw : -(1 - 1 / ((-raw * 0.55) / 120 + 1)) * 120;
      const now = performance.now();
      s.v = s.v * 0.5 + ((y - s.at) / Math.max(1, now - s.t)) * 1000 * 0.5;
      s.t = now;
      place(y);
    },
    onPointerUp: end,
    onPointerCancel: () => ((g.current.on = false), settle(0)),
  };
  return (
    <D.Root open={open} onOpenChange={setOpen}>
      {trigger ? <D.Trigger asChild>{trigger}</D.Trigger> : null}
      <D.Portal>
        <D.Overlay className={overlayClass} />
        <D.Content
          ref={content}
          aria-describedby={undefined}
          className={cn(
            "fixed inset-x-2 bottom-2 z-50 mx-auto grid max-h-[85dvh] w-auto max-w-[520px] grid-rows-[auto_auto_1fr_auto] gap-3 rounded-sheet bg-surface px-pad pb-pad text-ink shadow-dialog",
            "transition-transform duration-[220ms] ease-ad data-[state=open]:animate-[ad-drawer-in_260ms_var(--ad-ease)] data-[state=closed]:animate-[ad-drawer-out_210ms_ease-in]",
            className,
          )}
        >
          <style href="ad-drawer" precedence="default">{`@keyframes ad-drawer-in { from { transform: translateY(calc(100% + 16px)); } } @keyframes ad-drawer-out { to { transform: translateY(calc(100% + 16px)); } }`}</style>
          <div {...grab} className="-mx-pad flex cursor-grab touch-none justify-center pb-1 pt-2.5 active:cursor-grabbing">
            <span aria-hidden className="h-1 w-10 rounded-full bg-fill-strong" />
          </div>
          <D.Title {...grab} className="touch-none text-title font-semibold">
            {title}
          </D.Title>
          <div className="-mx-pad min-h-0 overflow-y-auto overscroll-contain px-pad">{children}</div>
          {footer ? <div className="grid gap-2 sm:flex sm:justify-end [&>*]:justify-center">{footer}</div> : null}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

export const DrawerClose = D.Close;
