import * as React from "react";
import { ScrollArea as SA } from "radix-ui";
import { cn } from "@/lib/ad";

/** Fades the cut edges (16 px), only on a side with more to scroll to, so a row cut at the edge reads as "more". */
function useEdgeFade(ref: React.RefObject<HTMLElement | null>, axis: "x" | "y" | "both" = "y") {
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const ys = axis !== "x" ? [el.scrollTop > 1, el.scrollTop + el.clientHeight < el.scrollHeight - 1] : [false, false];
      const xs = axis !== "y" ? [el.scrollLeft > 1, el.scrollLeft + el.clientWidth < el.scrollWidth - 1] : [false, false];
      const maskOf = (dir: string, [a, b]: boolean[]) => `linear-gradient(${dir}, ${a ? "transparent" : "#000"}, #000 16px, #000 calc(100% - 16px), ${b ? "transparent" : "#000"})`;
      const mask = [ys.some(Boolean) && maskOf("to bottom", ys), xs.some(Boolean) && maskOf("to right", xs)].filter(Boolean).join(", ");
      el.style.maskImage = mask;
      el.style.maskComposite = mask.includes("), linear") ? "intersect" : "";
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => (el.removeEventListener("scroll", measure), ro.disconnect());
  }, [ref, axis]);
}

/**
 * A scroll box with the one scrollbar style (thin, soft thumb, no track) on every platform, vertical and sideways.
 * Wheel inside it never scrolls the page past its end (overscroll contained). An edge with more beyond it fades out.
 */
export function ScrollArea({ className, children, orientation = "vertical", ...props }: React.ComponentProps<typeof SA.Root> & { orientation?: "vertical" | "horizontal" | "both" }) {
  const viewport = React.useRef<HTMLDivElement>(null);
  useEdgeFade(viewport, orientation === "both" ? "both" : orientation === "horizontal" ? "x" : "y");
  const bar = (o: "vertical" | "horizontal") => (
    <SA.Scrollbar
      orientation={o}
      className={cn("flex touch-none select-none p-0.5 transition-opacity duration-[160ms]", o === "vertical" ? "h-full w-2" : "h-2 flex-col")}
    >
      <SA.Thumb className="relative flex-1 rounded-full bg-scroll" />
    </SA.Scrollbar>
  );
  return (
    <SA.Root type="hover" className={cn("relative overflow-hidden", className)} {...props}>
      <SA.Viewport ref={viewport} className="size-full overscroll-contain rounded-[inherit]">{children}</SA.Viewport>
      {orientation !== "horizontal" ? bar("vertical") : null}
      {orientation !== "vertical" ? bar("horizontal") : null}
      <SA.Corner />
    </SA.Root>
  );
}
