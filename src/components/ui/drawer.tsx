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
 * down to close (grab the handle or the title row; past 80 px or a quick flick it closes). Desktop uses Sheet or Dialog.
 */
export function Drawer({ open: openProp, onOpenChange, trigger, title, children, footer, className }: DrawerProps) {
  const [own, setOwn] = React.useState(false);
  const open = openProp ?? own;
  const setOpen = (o: boolean) => (onOpenChange ? onOpenChange(o) : setOwn(o));
  const [drag, setDrag] = React.useState(0);
  const start = React.useRef<{ y: number; t: number } | null>(null);
  const end = (y: number) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const dy = y - s.y;
    const fast = dy / Math.max(1, performance.now() - s.t) > 0.6;
    setDrag(0);
    if (dy > 80 || (fast && dy > 20)) setOpen(false);
  };
  const grab = {
    onPointerDown: (e: React.PointerEvent) => {
      start.current = { y: e.clientY, t: performance.now() };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent) => start.current && setDrag(Math.max(0, e.clientY - start.current.y)),
    onPointerUp: (e: React.PointerEvent) => end(e.clientY),
    onPointerCancel: () => ((start.current = null), setDrag(0)),
  };
  return (
    <D.Root open={open} onOpenChange={setOpen}>
      {trigger ? <D.Trigger asChild>{trigger}</D.Trigger> : null}
      <D.Portal>
        <D.Overlay className={overlayClass} />
        <D.Content
          aria-describedby={undefined}
          style={{ transform: drag ? `translateY(${drag}px)` : undefined, transition: drag ? "none" : undefined }}
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
