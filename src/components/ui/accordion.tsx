import * as React from "react";
import { Accordion as A } from "radix-ui";
import { ChevronDown } from "react-feather";
import { cn } from "@/lib/ad";
import { COLLAPSE_CSS } from "@/components/ui/collapsible";

export interface AccordionItemDef {
  value: string;
  title: React.ReactNode;
  /** A count or status on the right of the row. */
  meta?: React.ReactNode;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItemDef[];
  /** "single" keeps one open at a time; "multiple" lets several stay open. */
  type?: "single" | "multiple";
  defaultValue?: string[];
  /** Each item on its own soft card (a gap between) instead of rows on one surface. */
  cards?: boolean;
  className?: string;
}

/**
 * Stacked sections that open in place (FAQ, settings groups). No lines between items: rows separate by space, or
 * each item is its own soft card. The open item's title stays ink; the chevron turns.
 */
export function Accordion({ items, type = "single", defaultValue, cards, className }: AccordionProps) {
  const inner = items.map((it) => (
    <A.Item key={it.value} value={it.value} className={cn(cards ? "rounded-card bg-fill" : "rounded-item")}>
      <A.Header>
        <A.Trigger
          className={cn(
            "group flex h-row w-full cursor-pointer select-none items-center gap-2 text-left text-body font-medium text-ink",
            cards ? "rounded-card px-pad hover:bg-fill-strong focus-visible:bg-fill-strong" : "rounded-item px-2.5 hover:bg-fill focus-visible:bg-fill",
          )}
        >
          <span className="min-w-0 flex-1 truncate">{it.title}</span>
          {it.meta != null ? <span className="shrink-0 font-normal text-ink-muted">{it.meta}</span> : null}
          <ChevronDown size={16} className="shrink-0 text-ink-muted transition-transform duration-[220ms] ease-ad group-data-[state=open]:rotate-180" />
        </A.Trigger>
      </A.Header>
      <A.Content className="ad-collapse overflow-hidden">
        <div className={cn("pt-1 text-body leading-relaxed text-ink-muted", cards ? "px-pad pb-pad" : "px-2.5 pb-3")}>{it.content}</div>
      </A.Content>
    </A.Item>
  ));
  const cls = cn("grid", cards ? "gap-2" : "gap-px", className);
  return (
    <>
      <style href="ad-collapse" precedence="default">{COLLAPSE_CSS}</style>
      {type === "multiple" ? (
        <A.Root type="multiple" defaultValue={defaultValue} className={cls}>
          {inner}
        </A.Root>
      ) : (
        <A.Root type="single" collapsible defaultValue={defaultValue?.[0]} className={cls}>
          {inner}
        </A.Root>
      )}
    </>
  );
}
