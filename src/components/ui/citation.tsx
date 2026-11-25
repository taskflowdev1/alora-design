import * as React from "react";
import { Popover as P } from "radix-ui";
import { ExternalLink } from "react-feather";
import { cn } from "@/lib/ad";
import { usePopupOpen } from "@/lib/ad-hooks";

export interface CitationSource {
  title: React.ReactNode;
  /** Where it comes from: "Stock ledger · Dago", "Shopee payout report". */
  meta?: React.ReactNode;
  /** The passage the claim rests on. */
  quote?: React.ReactNode;
  href?: string;
}

export interface CitationProps {
  n: number;
  source: CitationSource;
  className?: string;
}

/**
 * A claim's source as a small number after it. Tapping (or hovering, after a short wait) opens a card that grows out of
 * that number, not from the middle of the screen, with the source's name, where it lives and the passage used. The card
 * opens below the number (above only when there is no room), so it never covers the sentence it backs; it is white in
 * light and darker than the page in dark. Keep the number on its word's line: StreamingText does it for you, or wrap
 * the last word, the number and its punctuation in `whitespace-nowrap`.
 */
export function Citation({ n, source, className }: CitationProps) {
  const [open, setOpen] = usePopupOpen();
  const via = React.useRef<"hover" | "pin" | null>(null);
  const t = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(t.current), []);
  const later = (o: boolean, ms: number) => {
    window.clearTimeout(t.current);
    t.current = window.setTimeout(() => {
      if (o && via.current === null) {
        via.current = "hover";
        setOpen(true);
      } else if (!o && via.current === "hover") {
        via.current = null;
        setOpen(false, true);
      }
    }, ms);
  };
  const hover = { onPointerEnter: (e: React.PointerEvent) => e.pointerType === "mouse" && later(true, 300), onPointerLeave: (e: React.PointerEvent) => e.pointerType === "mouse" && later(false, 160) };
  return (
    <P.Root
      open={open}
      onOpenChange={(o) => {
        window.clearTimeout(t.current);
        via.current = o ? "pin" : null;
        setOpen(o);
      }}
    >
      <P.Trigger
        {...hover}
        data-ad-anchor=""
        onClick={(e) => {
          if (via.current !== "hover") return;
          e.preventDefault();
          window.clearTimeout(t.current);
          via.current = "pin";
        }}
        aria-label={`Source ${n}`}
        className={cn(
          "relative ml-0.5 inline-grid h-4 min-w-4 cursor-pointer select-none place-items-center rounded-full bg-fill px-1 align-[0.15em] text-[0.8em] font-medium leading-none tabular-nums text-ink-muted",
          "ad-press after:absolute after:-inset-1.5 hover:bg-fill-strong hover:text-ink focus-visible:bg-fill-strong active:scale-[0.97] data-[state=open]:bg-fill-strong data-[state=open]:text-ink",
          className,
        )}
      >
        {n}
      </P.Trigger>
      <P.Portal>
        <P.Content
          {...hover}
          side="bottom"
          align="start"
          alignOffset={-12}
          sideOffset={6}
          collisionPadding={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={cn(
            "z-50 grid w-[min(320px,calc(100vw-16px))] gap-1.5 rounded-card bg-pop p-[calc(var(--ad-nest)*3)] text-ink shadow-raised",
            "origin-(--radix-popover-content-transform-origin) data-[state=open]:animate-[ad-in_200ms_var(--ad-ease)] data-[state=closed]:animate-[ad-out_150ms_var(--ad-ease)]",
          )}
        >
          <div className="flex items-start gap-2">
            <span className="grid h-4 min-w-4 shrink-0 translate-y-0.5 place-items-center rounded-full bg-fill px-1 text-[0.8em] font-medium tabular-nums text-ink-muted">{n}</span>
            <div className="grid min-w-0 flex-1">
              <span className="text-body font-medium">{source.title}</span>
              {source.meta ? <span className="text-small text-ink-muted">{source.meta}</span> : null}
            </div>
            {source.href ? (
              <a href={source.href} target="_blank" rel="noreferrer" aria-label="Open source" className="grid size-[24px] shrink-0 place-items-center rounded-item text-ink-muted transition-colors duration-[150ms] ease-ad hover:bg-fill hover:text-ink focus-visible:bg-fill focus-visible:text-ink">
                <ExternalLink size={16} />
              </a>
            ) : null}
          </div>
          {source.quote ? <p className="rounded-[max(4px,calc(var(--ad-radius-card)-var(--ad-nest)*3))] bg-fill px-2.5 py-2 text-small leading-relaxed text-ink-muted">{source.quote}</p> : null}
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}
