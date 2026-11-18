import * as React from "react";
import { createPortal } from "react-dom";
import { Popover as P } from "radix-ui";
import { autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/react-dom";
import { ChevronRight } from "react-feather";
import { cn } from "@/lib/ad";

/*
 * Menu with submenus and a safe triangle (Kamens 2013, Alexoglou 2023).
 * - Leaving a submenu trigger toward its panel keeps the panel open while the
 *   pointer stays inside the triangle from the pointer to the panel's near edge.
 * - The triangle is debounced: if the pointer rests for DEBOUNCE ms it expires
 *   and the item under the pointer takes over.
 * - Leaving the triangle (back to the parent, or anywhere else) drops it at once.
 * - Every submenu also opens on click, tap, ArrowRight, Enter and Space.
 */

const DEBOUNCE = 140;
const HOVER_OPEN = 70;

type Pt = { x: number; y: number };
type Safe = { apex: Pt; a: Pt; b: Pt; owner: string; panel: HTMLElement };

type RootCtx = { close: () => void; setViz: (tri: [Pt, Pt, Pt] | null) => void };
type LevelCtx = {
  id: string;
  openSub: string | null;
  setOpenSub: (id: string | null) => void;
  suppressed: () => boolean;
  startSafe: (s: Safe) => void;
  endSafe: () => void;
  container: React.RefObject<HTMLDivElement | null>;
};

const Root = React.createContext<RootCtx | null>(null);
const Level = React.createContext<LevelCtx | null>(null);
const useRoot = () => React.useContext(Root)!;
const useLevel = () => React.useContext(Level)!;

const sign = (p: Pt, a: Pt, b: Pt) => (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y);
function inTriangle(p: Pt, a: Pt, b: Pt, c: Pt) {
  const d1 = sign(p, a, b), d2 = sign(p, b, c), d3 = sign(p, c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
const inRect = (p: Pt, r: DOMRect) => p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;

export const menuSurface = cn(
  "z-50 min-w-48 rounded-card bg-raised p-nest text-ink shadow-raised",
  "origin-(--radix-popover-content-transform-origin) data-[state=open]:animate-[ad-in_220ms_var(--ad-ease)] data-[state=closed]:animate-[ad-out_120ms_ease-in]",
);

const itemClass = cn(
  "flex h-item w-full cursor-pointer select-none items-center gap-2.5 rounded-control px-2.5 text-left text-body text-ink outline-none",
  "focus:bg-fill data-[open=true]:bg-fill aria-disabled:pointer-events-none aria-disabled:opacity-45",
);

function items(container: HTMLElement | null, level: string) {
  return Array.from(container?.querySelectorAll<HTMLElement>(`[data-menu-level="${level}"]:not([aria-disabled="true"])`) ?? []);
}

function MenuLevel({ children, container }: { children: React.ReactNode; container: React.RefObject<HTMLDivElement | null> }) {
  const id = React.useId();
  const root = useRoot();
  const [openSub, setOpenSub] = React.useState<string | null>(null);
  const safe = React.useRef<Safe | null>(null);
  const timer = React.useRef<number | undefined>(undefined);

  const takeOver = React.useCallback(
    (p: Pt | null, owner: string) => {
      // The item under the pointer gets the hover, as if the triangle never existed.
      const el = p ? document.elementFromPoint(p.x, p.y)?.closest<HTMLElement>(`[data-menu-level="${id}"]`) : null;
      if (!el) return;
      el.focus();
      const sub = el.dataset.sub ?? null;
      if (sub !== owner) setOpenSub(sub);
    },
    [id],
  );

  const endSafe = React.useCallback(() => {
    window.clearTimeout(timer.current);
    safe.current = null;
    root.setViz(null);
  }, [root]);

  const ctx = React.useMemo<LevelCtx>(() => {
    let last: Pt | null = null;
    const onMove = (e: PointerEvent) => {
      const s = safe.current;
      if (!s) return document.removeEventListener("pointermove", onMove);
      const p = { x: e.clientX, y: e.clientY };
      last = p;
      if (inRect(p, s.panel.getBoundingClientRect())) {
        document.removeEventListener("pointermove", onMove);
        return endSafe();
      }
      if (inTriangle(p, s.apex, s.a, s.b)) {
        // Still heading for the panel: shrink the triangle and restart the debounce.
        s.apex = { x: p.x + (s.a.x > p.x ? -4 : 4), y: p.y };
        root.setViz([s.apex, s.a, s.b]);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
          document.removeEventListener("pointermove", onMove);
          endSafe();
          takeOver(last, s.owner);
        }, DEBOUNCE);
        return;
      }
      document.removeEventListener("pointermove", onMove);
      endSafe();
      takeOver(p, s.owner);
    };
    return {
      id,
      openSub,
      setOpenSub,
      container,
      suppressed: () => safe.current != null,
      endSafe,
      startSafe: (s) => {
        safe.current = s;
        root.setViz([s.apex, s.a, s.b]);
        document.addEventListener("pointermove", onMove);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
          document.removeEventListener("pointermove", onMove);
          endSafe();
          takeOver(last, s.owner);
        }, DEBOUNCE * 2);
      },
    };
  }, [id, openSub, container, endSafe, root, takeOver]);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  return <Level.Provider value={ctx}>{children}</Level.Provider>;
}

