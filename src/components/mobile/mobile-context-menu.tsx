import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/ad";
import { MobileLayer } from "./mobile-sheet";

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
 * Press and hold for a thing's actions. While the finger is down the item dips a little; at the hold mark the menu
 * grows out of the point you pressed (its transform origin is that corner), opening below the finger or above it when
 * the room is underneath, and never off screen. A tap outside, Esc or picking an action closes it. Holding is a
 * shortcut: give the same actions a visible button too (open it with `open`), and right-click opens it on a desktop.
 */
export function MobileContextMenu({ children, actions, open: openProp, onOpenChange, ...aria }: MobileContextMenuProps) {
  const layer = React.useContext(MobileLayer);
  const [own, setOwn] = React.useState(false);
  const open = openProp ?? own;
  const setOpen = (o: boolean) => (onOpenChange ? onOpenChange(o) : setOwn(o));
  const [at, setAt] = React.useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [pressing, setPressing] = React.useState(false);
  const target = React.useRef<HTMLElement | null>(null);
  const hold = React.useRef<{ t: number; x: number; y: number; fired: boolean } | null>(null);
  const menu = React.useRef<HTMLDivElement>(null);

  /** A point in the layer's own (unscaled) coordinates; a docs phone frame is scaled with a transform. */
  const local = (cx: number, cy: number) => {
    const host = layer ?? document.documentElement;
    const r = host.getBoundingClientRect();
    const k = layer ? layer.offsetWidth / r.width : 1;
    return { x: (cx - (layer ? r.left : 0)) * k, y: (cy - (layer ? r.top : 0)) * k, w: layer ? layer.offsetWidth : window.innerWidth, h: layer ? layer.offsetHeight : window.innerHeight };
  };
  const openAt = (cx: number, cy: number) => {
    setAt(local(cx, cy));
    setOpen(true);
  };
  // Opened from a button: grow from the middle of the item.
  React.useEffect(() => {
    if (open && !at && target.current) {
      const r = target.current.getBoundingClientRect();
      setAt(local(r.left + r.width * 0.7, r.top + r.height / 2));
    }
    if (!open) setAt(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  React.useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", key);
    menu.current?.focus({ preventScroll: true });
    return () => window.removeEventListener("keydown", key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  React.useEffect(() => () => window.clearTimeout(hold.current?.t), []);

  const cancel = () => {
    if (hold.current) window.clearTimeout(hold.current.t);
    setPressing(false);
  };
  const trigger = (
    <div
      ref={(el) => void (target.current = el)}
      className="min-w-0 touch-manipulation select-none [-webkit-touch-callout:none]"
      style={{ transform: pressing ? "scale(0.97)" : undefined, transition: "transform 380ms var(--ad-ease)" }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        const { clientX: x, clientY: y } = e;
        setPressing(true);
        hold.current = { x, y, fired: false, t: window.setTimeout(() => ((hold.current!.fired = true), setPressing(false), openAt(x, y)), HOLD) };
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

  // Place the menu: right of the finger unless there's no room, below unless there's no room, inside the screen.
  const h = actions.length * 48 + 12;
  let pos: React.CSSProperties = {};
  let origin = "top left";
  if (at) {
    const right = at.x + W + 12 <= at.w;
    const below = at.y + h + 12 <= at.h - 34;
    const left = Math.max(12, Math.min(at.w - W - 12, right ? at.x : at.x - W));
    const top = Math.max(56, Math.min(at.h - h - 40, below ? at.y : at.y - h));
    pos = { left, top, width: W };
    origin = `${at.x - left}px ${at.y - top}px`;
  }
  const row =
    "flex h-[48px] w-full cursor-pointer select-none items-center gap-3 rounded-[calc(var(--ad-radius-card)-var(--ad-nest))] px-3 text-left text-[16px] transition-[background-color,transform] duration-[100ms] ease-ad [-webkit-tap-highlight-color:transparent] active:scale-[0.98] active:bg-fill [@media(hover:hover)]:hover:bg-fill";
  return (
    <>
      {trigger}
      {open && at && typeof document !== "undefined"
        ? createPortal(
            <>
              <div aria-hidden className="fixed inset-0 z-50 bg-overlay animate-[ad-fade-in_160ms_var(--ad-ease)]" onClick={() => setOpen(false)} />
              <div
                ref={menu}
                role="menu"
                tabIndex={-1}
                aria-label={aria["aria-label"] ?? "Actions"}
                className="ad-ctx-menu fixed z-50 grid rounded-card bg-raised p-nest shadow-dialog outline-none"
                style={{ ...pos, transformOrigin: origin, animation: "ad-ctx-in 220ms cubic-bezier(0.32, 0.72, 0, 1)" }}
              >
                <style href="ad-context-menu" precedence="default">{`@keyframes ad-ctx-in { from { opacity: 0; transform: scale(0.6); } } @media (prefers-reduced-motion: reduce) { .ad-ctx-menu { animation-name: ad-fade-in !important; } }`}</style>
                {actions.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    role="menuitem"
                    onClick={() => {
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
