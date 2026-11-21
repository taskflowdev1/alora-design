import * as React from "react";
import { Link, Outlet, ScrollRestoration, useLocation, useNavigate } from "react-router";
import { BookOpen, Box, Cpu, Download, Grid, Home, Image, Layout, Moon, RotateCcw, Search as SearchIcon, Sliders, Smartphone, Sun, X } from "react-feather";
import { cn, prefersReducedMotion } from "@/lib/ad";
import { serializeConfig } from "@/lib/config";
import { Button, buttonClass } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { SlidingPill } from "@/components/ui/sliding-pill";
import { Toaster } from "@/components/ui/toast";
import { CommandPalette, useCommandShortcut } from "@/components/ui/command-palette";
import { Shortcut } from "@/components/ui/kbd";
import { GROUPS, ITEMS, findItem, itemPath, type Group } from "@/lib/registry";
import { TooltipProvider, Tooltip } from "@/components/ui/tooltip";
import { ConfigTokens, SLink, useConfig, useLiveConfig } from "./config";
import { ALL_FIELDS, ConfigGroups, ConfigPanel, resetPatch } from "./config-panel";
import { Wordmark } from "./logo";

/** The nav tabs, in order. Components first: the site starts with them. */
export const TABS = [
  { to: "/components", label: "Components" },
  { to: "/ai", label: "AI" },
  { to: "/backgrounds", label: "Backgrounds" },
  { to: "/examples", label: "Examples" },
  { to: "/encyclopedia", label: "Encyclopedia" },
  { to: "/export", label: "Export" },
];

