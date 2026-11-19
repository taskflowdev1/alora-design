import * as React from "react";
import { Popover as P } from "radix-ui";
import { ExternalLink } from "react-feather";
import { cn } from "@/lib/ad";

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
 * that number, not from the middle of the screen, with the source's name, where it lives and the passage used.
 */
export function Citation({ n, source, className }: CitationProps) {
  const [open, setOpen] = React.useState(false);
  const t = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(t.current), []);
  const later = (o: boolean, ms: number) => {
    window.clearTimeout(t.current);
    t.current = window.setTimeout(() => setOpen(o), ms);
  };
  const hover = { onPointerEnter: (e: React.PointerEvent) => e.pointerType === "mouse" && later(true, 300), onPointerLeave: (e: React.PointerEvent) => e.pointerType === "mouse" && later(false, 160) };
  return (
    <P.Root open={open} onOpenChange={setOpen}>
      <P.Trigger
        {...hover}
        aria-label={`Source ${n}`}
        className={cn(
          // Sits on the text's x-height without opening the line spacing; the hit area is bigger than it looks.
          "relative ml-0.5 inline-grid h-4 min-w-4 cursor-pointer select-none place-items-center rounded-full bg-fill px-1 align-[0.15em] text-[0.72em] font-medium leading-none tabular-nums text-ink-muted",
          "transition-[background-color,color,transform] duration-[150ms] ease-ad after:absolute after:-inset-1.5 hover:bg-fill-strong hover:text-ink focus-visible:bg-fill-strong active:scale-[0.97] data-[state=open]:bg-fill-strong data-[state=open]:text-ink",
          className,
        )}
      >
        {n}
      </P.Trigger>
      <P.Portal>
        <P.Content
          {...hover}
          side="top"
          align="center"
          sideOffset={6}
          collisionPadding={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={cn(
            "z-50 grid w-[min(320px,calc(100vw-16px))] gap-1.5 rounded-card bg-raised p-[calc(var(--ad-nest)*3)] text-ink shadow-raised",
            "origin-(--radix-popover-content-transform-origin) data-[state=open]:animate-[ad-in_200ms_var(--ad-ease)] data-[state=closed]:animate-[ad-out_150ms_var(--ad-ease)]",
          )}
        >
          <div className="flex items-start gap-2">
            <span className="grid h-4 min-w-4 shrink-0 translate-y-0.5 place-items-center rounded-full bg-fill px-1 text-[0.72em] font-medium tabular-nums text-ink-muted">{n}</span>
            <div className="grid min-w-0 flex-1">
              <span className="text-body font-medium">{source.title}</span>
              {source.meta ? <span className="text-small text-ink-muted">{source.meta}</span> : null}
            </div>
            {source.href ? (
              <a href={source.href} target="_blank" rel="noreferrer" aria-label="Open source" className="grid size-6 shrink-0 place-items-center rounded-item text-ink-muted hover:bg-fill focus-visible:bg-fill">
                <ExternalLink size={14} />
              </a>
            ) : null}
          </div>
          {source.quote ? <p className="rounded-item bg-fill px-2.5 py-2 text-small leading-relaxed text-ink-muted">{source.quote}</p> : null}
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}
