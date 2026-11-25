import * as React from "react";
import { ChevronLeft } from "react-feather";
import { cn, SAFE_BOTTOM, SAFE_TOP } from "@/lib/ad";
import { useDoubleTapGuard } from "@/lib/ad-hooks";

export interface MobileScreenProps {
  title: string;
  /** The bar's small title when it differs from the large one (the list's current filter once the title has scrolled). */
  barTitle?: string;
  /** A large title under the bar that shrinks into it as you scroll. Off: the small title only (detail screens). */
  large?: boolean;
  /** Back to the previous screen: a chevron and the previous screen's name. A double tap goes back once. */
  back?: { label: string; onClick: () => void };
  /** Instead of back, on a screen that ends a flow: one text button on the left ("Done"). */
  leading?: React.ReactNode;
  /** Up to two icon buttons on the right (MobileBarButton). */
  trailing?: React.ReactNode;
  /** Under the large title and scrolling with it: a search bar, a segmented control. */
  header?: React.ReactNode;
  /** Room at the bottom so the last row clears what floats there ("tab-bar-fab": a floating button above the tab bar). */
  bottomInset?: "tab-bar" | "tab-bar-fab" | "action-bar" | "none";
  children: React.ReactNode;
  className?: string;
  /** The scroll area, for scrolling to top or restoring a position. */
  ref?: React.Ref<HTMLDivElement>;
  /** false when the title is a code or name a browser must not translate (an order id, a SKU). */
  translateTitle?: boolean;
}

/**
 * One phone screen: its own scroll area with a nav bar on top. With `large`, the title starts big under the bar; as it
 * scrolls under the bar the bar's small title fades in and the bar takes the page colour, so the content never shows
 * through behind the title. Clears the status bar (safe area) at the top and the tab or action bar at the bottom.
 */
export function MobileScreen({ title, barTitle, large = true, back, leading, trailing, header, bottomInset = "tab-bar", children, className, ref: outer, translateTitle = true }: MobileScreenProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const big = React.useRef<HTMLHeadingElement>(null);
  const head = React.useRef<HTMLDivElement>(null);
  const body = React.useRef<HTMLDivElement>(null);
  const spacer = React.useRef<HTMLDivElement>(null);
  const goBack = useDoubleTapGuard(back?.onClick);
  const tr = translateTitle ? undefined : "no";
  React.useImperativeHandle(outer, () => ref.current!);
  React.useLayoutEffect(() => {
    const el = ref.current;
    const gap = spacer.current;
    if (!el || !gap || !large) return;
    const fit = () => {
      const extra = gap.offsetHeight;
      const max = el.scrollHeight - el.clientHeight - extra;
      const need = (big.current?.offsetHeight ?? 0) + (head.current?.offsetHeight ?? 0);
      gap.style.height = max > 0 && max < need ? `${need - max}px` : "0px";
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    if (body.current) ro.observe(body.current);
    return () => ro.disconnect();
  }, [large, header]);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = big.current?.offsetHeight ?? 0;
      const y = el.scrollTop;
      const t = large ? Math.min(1, Math.max(0, (y - h * 0.45) / (h * 0.45))) : 1;
      el.style.setProperty("--ad-collapse", String(t));
    };
    const onScroll = () => (raf ||= requestAnimationFrame(update));
    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => (el.removeEventListener("scroll", onScroll), cancelAnimationFrame(raf));
  }, [large]);
  const pad =
    bottomInset === "tab-bar"
      ? `calc(${SAFE_BOTTOM} + 96px)`
      : bottomInset === "tab-bar-fab"
        ? `calc(${SAFE_BOTTOM} + 156px)`
        : bottomInset === "action-bar"
          ? `calc(${SAFE_BOTTOM} + 88px)`
          : SAFE_BOTTOM;
  return (
    <div ref={ref} data-mobile-screen className={cn("relative flex h-full flex-col overflow-y-auto overscroll-contain bg-page text-ink [scrollbar-width:none]", className)}>
      <header className="sticky top-0 z-20 shrink-0" style={{ paddingTop: SAFE_TOP }}>
        <div aria-hidden className="absolute inset-0 bg-page" style={{ opacity: large ? "var(--ad-collapse, 0)" : 1 }} />
        <div className="relative grid h-touch grid-cols-[minmax(88px,1fr)_auto_minmax(88px,1fr)] items-center px-1.5">
          <div className="flex min-w-0 justify-start">
            {leading ?? (back ? (
              <button
                type="button"
                onClick={goBack}
                className="flex h-touch min-w-touch max-w-full cursor-pointer items-center gap-0.5 rounded-control pr-2 text-[15px] text-ink ad-press focus-visible:bg-fill active:scale-[0.97] data-pressed:scale-[0.97]"
              >
                <ChevronLeft size={24} strokeWidth={1.75} className="shrink-0" />
                <span className="truncate">{back.label}</span>
              </button>
            ) : null)}
          </div>
          <span
            translate={tr}
            className="min-w-0 max-w-full truncate text-center text-[17px] font-semibold"
            style={large ? { opacity: "var(--ad-collapse, 0)", transform: "translateY(calc((1 - var(--ad-collapse, 0)) * 4px))" } : undefined}
          >
            {barTitle ?? title}
          </span>
          <div className="flex min-w-0 justify-end">{trailing}</div>
        </div>
      </header>
      {large ? (
        <h1 ref={big} translate={tr} className="shrink-0 text-balance px-pad pb-2 text-[30px] font-semibold leading-[1.15]">
          {title}
        </h1>
      ) : null}
      {header ? (
        <div ref={head} className="grid shrink-0 gap-3 px-pad pb-3">
          {header}
        </div>
      ) : null}
      <div ref={body} className="flex grow flex-col" style={{ paddingBottom: pad }}>
        {children}
      </div>
      {large ? <div ref={spacer} aria-hidden className="shrink-0" /> : null}
    </div>
  );
}

/** A short text button for the nav bar ("Clear all", "Done"): 44 px tall, medium weight, a fill on keyboard focus. */
export function MobileBarTextButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "h-touch shrink-0 cursor-pointer truncate rounded-control px-2.5 text-[15px] font-medium text-ink ad-press focus-visible:bg-fill active:scale-[0.97] data-pressed:scale-[0.97]",
        className,
      )}
      {...props}
    />
  );
}

/** A 44 px icon button for the nav bar. Give it an aria-label. */
export function MobileBarButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "grid size-touch shrink-0 cursor-pointer place-items-center rounded-control text-ink ad-press focus-visible:bg-fill active:scale-[0.92] data-pressed:scale-[0.92] [&_svg]:size-[22px] [&_svg]:stroke-[1.75]",
        className,
      )}
      {...props}
    />
  );
}