/** A header tab. Components stays lit on /mobile too: Desktop and Mobile are the two halves of one Components tab. */
function NavItem({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) {
  const [config] = useConfig();
  const q = serializeConfig(config);
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(`${to}/`) || (to === "/components" && (pathname === "/mobile" || pathname.startsWith("/mobile/")));
  return (
    <Link
      to={q ? `${to}?${q}` : to}
      aria-current={active ? "page" : undefined}
      className={cn(buttonClass({ variant: "ghost" }), "relative shrink-0 text-ink-muted hover:text-ink", active && "bg-transparent text-ink hover:bg-transparent focus-visible:bg-transparent", className)}
    >
      {children}
    </Link>
  );
}

/** The tab row under the header on phones and tablets. It scrolls sideways when it doesn't fit, never the page. */
function PhoneTabs() {
  const ref = React.useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  React.useEffect(() => {
    const active = ref.current?.querySelector<HTMLElement>("a[aria-current=page]");
    if (active && ref.current) ref.current.scrollTo({ left: Math.max(0, active.offsetLeft - 16), behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  useEdgeFadeX(ref);
  return (
    <nav ref={ref} aria-label="Sections" className="relative mx-auto flex h-11 w-full max-w-[1280px] items-start gap-0.5 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6 lg:hidden [&::-webkit-scrollbar]:hidden">
      <SlidingPill selector='a[aria-current="page"]' className="rounded-control bg-fill-strong" />
      {TABS.map((t) => (
        <NavItem key={t.to} to={t.to} className="px-2.5">
          {t.label}
        </NavItem>
      ))}
    </nav>
  );
}

/** Phones and small tablets: the header button and its popover. From md up the left flap replaces it. */
function CustomizeButton({ label = true, className }: { label?: boolean; className?: string }) {
  const [config, setConfig] = useLiveConfig();
  return (
    <Popover
      align="end"
      className="flex max-h-[min(var(--radix-popover-content-available-height),calc(100dvh-16px))] w-[min(340px,calc(100vw-16px))] flex-col p-0"
      trigger={
        <Button variant="secondary" icon={!label} aria-label="Customize" className={className}>
          <Sliders />
          {label ? <span className="max-sm:hidden">Customize</span> : null}
        </Button>
      }
    >
      <OwnScrollBox className="p-pad">
        <ConfigPanel value={config} onChange={setConfig} onReset={() => setConfig(resetPatch(ALL_FIELDS))} />
      </OwnScrollBox>
    </Popover>
  );
}

/** A scroll box that never hands its scroll to the page (wheel or touch), with a soft fade on the cut edge. */
function OwnScrollBox({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  useOwnScroll(ref, ref);
  useEdgeFade(ref);
  return (
    <div ref={ref} data-own-scroll className={cn("ad-fade-y min-h-0 flex-1 overflow-y-auto overscroll-contain", className)}>
      <div>{children}</div>
    </div>
  );
}

function ThemeButton() {
  const [config, setConfig] = useLiveConfig();
  const dark = config.theme === "dark";
  return (
    <Tooltip content={dark ? "Light theme" : "Dark theme"}>
      <Button variant="ghost" icon aria-label={dark ? "Light theme" : "Dark theme"} onClick={() => setConfig({ theme: dark ? "light" : "dark" })}>
        {dark ? <Sun /> : <Moon />}
      </Button>
    </Tooltip>
  );
}

const EXAMPLE_PAGES = [
  ["dashboard", "Dashboard"],
  ["orders", "Orders"],
  ["products", "Products"],
  ["promotions", "Promotions"],
  ["cancellations", "Cancellations"],
  ["team", "Team"],
  ["settings", "Settings"],
] as const;

function HeaderSearch() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const [config] = useConfig();
  const q = serializeConfig(config);
  const go = (path: string) => navigate(q ? `${path}?${q}` : path);
  useCommandShortcut(setOpen);
  const groups = React.useMemo(
    () => [
      {
        label: "Pages",
        items: [
          { id: "home", label: "Home", icon: Home, onSelect: () => go("/") },
          { id: "components", label: "Components", icon: Grid, onSelect: () => go("/components") },
          { id: "ai", label: "AI", icon: Cpu, onSelect: () => go("/ai") },
          { id: "backgrounds", label: "Backgrounds", icon: Image, onSelect: () => go("/backgrounds") },
          { id: "mobile", label: "Mobile components", keywords: "phone touch", icon: Smartphone, onSelect: () => go("/mobile") },
          { id: "mobile-screens", label: "Mobile screens", keywords: "phone app", icon: Smartphone, onSelect: () => go("/mobile/screens") },
          { id: "examples", label: "Examples", icon: Layout, onSelect: () => go("/examples/dashboard") },
          { id: "encyclopedia", label: "Encyclopedia", keywords: "rules checklist guidelines", icon: BookOpen, onSelect: () => go("/encyclopedia") },
          { id: "export", label: "Export", keywords: "install tokens kit", icon: Download, onSelect: () => go("/export") },
        ],
      },
      {
        label: "Examples",
        items: EXAMPLE_PAGES.map(([page, label]) => ({ id: `example-${page}`, label: `Examples › ${label}`, keywords: page, icon: Layout, onSelect: () => go(`/examples/${page}`) })),
      },
      ...[...GROUPS, "AI", "Backgrounds"].map((g) => ({
        label: g,
        items: ITEMS.filter((i) => i.group === (g as Group)).map((i) => ({ id: i.name, label: i.title, keywords: i.name, icon: Box, onSelect: () => go(itemPath(i)) })),
      })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q],
  );
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search components"
        className={cn(buttonClass({ variant: "secondary" }), "w-control justify-center px-0 font-normal text-ink-muted sm:w-52 sm:justify-start sm:px-3")}
      >
        <SearchIcon />
        <span className="flex-1 text-left max-sm:hidden">Search</span>
        <Shortcut keys={["mod", "K"]} className="max-sm:hidden" />
      </button>
      <CommandPalette open={open} onOpenChange={setOpen} groups={groups} placeholder="Find a component or page" />
    </>
  );
}

/**
 * The first Tab stop on every page: hidden until focused, then a pill over the logo. It moves focus to the page's
 * content, past the header and its tabs.
 */
function SkipLink() {
  return (
    <a
      href="#content"
      onClick={(e) => {
        e.preventDefault();
        const el = document.getElementById("content");
        el?.focus({ preventScroll: true });
        el?.scrollIntoView({ block: "start" });
      }}
      className={cn(
        buttonClass({ variant: "secondary" }),
        "absolute left-4 top-1/2 z-50 -translate-y-1/2 bg-fill-strong opacity-0 pointer-events-none focus-visible:pointer-events-auto focus-visible:opacity-100 sm:left-6",
      )}
    >
      Skip to content
    </a>
  );
}

/** One header for every page: same position, width and height on landing, gallery, examples and export. */
function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-page">
      <div className="relative mx-auto flex h-16 w-full max-w-[1280px] items-center gap-1 px-4 sm:px-6">
        <SkipLink />
        <SLink to="/" data-logo className="mr-3 flex rounded-control px-1 py-1 transition-colors duration-[160ms] focus-visible:bg-fill sm:mr-6">
          <Wordmark />
        </SLink>
        <nav aria-label="Sections" className="relative flex items-center gap-1 max-lg:hidden">
          <SlidingPill selector='a[aria-current="page"]' className="rounded-control bg-fill-strong" />
          {TABS.map((t) => (
            <NavItem key={t.to} to={t.to}>
              {t.label}
            </NavItem>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <HeaderSearch />
          <CustomizeButton className="md:hidden" />
          <ThemeButton />
        </div>
      </div>
      <PhoneTabs />
    </header>
  );
}

/** "Curated by Joshua Dirga · 2026", the name linking to the author’s site. Body size, like the rest of the page. */
export function Credit({ className }: { className?: string }) {
  return (
    <p className={cn("text-body text-ink-muted", className)}>
      Curated by{" "}
      <a href="https://joshuadirga.com" target="_blank" rel="noopener" className="-mx-1 rounded-small px-1 text-ink transition-colors duration-[160ms] hover:text-ink-muted focus-visible:bg-fill">
        Joshua Dirga
      </a>{" "}
      · 2026
    </p>
  );
}

/** One quiet line at the bottom of every page, on the page's left edge. The landing ends with its closing card instead. */
function SiteFooter() {
  const { pathname } = useLocation();
  // The landing ends with its closing card; the example app fills the window and scrolls inside itself.
  if (pathname === "/" || pathname.startsWith("/examples/")) return null;
  return (
    <footer className="mx-auto w-full max-w-[1280px] px-4 pb-12 pt-20 sm:px-6">
      <Credit />
    </footer>
  );
}

/* ------------------------------------------------------------ customize flap */

const PANEL_MIN = 344;
const CONTENT_MAX = 1280;
/** Narrower than this and the page would be squeezed, so the panel lies over it instead of pushing. */
const PAGE_MIN = 960;
const FLAP_MIN = 768;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SLIDE_MS = 300;

/** The panel takes all the room left of the 1280 px page (at least PANEL_MIN), so the page sits flush right. */
const panelWidth = (vw: number) => Math.max(PANEL_MIN, vw - CONTENT_MAX);
const inside = (t: EventTarget | null, ...els: (HTMLElement | null)[]) =>
  t instanceof Node && (els.some((el) => el?.contains(t)) || !!(t instanceof Element && t.closest("[data-radix-popper-content-wrapper]")));

/** Whether `el` itself would scroll for this delta (an overflowing auto/scroll box not already at that end). */
function canScroll(el: Element, dx: number, dy: number) {
  const s = getComputedStyle(el);
  const y = dy !== 0 && /auto|scroll/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1;
  const x = dx !== 0 && /auto|scroll/.test(s.overflowX) && el.scrollWidth > el.clientWidth + 1;
  if (y && (dy < 0 ? el.scrollTop > 0 : el.scrollTop + el.clientHeight < el.scrollHeight - 1)) return true;
  if (x && (dx < 0 ? el.scrollLeft > 0 : el.scrollLeft + el.clientWidth < el.scrollWidth - 1)) return true;
  return false;
}

/**
 * The panel is its own scroll area: wheel and touch over it scroll only its list and never chain into the page,
 * even at the list's ends or when the list fits without scrolling (overscroll-behavior can't stop that case).
 * Wheel over the panel's header goes to the list. Popovers opened from the panel are portalled outside it, so
 * they scroll as usual.
 */
function useOwnScroll(panelRef: React.RefObject<HTMLElement | null>, listRef: React.RefObject<HTMLElement | null>, on = true) {
  React.useEffect(() => {
    const panel = panelRef.current;
    const list = listRef.current;
    if (!panel || !list) return;
    // The nearest box between the target and the panel that can take this delta, if any.
    const taker = (target: EventTarget | null, dx: number, dy: number) => {
      for (let el = target instanceof Element ? target : null; el; el = el.parentElement) {
        if (canScroll(el, dx, dy)) return el;
        if (el === panel) break;
      }
      return null;
    };
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch zoom
      if (taker(e.target, e.deltaX, e.deltaY)) return;
      e.preventDefault();
      if (!list.contains(e.target as Node) && canScroll(list, 0, e.deltaY)) {
        const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? list.clientHeight : 1;
        list.scrollBy({ top: e.deltaY * unit });
      }
    };
    let last: { x: number; y: number } | null = null;
    const start = (e: TouchEvent) => {
      last = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
    };
    const move = (e: TouchEvent) => {
      if (!last || e.touches.length !== 1 || !e.cancelable) return;
      const t = e.touches[0];
      const dx = last.x - t.clientX;
      const dy = last.y - t.clientY;
      last = { x: t.clientX, y: t.clientY };
      if (!taker(e.target, dx, dy)) e.preventDefault();
    };
    panel.addEventListener("wheel", wheel, { passive: false });
    panel.addEventListener("touchstart", start, { passive: true });
    panel.addEventListener("touchmove", move, { passive: false });
    return () => {
      panel.removeEventListener("wheel", wheel);
      panel.removeEventListener("touchstart", start);
      panel.removeEventListener("touchmove", move);
    };
  }, [panelRef, listRef, on]);
}

/** Soft fade on the list's cut edge(s), only where there is more to scroll to. */
export function useEdgeFade(listRef: React.RefObject<HTMLElement | null>, on = true) {
  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const set = () => {
      const top = list.scrollTop > 1;
      const bottom = list.scrollTop + list.clientHeight < list.scrollHeight - 1;
      list.dataset.fade = top && bottom ? "both" : top ? "top" : bottom ? "bottom" : "none";
    };
    set();
    list.addEventListener("scroll", set, { passive: true });
    const ro = new ResizeObserver(set);
    ro.observe(list);
    if (list.firstElementChild) ro.observe(list.firstElementChild);
    return () => {
      list.removeEventListener("scroll", set);
      ro.disconnect();
    };
  }, [listRef, on]);
}

/** The sideways twin of useEdgeFade: a soft fade on the cut end(s) of a row that scrolls sideways, only where there is more. */
export function useEdgeFadeX(ref: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => {
      const l = el.scrollLeft > 1 ? 24 : 0;
      const r = el.scrollLeft + el.clientWidth < el.scrollWidth - 1 ? 32 : 0;
      const mask = l || r ? `linear-gradient(to right, transparent 0, #000 ${l}px, #000 calc(100% - ${r}px), transparent 100%)` : "";
      el.style.maskImage = mask;
      el.style.webkitMaskImage = mask;
    };
    set();
    el.addEventListener("scroll", set, { passive: true });
    const ro = new ResizeObserver(set);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => (el.removeEventListener("scroll", set), ro.disconnect());
  }, [ref]);
}

/** The page's width without the vertical scrollbar (innerWidth and 100vw count it, so a classic bar ate the margin). */
function useViewportWidth() {
  const [vw, setVw] = React.useState(() => (typeof document === "undefined" ? 1440 : document.documentElement.clientWidth));
  React.useEffect(() => {
    const root = document.documentElement;
    const on = () => setVw(root.clientWidth);
    const ro = new ResizeObserver(on);
    ro.observe(root);
    window.addEventListener("resize", on);
    return () => (ro.disconnect(), window.removeEventListener("resize", on));
  }, []);
  return vw;
}

/**
 * A slim tab on the left edge. Hover opens the panel, which pushes the whole page (header included) right by
 * its width. The page wrapper only translates while it moves: its final width is set once, at the start, and a
 * transform carries it from where it was (FLIP), so nothing reflows frame by frame.
 * Mouse: opens on hover, closes on leave after a short grace (not while a slider is held, not while the pointer
 * is in a popover opened from the panel). Tap, click or keyboard focus: toggles and stays until Esc, X, a tap
 * outside, or focus leaving.
 */
function CustomizeFlap({ pageRef }: { pageRef: React.RefObject<HTMLDivElement | null> }) {
  const [config, setConfig] = useLiveConfig();
  const vw = useViewportWidth();
  const enabled = vw >= FLAP_MIN;
  const W = panelWidth(vw);
  const push = vw - W >= PAGE_MIN;
  const [open, setOpenState] = React.useState(false);
  const mode = React.useRef<"hover" | "pinned">("hover");
  const pressed = React.useRef(false);
  const enterT = React.useRef<number>(undefined);
  const leaveT = React.useRef<number>(undefined);
  const flapRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  useOwnScroll(panelRef, listRef, enabled);
  useEdgeFade(listRef, enabled);
  const openRef = React.useRef(open);
  openRef.current = open;
  const widthRef = React.useRef(W);
  widthRef.current = W;

  const clear = () => (window.clearTimeout(enterT.current), window.clearTimeout(leaveT.current), (leaveT.current = undefined));
  const show = React.useCallback((m: "hover" | "pinned") => {
    window.clearTimeout(enterT.current);
    window.clearTimeout(leaveT.current);
    leaveT.current = undefined;
    mode.current = m;
    setOpenState(true);
  }, []);
  const hide = React.useCallback(() => {
    window.clearTimeout(enterT.current);
    window.clearTimeout(leaveT.current);
    leaveT.current = undefined;
    setOpenState(false);
  }, []);
  const closeSoon = React.useCallback(() => {
    if (!openRef.current || mode.current !== "hover" || pressed.current || leaveT.current !== undefined) return;
    leaveT.current = window.setTimeout(() => {
      leaveT.current = undefined;
      if (!pressed.current) setOpenState(false);
    }, 260);
  }, []);

  React.useEffect(() => {
    if (!enabled) hide();
  }, [enabled, hide]);

  // Mouse anywhere: over the flap, the panel or one of its popovers keeps it; elsewhere starts the grace timer.
  React.useEffect(() => {
    const over = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !openRef.current) return;
      // Mid-slide the panel isn't under the pointer yet: the strip it is sliding into already counts as inside, or a
      // slow frame closes the flap the pointer just opened.
      if (inside(e.target, panelRef.current, flapRef.current) || e.clientX < widthRef.current) {
        window.clearTimeout(leaveT.current);
        leaveT.current = undefined;
      } else closeSoon();
    };
    const out = (e: PointerEvent) => {
      // Leaving the window entirely.
      if (e.pointerType === "mouse" && !e.relatedTarget && openRef.current) closeSoon();
    };
    const down = (e: PointerEvent) => {
      if (inside(e.target, panelRef.current)) pressed.current = true;
      else if (openRef.current && mode.current === "pinned" && !inside(e.target, flapRef.current)) hide();
    };
    const up = (e: PointerEvent) => {
      if (!pressed.current) return;
      pressed.current = false;
      const at = document.elementFromPoint(e.clientX, e.clientY);
      if (e.pointerType === "mouse" && !inside(at, panelRef.current, flapRef.current)) closeSoon();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !openRef.current) return;
      // A popover or menu inside the panel closes first.
      if (document.querySelector("[data-radix-popper-content-wrapper]")) return;
      const had = panelRef.current?.contains(document.activeElement);
      hide();
      if (had) flapRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerout", out);
    document.addEventListener("pointerdown", down, true);
    window.addEventListener("pointerup", up, true);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerout", out);
      document.removeEventListener("pointerdown", down, true);
      window.removeEventListener("pointerup", up, true);
      document.removeEventListener("keydown", key);
    };
  }, [closeSoon, hide]);
  React.useEffect(() => clear, []);

  // Push the page: set the final margin once, then slide from where it was.
  const wasOpen = React.useRef(false);
  React.useLayoutEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const target = open && push ? `${W}px` : "";
    const toggled = wasOpen.current !== open;
    wasOpen.current = open;
    if (el.style.marginLeft === target) return;
    const probe = el.querySelector<HTMLElement>("header > div");
    const x0 = probe?.getBoundingClientRect().left ?? 0;
    el.getAnimations().forEach((a) => a.cancel());
    el.style.marginLeft = target;
    const x1 = probe?.getBoundingClientRect().left ?? 0;
    const still = prefersReducedMotion();
    if (toggled && !still && Math.abs(x0 - x1) > 0.5) el.animate([{ transform: `translateX(${x0 - x1}px)` }, { transform: "translateX(0)" }], { duration: SLIDE_MS, easing: EASE });
  }, [open, push, W, pageRef]);

  if (!enabled) return null;
  return (
    <>
      <button
        ref={flapRef}
        type="button"
        aria-label="Customize"
        aria-expanded={open}
        aria-controls="customize-panel"
        data-customize-flap
        onPointerEnter={(e) => {
          if (e.pointerType !== "mouse" || openRef.current) return;
          window.clearTimeout(enterT.current);
          enterT.current = window.setTimeout(() => show("hover"), 80);
        }}
        onPointerLeave={() => window.clearTimeout(enterT.current)}
        onClick={(e) => {
          if (openRef.current && mode.current === "pinned") return hide();
          show("pinned");
          // From the keyboard (Enter/Space), focus moves into the panel once it is no longer inert.
          if (e.detail === 0) requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("button,[href],input,[role=slider],[role=radio],[tabindex='0']")?.focus({ preventScroll: true }));
        }}
        className={cn(
          // The hit area runs from the screen edge to past the flap (::after), so a pointer thrown to x = 0 still lands on it.
          "fixed left-1 top-1/2 z-40 flex w-5 -translate-y-1/2 cursor-pointer flex-col items-center gap-2 rounded-full bg-surface py-3 text-ink-muted shadow-card",
          "after:absolute after:inset-y-0 after:-left-1 after:w-8 after:content-['']",
          "transition-[opacity,color,background-color] duration-[220ms] ease-ad hover:bg-fill-strong hover:text-ink focus-visible:bg-fill-strong focus-visible:text-ink",
          open && "pointer-events-none opacity-0",
        )}
      >
        <Sliders size={16} className="rotate-90" />
        <span className="text-small font-medium [writing-mode:vertical-rl] rotate-180">Customize</span>
      </button>
      <div
        ref={panelRef}
        id="customize-panel"
        role="dialog"
        aria-label="Customize"
        aria-modal={false}
        inert={!open}
        data-customize-panel
        data-state={open ? "open" : "closed"}
        onBlur={(e) => {
          if (mode.current === "pinned" && e.relatedTarget && !inside(e.relatedTarget, panelRef.current, flapRef.current)) hide();
        }}
        className="fixed inset-y-0 left-0 z-50 p-3 pr-0"
        style={{ width: W, transform: open ? "translateX(0)" : "translateX(calc(-100% - 64px))", transition: `transform ${SLIDE_MS}ms ${EASE}` }}
      >
        <div
          className="flex h-full flex-col bg-surface text-ink shadow-dialog"
          style={{ borderRadius: "calc(var(--ad-radius-sheet) + min(var(--ad-radius-sheet), var(--ad-nest) * 2))" }}
        >
          <div className="flex min-h-control shrink-0 items-center justify-between gap-2 px-pad pt-3 pb-2">
            <h2 className="text-title font-semibold">Customize</h2>
            <div className="-mr-1 flex items-center gap-1">
              <Tooltip content="Reset">
                <Button variant="ghost" icon aria-label="Reset" onClick={() => setConfig(resetPatch(ALL_FIELDS))}>
                  <RotateCcw />
                </Button>
              </Tooltip>
              <Button variant="ghost" icon aria-label="Close" onClick={hide}>
                <X />
              </Button>
            </div>
          </div>
          <div
            ref={listRef}
            data-customize-scroll
            className="ad-fade-y min-h-0 flex-1 overflow-y-auto overscroll-contain px-[calc(var(--ad-nest)*2)] pb-[calc(var(--ad-nest)*2)]"
          >
            <div>
              <ConfigGroups value={config} onChange={setConfig} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const PAGE_NAMES: Record<string, string> = {
  components: "Components",
  mobile: "Mobile components",
  ai: "AI",
  backgrounds: "Backgrounds",
  examples: "Examples",
  encyclopedia: "Encyclopedia",
  export: "Export",
};

