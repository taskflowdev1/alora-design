import * as React from "react";
import { ArrowUpRight } from "react-feather";
import { cn } from "@/lib/ad";

export interface PromptSuggestion {
  /** What gets sent (and shown, unless `label` is given). */
  prompt: string;
  label?: React.ReactNode;
  /** A Feather icon for the kind of task. */
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
}

export interface PromptSuggestionsProps {
  items: PromptSuggestion[];
  onPick: (prompt: string) => void;
  /** "list" stacks full-width rows (an empty chat); "chips" wraps them under an answer as follow-ups. */
  layout?: "list" | "chips";
  className?: string;
}

/**
 * Prompts to tap instead of an empty box: picking is easier than writing from scratch. Rows come in one after another
 * (30 ms apart, once, on mount) and press like buttons; the arrow shows a tap sends it.
 */
export function PromptSuggestions({ items, onPick, layout = "list", className }: PromptSuggestionsProps) {
  const chips = layout === "chips";
  return (
    <ul aria-label="Suggested prompts" className={cn(chips ? "flex flex-wrap gap-gap" : "grid gap-px", className)}>
      {items.map((it, i) => (
        <li key={it.prompt} className="min-w-0 animate-[ad-up_220ms_var(--ad-ease)_backwards]" style={{ animationDelay: `${Math.min(i * 30, 240)}ms` }}>
          <button
            type="button"
            onClick={() => onPick(it.prompt)}
            className={cn(
              "group flex min-w-0 cursor-pointer select-none items-center gap-2 text-left text-body text-ink ad-press active:scale-[0.97] [&_svg]:size-[16px] [&_svg]:shrink-0",
              chips
                ? "h-item max-w-full rounded-full bg-fill px-bubble-sm hover:bg-fill-strong focus-visible:bg-fill-strong"
                : "min-h-row w-full rounded-item px-2.5 py-1.5 hover:bg-fill focus-visible:bg-fill",
            )}
          >
            {it.icon ? <it.icon className="text-ink-muted" /> : null}
            <span className="min-w-0 flex-1 truncate">{it.label ?? it.prompt}</span>
            {chips ? null : <ArrowUpRight className="text-ink-muted opacity-0 transition-opacity duration-[150ms] group-hover:opacity-100 group-focus-visible:opacity-100" />}
          </button>
        </li>
      ))}
    </ul>
  );
}
