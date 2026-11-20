import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/ad";
import { MobileLayer, useReturnFocus } from "./mobile-sheet";

export interface ContextAction {
  label: string;
  icon?: React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>;
  onSelect: () => void;
  destructive?: boolean;
}

export interface MobileContextMenuProps {
  /** The thing you press and hold (a row, a card). */
  children: React.ReactNode;
  actions: ContextAction[];
  /** Controlled open (for the visible "…" twin of the gesture). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  "aria-label"?: string;
}

const HOLD = 420;
const W = 240;

/**
 * Press and hold for a thing's actions. While the finger is down the item dips a little; at the hold mark the item
 * lifts above the dimmed screen (so you see what you are acting on) and the menu grows out of it towards the finger,
 * attached below the item or above it when there is no room, never off screen. Lifting the finger keeps it open; a tap
 * outside, Esc or picking an action closes it, and everything fades back out together. Holding is a shortcut: give the
 * same actions a visible button too (open it with `open`), and right-click opens it on a desktop. By keyboard the
 * arrows, Home and End move through the actions, and focus returns to the button on close.
 */
export function MobileContextMenu({ children, actions, open: openProp, onOpenChange, ...aria }: MobileContextMenuProps) {
  const layer = React.useContext(MobileLayer);
  const [own, setOwn] = React.useState(false);
  const open = openProp ?? own;
  const setOpen = (o: boolean) => (onOpenChange ? onOpenChange(o) : setOwn(o));
  /** The finger (x, y), the item's rect (in the layer's own px) and the layer size. */
  const [at, setAt] = React.useState<{ x: number; y: number; w: number; h: number; item: { left: number; top: number; width: number; height: number } } | null>(null);
  const [pressing, setPressing] = React.useState(false);
  const target = React.useRef<HTMLElement | null>(null);
  const hold = React.useRef<{ t: number; x: number; y: number; fired: boolean } | null>(null);
  const menu = React.useRef<HTMLDivElement>(null);
  const restoreFocus = useReturnFocus(open);
  // Opened from a keyboard-focused button: focus the first action. Opened by touch: focus the menu itself, so no
  // action shows a focus fill under the finger.
  const byKey = React.useRef(false);
  // The click that ends a long press lands on whatever is under the finger after the menu opened (the dim). Ignore
  // clicks until the finger is up, plus a short grace for the click that follows the release.
  const guard = React.useRef(0);

  /** A point in the layer's own (unscaled) coordinates; a docs phone frame is scaled with a transform. */
  const local = (cx: number, cy: number) => {
    const host = layer ?? document.documentElement;
    const r = host.getBoundingClientRect();
    const k = layer ? layer.offsetWidth / r.width : 1;
    return { x: (cx - (layer ? r.left : 0)) * k, y: (cy - (layer ? r.top : 0)) * k, w: layer ? layer.offsetWidth : window.innerWidth, h: layer ? layer.offsetHeight : window.innerHeight };
  };
  const where = (cx: number, cy: number) => {
    const p = local(cx, cy);
    // The item may still be dipped (scale 0.97) when the hold fires: place the lift from its centre and layout size.
    const el = target.current!;
    const r = el.getBoundingClientRect();
    const c = local(r.left + r.width / 2, r.top + r.height / 2);
    return { ...p, item: { left: c.x - el.offsetWidth / 2, top: c.y - el.offsetHeight / 2, width: el.offsetWidth, height: el.offsetHeight } };
  };
  const openAt = (cx: number, cy: number) => {
    setAt(where(cx, cy));
    setOpen(true);
  };
  // Opened from a button: grow from the item's right side. The tap that opened it may be the first of a double tap,
  // whose second half lands on the new dim: ignore it.
  React.useEffect(() => {
    if (open && !at && target.current) {
      byKey.current = !!document.activeElement?.matches(":focus-visible");
      guard.current = Math.max(guard.current, performance.now() + 350);
      const r = target.current.getBoundingClientRect();
      setAt(where(r.left + r.width * 0.7, r.top + r.height / 2));
    }
    // Closing keeps `at` until the fade-out ends (onAnimationEnd below).
    if (!open && at) restoreFocus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  React.useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  // The menu mounts once `at` is known, a render after `open`: focus it as it attaches.
  const attachMenu = React.useCallback((el: HTMLDivElement | null) => {
    menu.current = el;
    if (!el) return;
    const first = byKey.current ? el.querySelector<HTMLElement>("[role=menuitem]") : null;
    (first ?? el).focus({ preventScroll: true });
    byKey.current = false;
  }, []);
  const roam = (e: React.KeyboardEvent) => {
    const items = [...(menu.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next = { ArrowDown: (i + 1) % items.length, ArrowUp: (i <= 0 ? items.length : i) - 1, Home: 0, End: items.length - 1 }[e.key];
    if (e.key === "Tab") return setOpen(false);
    if (next === undefined || !items.length) return;
    e.preventDefault();
    items[next].focus({ preventScroll: true });
  };
  const closing = !open && !!at;
  React.useEffect(() => () => window.clearTimeout(hold.current?.t), []);

  const cancel = () => {
    if (hold.current) window.clearTimeout(hold.current.t);
    setPressing(false);
  };
  const armGuard = () => {
    guard.current = Infinity;
    const up = () => {
      guard.current = performance.now() + 400;
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", up, true);
    };
    window.addEventListener("pointerup", up, true);
    window.addEventListener("pointercancel", up, true);
  };
  // Compared with the time the finger touched (the pointerdown's timeStamp), so a click a busy main thread handles late
  // still counts as early. Keyboard clicks have no pointerdown and are never guarded.
  const downAt = React.useRef(-Infinity);
  const guarded = (t: number = performance.now()) => t < guard.current;
  const trigger = (
    <div
      ref={(el) => void (target.current = el)}
      className="min-w-0 touch-manipulation select-none [-webkit-touch-callout:none]"
      style={{ transform: pressing ? "scale(0.97)" : undefined, transition: "transform 380ms var(--ad-ease)" }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        const { clientX: x, clientY: y } = e;
        setPressing(true);
        hold.current = { x, y, fired: false, t: window.setTimeout(() => ((hold.current!.fired = true), armGuard(), setPressing(false), openAt(x, y)), HOLD) };
      }}
      onPointerMove={(e) => {
        const h = hold.current;
        if (h && !h.fired && Math.hypot(e.clientX - h.x, e.clientY - h.y) > 8) cancel();
      }}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onPointerLeave={cancel}
      onContextMenu={(e) => {
        e.preventDefault();
        // A touch long-press can also raise contextmenu while the finger is still down: treat it as the hold firing.
        if (pressing && hold.current && !hold.current.fired) {
          hold.current.fired = true;
          armGuard();
        }
        cancel();
        openAt(e.clientX, e.clientY);
      }}
      // The click that ends a long press is not a tap.
      onClickCapture={(e) => {
        if (hold.current?.fired) {
          e.preventDefault();
          e.stopPropagation();
          hold.current.fired = false;
        }
      }}
    >
      {children}
    </div>
  );

  // Place the menu against the item: below it unless there's no room, then above it, inside the screen. It lines up
  // with the item's edge on the finger's side and grows out of the point nearest the finger.
  const h = actions.length * 48 + 12;
  const GAP = 8;
  let pos: React.CSSProperties = {};
  let origin = "top left";
  if (at) {
    const it = at.item;
    const roomBelow = at.h - 40 - (it.top + it.height + GAP);
    const below = roomBelow >= h || roomBelow >= it.top - 56 - GAP;
    const right = at.x > it.left + it.width / 2;
    const left = Math.max(12, Math.min(at.w - W - 12, right ? it.left + it.width - W : it.left));
    const top = Math.max(56, Math.min(at.h - h - 40, below ? it.top + it.height + GAP : it.top - GAP - h));
    pos = { left, top, width: W };
    origin = `${Math.max(0, Math.min(W, at.x - left))}px ${below ? 0 : h}px`;
  }
  // Menu items don't scale; the fill lands at once on press and fades on release.
  const row =
    "flex h-[48px] w-full cursor-pointer select-none items-center gap-3 rounded-[calc(var(--ad-radius-card)-var(--ad-nest))] px-3 text-left text-[16px] transition-colors duration-[100ms] focus-visible:bg-fill active:bg-fill active:duration-0 data-pressed:bg-fill data-pressed:duration-0 [@media(hover:hover)]:hover:bg-fill";
  // Out: 150 ms fades for the dim and the lift, the menu shrinks back to 0.97; unmounted when the menu's ends.
  const fade = closing ? "ad-fade-out 150ms var(--ad-ease) forwards" : undefined;
  return (
    <>
      {trigger}
      {at && typeof document !== "undefined"
        ? createPortal(
            <>
              {/* While closing the dim still takes taps (and drops them), so a stray second tap can't hit the screen. */}
              <div aria-hidden className="fixed inset-0 z-50 bg-overlay animate-[ad-fade-in_160ms_var(--ad-ease)]" style={{ animation: fade }} onPointerDown={(e) => void (downAt.current = e.timeStamp)} onClick={() => open && !guarded(downAt.current) && setOpen(false)} />
              {/* The pressed item, lifted above the dim: a still copy in the item's place (not interactive). */}
              <div
                aria-hidden
                inert
                data-closing={closing || undefined}
                className="ad-ctx-lift pointer-events-none fixed z-50 overflow-hidden rounded-item bg-surface shadow-dialog"
                style={{ left: at.item.left, top: at.item.top, width: at.item.width, height: at.item.height, animation: fade ?? "ad-ctx-lift 220ms var(--ad-ease-page)" }}
              >
                {children}
              </div>
              <div
                ref={attachMenu}
                role="menu"
                tabIndex={-1}
                aria-label={aria["aria-label"] ?? "Actions"}
                onKeyDown={roam}
                data-closing={closing || undefined}
                onAnimationEnd={(e) => e.target === e.currentTarget && closing && setAt(null)}
                className={cn("ad-ctx-menu fixed z-50 grid rounded-card bg-raised p-nest shadow-dialog outline-none", closing && "pointer-events-none")}
                style={{ ...pos, transformOrigin: origin, animation: closing ? "ad-ctx-out 150ms var(--ad-ease) forwards" : "ad-ctx-in 220ms var(--ad-ease-page)" }}
              >
                <style href="ad-context-menu" precedence="default">{`@keyframes ad-ctx-in { from { opacity: 0; transform: scale(0.95); } } @keyframes ad-ctx-out { to { opacity: 0; transform: scale(0.97); } } @keyframes ad-ctx-lift { from { transform: scale(0.97); } } @media (prefers-reduced-motion: reduce) { .ad-ctx-menu:not([data-closing]) { animation-name: ad-fade-in !important; } .ad-ctx-menu[data-closing] { animation-name: ad-fade-out !important; } .ad-ctx-lift:not([data-closing]) { animation: none !important; } }`}</style>
                {actions.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    role="menuitem"
                    onPointerDown={(e) => void (downAt.current = e.timeStamp)}
                    onClick={(e) => {
                      if (!open || (e.detail > 0 && guarded(downAt.current))) return;
                      setOpen(false);
                      a.onSelect();
                    }}
                    className={cn(row, a.destructive ? "text-danger" : "text-ink")}
                  >
                    {a.icon ? <a.icon size={20} strokeWidth={1.75} /> : null}
                    {a.label}
                  </button>
                ))}
              </div>
            </>,
            layer ?? document.body,
          )
        : null}
    </>
  );
}