/** The tab title: the page's own name, then the site's ("Button · Alora Design"); the landing is the site's name alone. */
function pageTitle(pathname: string) {
  const [first, second] = pathname.split("/").filter(Boolean);
  if (!first) return "Alora Design";
  let name: string | undefined;
  if (first === "examples") name = second ? second[0].toUpperCase() + second.slice(1) : "Examples";
  else if (first === "mobile" && second === "screens") name = "Mobile screens";
  else if (second && PAGE_NAMES[first]) name = findItem(second)?.title;
  else name = PAGE_NAMES[first];
  return `${name ?? "Not found"} · Alora Design`;
}

export function SiteLayout() {
  const pageRef = React.useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  React.useEffect(() => {
    document.title = pageTitle(pathname);
  }, [pathname]);
  return (
    <TooltipProvider>
      <ConfigTokens />
      <ScrollRestoration />
      {/* A size container, so the page measures against its own width (100cqw), never 100vw with the scrollbar in it. */}
      <div className="overflow-x-clip [container-type:inline-size]">
        <div ref={pageRef} data-page className="flex min-h-dvh flex-col md:pl-[clamp(0px,calc(12px-(100cqw-1280px)/2),12px)]">
          <SiteHeader />
          <div id="content" tabIndex={-1} className="flex-1 scroll-mt-16 outline-none">
            <Outlet />
          </div>
          <SiteFooter />
        </div>
      </div>
      {/* After the page in the DOM (it is fixed, so it doesn't move): the keyboard reaches it last, not first. */}
      <CustomizeFlap pageRef={pageRef} />
      <Toaster />
    </TooltipProvider>
  );
}
