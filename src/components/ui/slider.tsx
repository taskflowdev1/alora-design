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
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-center justify-between gap-3 text-body">
        <label id={id} className="text-ink-muted">
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
        className="relative flex h-5 cursor-pointer touch-none select-none items-center"
      >
        <S.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-fill-strong">
          <S.Range className="absolute h-full rounded-full bg-on" />
        </S.Track>
        <S.Thumb
          aria-label={label}
          className="block size-4 rounded-full bg-thumb shadow-thumb focus-visible:bg-ink-muted transition-transform duration-[150ms] ease-ad active:scale-[0.97]"
        />
      </S.Root>
    </div>
  );
}
