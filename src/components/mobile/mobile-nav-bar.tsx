import * as React from "react";
import { ChevronLeft } from "react-feather";
import { cn } from "@/lib/ad";

const SAFE_TOP = "var(--ad-safe-top, env(safe-area-inset-top, 0px))";
const SAFE_BOTTOM = "var(--ad-safe-bottom, env(safe-area-inset-bottom, 0px))";

export interface MobileScreenProps {
  title: string;
  /** A large title under the bar that shrinks into it as you scroll. Off: the small title only (detail screens). */
  large?: boolean;
  /** Back to the previous screen: a chevron and the previous screen's name. */
  back?: { label: string; onClick: () => void };
  /** Up to two icon buttons on the right (MobileBarButton). */
  trailing?: React.ReactNode;
  /** Under the large title and scrolling with it: a search bar, a segmented control. */
  header?: React.ReactNode;
  /** Room at the bottom so the last row clears what floats there. */
  bottomInset?: "tab-bar" | "action-bar" | "none";
  children: React.ReactNode;
  className?: string;
  /** The scroll area, for scrolling to top or restoring a position. */
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * One phone screen: its own scroll area with a nav bar on top. With `large`, the title starts big under the bar; as it
 * scrolls under the bar the bar's small title fades in and the bar takes the page colour, so the content never shows
 * through behind the title. Clears the status bar (safe area) at the top and the tab or action bar at the bottom.
 */
export function MobileScreen({ title, large = true, back, trailing, header, bottomInset = "tab-bar", children, className, ref: outer }: MobileScreenProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const big = React.useRef<HTMLHeadingElement>(null);
  React.useImperativeHandle(outer, () => ref.current!);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = big.current?.offsetHeight ?? 0;
      const y = el.scrollTop;
      // 0 → 1 while the large title passes under the bar; the bar's own title and fill follow it.
      const t = large ? Math.min(1, Math.max(0, (y - h * 0.45) / (h * 0.45))) : 1;
      el.style.setProperty("--ad-collapse", String(t));
    };
    const onScroll = () => (raf ||= requestAnimationFrame(update));
    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => (el.removeEventListener("scroll", onScroll), cancelAnimationFrame(raf));
  }, [large]);
  const pad = bottomInset === "tab-bar" ? `calc(${SAFE_BOTTOM} + 96px)` : bottomInset === "action-bar" ? `calc(${SAFE_BOTTOM} + 88px)` : SAFE_BOTTOM;
  return (
    <div ref={ref} data-mobile-screen className={cn("relative h-full overflow-y-auto overscroll-contain bg-page text-ink [scrollbar-width:none]", className)}>
      <header className="sticky top-0 z-20" style={{ paddingTop: SAFE_TOP }}>
        <div aria-hidden className="absolute inset-0 bg-page" style={{ opacity: large ? "var(--ad-collapse, 0)" : 1 }} />
        <div className="relative grid h-11 grid-cols-[1fr_auto_1fr] items-center px-1.5">
          <div className="flex min-w-0 justify-start">
            {back ? (
              <button
                type="button"
                onClick={back.onClick}
                className="flex h-touch min-w-touch cursor-pointer items-center gap-0.5 rounded-control pr-2 text-[15px] text-ink transition-transform duration-[150ms] ease-ad active:scale-[0.97] [-webkit-tap-highlight-color:transparent]"
              >
                <ChevronLeft size={24} strokeWidth={1.75} />
                <span className="truncate">{back.label}</span>
              </button>
            ) : null}
          </div>
          <span
            className="max-w-[56vw] truncate text-[17px] font-semibold"
            style={large ? { opacity: "var(--ad-collapse, 0)", transform: "translateY(calc((1 - var(--ad-collapse, 0)) * 4px))" } : undefined}
          >
            {title}
          </span>
          <div className="flex min-w-0 justify-end">{trailing}</div>
        </div>
      </header>
      {large ? (
        <h1 ref={big} className="px-pad pb-2 text-[30px] font-semibold leading-[1.15]">
          {title}
        </h1>
      ) : null}
      {header ? <div className="grid gap-3 px-pad pb-3">{header}</div> : null}
      <div style={{ paddingBottom: pad }}>{children}</div>
    </div>
  );
}

/** A 44 px icon button for the nav bar. Give it an aria-label. */
export function MobileBarButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "grid size-touch shrink-0 cursor-pointer place-items-center rounded-control text-ink transition-transform duration-[150ms] ease-ad active:scale-[0.92] [-webkit-tap-highlight-color:transparent] [&_svg]:size-[22px] [&_svg]:stroke-[1.75]",
        className,
      )}
      {...props}
    />
  );
}
