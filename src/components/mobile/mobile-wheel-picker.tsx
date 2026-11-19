import * as React from "react";
import { cn, MONTHS } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { MobileSheet } from "./mobile-sheet";

const ROW = 44;
const VISIBLE = 5;

export interface WheelColumnProps {
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  "aria-label": string;
  className?: string;
}

/**
 * One wheel: flick it and it glides and snaps to a row (native scroll snap, so the throw keeps the finger's speed).
 * Rows fade and tilt away from the centre band. Tap a row to bring it to the centre; arrow keys step one row.
 */
export function WheelColumn({ options, value, onValueChange, className, ...aria }: WheelColumnProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const drag = React.useRef<{ y: number; top: number } | null>(null);
  const settleTimer = React.useRef(0);
  const paint = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const mid = el.scrollTop / ROW;
    el.querySelectorAll<HTMLElement>("[data-row]").forEach((r, i) => {
      const d = Math.max(-2.6, Math.min(2.6, i - mid));
      r.style.opacity = String(1 - Math.abs(d) * 0.28);
      r.style.transform = `perspective(400px) rotateX(${-d * 16}deg) scale(${1 - Math.abs(d) * 0.04})`;
    });
  }, []);
  // Keep the wheel on the value (first paint and outside changes) without animating.
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || drag.current) return;
    if (Math.round(el.scrollTop / ROW) !== index) el.scrollTop = index * ROW;
    paint();
  }, [index, options.length, paint]);
  const commit = () => {
    const el = ref.current;
    if (!el) return;
    const i = Math.max(0, Math.min(options.length - 1, Math.round(el.scrollTop / ROW)));
    if (options[i] && options[i].value !== value) onValueChange(options[i].value);
  };
  const go = (i: number) => ref.current?.scrollTo({ top: i * ROW, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  return (
    <div className={cn("relative min-w-0 flex-1", className)} style={{ height: ROW * VISIBLE }}>
      <div
        ref={ref}
        role="listbox"
        tabIndex={0}
        aria-label={aria["aria-label"]}
        aria-activedescendant={undefined}
        onScroll={() => {
          paint();
          window.clearTimeout(settleTimer.current);
          settleTimer.current = window.setTimeout(commit, 120);
        }}
        onKeyDown={(e) => {
          const step = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
          if (!step) return;
          e.preventDefault();
          const i = Math.max(0, Math.min(options.length - 1, index + step));
          if (ref.current) ref.current.scrollTop = i * ROW;
          onValueChange(options[i].value);
        }}
        // Mouse: drag the wheel like a finger would (touch and trackpads scroll natively).
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || !ref.current) return;
          drag.current = { y: e.clientY, top: ref.current.scrollTop };
          ref.current.style.scrollSnapType = "none";
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current && ref.current) ref.current.scrollTop = drag.current.top - (e.clientY - drag.current.y);
        }}
        onPointerUp={() => {
          if (!drag.current || !ref.current) return;
          drag.current = null;
          ref.current.style.scrollSnapType = "";
          go(Math.round(ref.current.scrollTop / ROW));
        }}
        className="relative z-10 h-full snap-y snap-mandatory overflow-y-auto overscroll-contain outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingBlock: ROW * 2 }}
      >
        {options.map((o, i) => (
          <div
            key={o.value}
            data-row
            role="option"
            aria-selected={i === index}
            onClick={() => go(i)}
            className={cn("grid cursor-pointer snap-center select-none place-items-center text-[20px] tabular-nums will-change-transform", i === index ? "text-ink" : "text-ink-muted")}
            style={{ height: ROW }}
          >
            {o.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Wheels side by side over one centre band (the band spans every column, concentric with the sheet). */
export function WheelPicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative flex gap-1", className)}>
      <div aria-hidden className="absolute inset-x-0 rounded-control bg-fill" style={{ top: ROW * 2, height: ROW }} />
      {children}
      {/* Rows fade into the surface at the top and bottom. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-linear-to-b from-surface to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-linear-to-t from-surface to-transparent" />
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");
const daysIn = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

export interface MobileDateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  value: Date;
  onValueChange: (value: Date) => void;
  /** date: day, month, year. time: hour and minute (5-minute steps). */
  mode?: "date" | "time";
  years?: [number, number];
}

/**
 * A date or time on a phone: wheels in a bottom sheet, the month written out (7 Nov 2026), Done to keep it. The wheels
 * hold a draft, so closing without Done changes nothing.
 */
export function MobileDateSheet({ open, onOpenChange, title, value, onValueChange, mode = "date", years = [2024, 2028] }: MobileDateSheetProps) {
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);
  const y = draft.getFullYear();
  const m = draft.getMonth();
  const set = (patch: Partial<{ y: number; m: number; d: number; h: number; min: number }>) => {
    const ny = patch.y ?? y;
    const nm = patch.m ?? m;
    const nd = Math.min(patch.d ?? draft.getDate(), daysIn(ny, nm));
    setDraft(new Date(ny, nm, nd, patch.h ?? draft.getHours(), patch.min ?? draft.getMinutes()));
  };
  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      footer={
        <Button variant="primary" onClick={() => (onValueChange(draft), onOpenChange(false))}>
          Done
        </Button>
      }
    >
      <WheelPicker>
        {mode === "date" ? (
          <>
            <WheelColumn aria-label="Day" value={String(draft.getDate())} onValueChange={(v) => set({ d: +v })} options={Array.from({ length: daysIn(y, m) }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))} />
            <WheelColumn aria-label="Month" value={String(m)} onValueChange={(v) => set({ m: +v })} options={MONTHS.map((l, i) => ({ value: String(i), label: l }))} />
            <WheelColumn aria-label="Year" value={String(y)} onValueChange={(v) => set({ y: +v })} options={Array.from({ length: years[1] - years[0] + 1 }, (_, i) => ({ value: String(years[0] + i), label: String(years[0] + i) }))} />
          </>
        ) : (
          <>
            <WheelColumn aria-label="Hour" value={String(draft.getHours())} onValueChange={(v) => set({ h: +v })} options={Array.from({ length: 24 }, (_, i) => ({ value: String(i), label: pad(i) }))} />
            <WheelColumn aria-label="Minute" value={String(draft.getMinutes() - (draft.getMinutes() % 5))} onValueChange={(v) => set({ min: +v })} options={Array.from({ length: 12 }, (_, i) => ({ value: String(i * 5), label: pad(i * 5) }))} />
          </>
        )}
      </WheelPicker>
    </MobileSheet>
  );
}