function levelKeys(e: React.KeyboardEvent, container: HTMLElement | null, level: string) {
  const list = items(container, level);
  const at = list.indexOf(document.activeElement as HTMLElement);
  let next: number;
  if (e.key === "ArrowDown") next = at < 0 ? 0 : (at + 1) % list.length;
  else if (e.key === "ArrowUp") next = at < 0 ? list.length - 1 : (at - 1 + list.length) % list.length;
  else if (e.key === "Home") next = 0;
  else if (e.key === "End") next = list.length - 1;
  else return false;
  e.preventDefault();
  list[next]?.focus();
  return true;
}

export interface MenuProps {
  trigger: React.ReactElement;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  /** "dark" for menus opened from the dark sidebar. */
  tone?: "light" | "dark";
  /** Draw the safe triangle while it is active (for demos and debugging). */
  showSafeArea?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function Menu({ trigger, children, align = "start", side = "bottom", tone = "light", showSafeArea, open: openProp, onOpenChange, className }: MenuProps) {
  const [openState, setOpenState] = React.useState(false);
  const open = openProp ?? openState;
  const setOpen = (o: boolean) => {
    setOpenState(o);
    onOpenChange?.(o);
  };
  const [viz, setViz] = React.useState<[Pt, Pt, Pt] | null>(null);
  const container = React.useRef<HTMLDivElement>(null);
  const viaKeyboard = React.useRef(false);
  const root = React.useMemo<RootCtx>(() => ({ close: () => setOpen(false), setViz: showSafeArea ? setViz : () => {} }), [showSafeArea]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Root.Provider value={root}>
      <P.Root open={open} onOpenChange={setOpen}>
        <P.Trigger
          asChild
          aria-haspopup="menu"
          onPointerDown={() => (viaKeyboard.current = false)}
          onKeyDown={(e) => {
            viaKeyboard.current = true;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        >
          {trigger}
        </P.Trigger>
        <P.Portal>
          <P.Content
            ref={container}
            role="menu"
            align={align}
            side={side}
            sideOffset={6}
            collisionPadding={8}
            tabIndex={-1}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              const box = container.current;
              const first = box?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])');
              (viaKeyboard.current ? first : box)?.focus();
            }}
            className={cn(menuSurface, "relative", tone === "dark" && "ad-on-dark", className)}
          >
            <MenuLevel container={container}>
              <LevelKeys>{children}</LevelKeys>
            </MenuLevel>
          </P.Content>
        </P.Portal>
      </P.Root>
      {showSafeArea && viz
        ? createPortal(
            <svg className="pointer-events-none fixed inset-0 z-[60] size-full" aria-hidden>
              <polygon points={viz.map((p) => `${p.x},${p.y}`).join(" ")} style={{ fill: "var(--ad-brand)", fillOpacity: 0.16 }} />
            </svg>,
            document.body,
          )
        : null}
    </Root.Provider>
  );
}

function LevelKeys({ children }: { children: React.ReactNode }) {
  const level = useLevel();
  return (
    <div
      className="grid gap-px"
      onKeyDown={(e) => {
        if (levelKeys(e, level.container.current, level.id)) e.stopPropagation();
      }}
    >
      {children}
    </div>
  );
}

export interface MenuItemProps {
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  children: React.ReactNode;
  shortcut?: string;
  onSelect?: () => void;
  disabled?: boolean;
}

