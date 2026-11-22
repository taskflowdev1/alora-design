// A phone that mounts its app only once it scrolls near the screen, so pages with many live phones stay light.
import * as React from "react";
import { cn } from "@/lib/ad";
import { PhoneFrame, PHONE } from "./phone";

export function LazyPhone({ children, inert, keyboard, className }: { children: React.ReactNode; inert?: boolean; keyboard?: boolean; className?: string }) {
  const box = React.useRef<HTMLDivElement>(null);
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setOn(true), io.disconnect()), { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={box} className={cn("min-w-0", className)} inert={inert || undefined}>
      {on ? (
        <PhoneFrame keyboard={keyboard}>{children}</PhoneFrame>
      ) : (
        // Same box as the phone: a frame-shaped placeholder at the width the phone will take.
        <div aria-hidden className="mx-auto w-full animate-ad-pulse bg-surface shadow-dialog [corner-shape:superellipse(1.6)]" style={{ maxWidth: PHONE.w, aspectRatio: `${PHONE.w} / ${PHONE.h}`, borderRadius: 40 }} />
      )}
    </div>
  );
}
