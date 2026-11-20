import * as React from "react";
import { Slider as S } from "radix-ui";
import { cn } from "@/lib/ad";

export interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  /** Shown on the right, e.g. "12 px". */
  display?: React.ReactNode;
  className?: string;
}

/** Labelled slider: the label and value on one line, the track under them. */
export function Slider({ value, onValueChange, min, max, step = 1, label, display, className }: SliderProps) {
  const id = React.useId();
  const thumb = React.useRef<HTMLSpanElement>(null);
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-center justify-between gap-3 text-body">
        {/* Not a native label (the thumb is a span), so a click on it focuses the thumb by hand. */}
        <label id={id} className="cursor-default text-ink-muted" onClick={() => thumb.current?.focus()}>
          {label}
        </label>
        <span className="tabular-nums text-ink">{display ?? value}</span>
      </div>
      <S.Root
        aria-labelledby={id}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onValueChange(v)}
        className="group relative flex h-[24px] cursor-pointer touch-none select-none items-center"
      >
        <S.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-fill-strong">
          <S.Range className="absolute h-full rounded-full bg-on" />
        </S.Track>
        <S.Thumb
          ref={thumb}
          aria-label={label}
          // 16 px thumb; a transparent 4 px ::after pad makes it a 24 px target. Hover anywhere on the slider and keyboard
          // focus take the same step (ink-muted).
          className="relative block size-[16px] rounded-full bg-thumb shadow-thumb transition-[transform,scale,background-color] duration-[150ms] ease-ad after:absolute after:-inset-[4px] after:rounded-full group-hover:bg-ink-muted focus-visible:bg-ink-muted active:scale-[0.97]"
        />
      </S.Root>
    </div>
  );
}