export function MenuItem({ icon: Icon, children, shortcut, onSelect, disabled }: MenuItemProps) {
  const level = useLevel();
  const root = useRoot();
  const select = () => {
    onSelect?.();
    root.close();
  };
  return (
    <div
      role="menuitem"
      tabIndex={-1}
      data-menu-level={level.id}
      aria-disabled={disabled || undefined}
      className={itemClass}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || level.suppressed()) return;
        if (document.activeElement !== e.currentTarget) e.currentTarget.focus();
        if (level.openSub) level.setOpenSub(null);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse" && !level.suppressed() && document.activeElement === e.currentTarget) level.container.current?.focus();
      }}
      onClick={select}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select();
        }
      }}
    >
      {Icon ? <Icon size={16} className="shrink-0 text-ink-muted" /> : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut ? <span className="pl-4 text-small text-ink-muted">{shortcut}</span> : null}
    </div>
  );
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <div className="flex h-item items-center px-2.5 text-small text-ink-muted">{children}</div>;
}

/** Groups are separated by space, never by a line. */
export function MenuGroup({ children }: { children: React.ReactNode }) {
  return <div className="mt-1.5 grid gap-px first:mt-0">{children}</div>;
}

export interface MenuSubProps {
  label: React.ReactNode;
  icon?: MenuItemProps["icon"];
  children: React.ReactNode;
}

export function MenuSub({ label, icon: Icon, children }: MenuSubProps) {
  const id = React.useId();
  const level = useLevel();
  const open = level.openSub === id;
  const trigger = React.useRef<HTMLDivElement>(null);
  const panel = React.useRef<HTMLDivElement>(null);
  const hoverTimer = React.useRef<number | undefined>(undefined);
  const nest = typeof window === "undefined" ? 4 : parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ad-nest")) || 4;
  const { refs, floatingStyles } = useFloating({
    open,
    placement: "right-start",
    strategy: "absolute",
    middleware: [offset({ mainAxis: nest * 2, crossAxis: -nest }), flip({ fallbackPlacements: ["left-start"] }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const focusFirst = () =>
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')?.focus());

  React.useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  return (
    <>
      <div
        ref={(el) => {
          trigger.current = el;
          refs.setReference(el);
        }}
        role="menuitem"
        tabIndex={-1}
        aria-haspopup="menu"
        aria-expanded={open}
        data-menu-level={level.id}
        data-sub={id}
        data-open={open}
        className={itemClass}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse" || level.suppressed()) return;
          if (document.activeElement !== e.currentTarget) e.currentTarget.focus();
          if (!open && hoverTimer.current === undefined) {
            hoverTimer.current = window.setTimeout(() => {
              hoverTimer.current = undefined;
              level.setOpenSub(id);
            }, level.openSub ? 0 : HOVER_OPEN);
          }
        }}
        onPointerLeave={(e) => {
          window.clearTimeout(hoverTimer.current);
          hoverTimer.current = undefined;
          if (e.pointerType !== "mouse" || !open || !panel.current) return;
          const r = panel.current.getBoundingClientRect();
          const t = e.currentTarget.getBoundingClientRect();
          const right = r.left >= t.left + t.width / 2;
          const x = right ? r.left : r.right;
          level.startSafe({
            apex: { x: e.clientX + (right ? -4 : 4), y: e.clientY },
            a: { x, y: r.top - 6 },
            b: { x, y: r.bottom + 6 },
            owner: id,
            panel: panel.current,
          });
        }}
        onClick={() => {
          level.setOpenSub(open ? null : id);
          if (!open) focusFirst();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            level.setOpenSub(id);
            focusFirst();
          }
        }}
      >
        {Icon ? <Icon size={16} className="shrink-0 text-ink-muted" /> : null}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <ChevronRight size={16} className="-mr-1 shrink-0 text-ink-muted" />
      </div>
      {open ? (
        <div
          ref={(el) => {
            panel.current = el;
            refs.setFloating(el);
          }}
          role="menu"
          style={floatingStyles}
          className={cn(menuSurface, "animate-[ad-fade-in_160ms_var(--ad-ease)]")}
          onPointerEnter={() => level.endSafe()}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              level.setOpenSub(null);
              trigger.current?.focus();
            }
          }}
        >
          <MenuLevel container={panel}>
            <LevelKeys>{children}</LevelKeys>
          </MenuLevel>
        </div>
      ) : null}
    </>
  );
}
