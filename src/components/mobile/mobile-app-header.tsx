import * as React from "react";
import { ChevronDown, ChevronLeft } from "react-feather";
import { cn, SAFE_TOP } from "@/lib/ad";
import { useStandalone } from "@/lib/ad-hooks";

export interface MobileAppHeaderProps {
  /** The current shop or workspace. The header is its picker. */
  title: string;
  onPick?: () => void;
  /** Back to the previous screen. Shown only in the home screen app, where the browser has no back button of its own. */
  back?: () => void;
  /** Overrides detection (previews). */
  standalone?: boolean;
  /** Right side: a sync pill, one or two bar buttons. */
  trailing?: React.ReactNode;
  className?: string;
}

/** The header of an installed app: clears the notch, the shop picker is the title, and it brings its own back button. */
export function MobileAppHeader({ title, onPick, back, standalone: forced, trailing, className }: MobileAppHeaderProps) {
  const detected = useStandalone();
  const standalone = forced ?? detected;
  return (
    <header className={cn("sticky top-0 z-20 shrink-0 bg-page", className)} style={{ paddingTop: SAFE_TOP }}>
      <div className="flex h-touch items-center gap-1 px-1.5">
        {standalone && back ? (
          <button type="button" onClick={back} aria-label="Back" className="grid size-touch shrink-0 cursor-pointer place-items-center rounded-control text-ink ad-press focus-visible:bg-fill active:scale-[0.92] data-pressed:scale-[0.92]">
            <ChevronLeft size={24} strokeWidth={1.75} />
          </button>
        ) : null}
        <button type="button" onClick={onPick} className="flex h-touch min-w-0 cursor-pointer items-center gap-1 rounded-control px-2 text-[20px] font-semibold text-ink ad-press focus-visible:bg-fill active:scale-[0.98] data-pressed:scale-[0.98] [@media(hover:hover)]:hover:bg-fill">
          <span className="truncate">{title}</span>
          <ChevronDown size={18} strokeWidth={2} className="shrink-0 text-ink-muted" />
        </button>
        <span className="flex-1" />
        {trailing}
      </div>
    </header>
  );
}
