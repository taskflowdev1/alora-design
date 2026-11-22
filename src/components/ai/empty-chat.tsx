import * as React from "react";
import { cn } from "@/lib/ad";

export interface ChatSuggestion {
  text: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
}

export interface EmptyChatProps {
  title?: string;
  /** Starting points under the message box. */
  suggestions?: ChatSuggestion[];
  onPick?: (text: string) => void;
  /** The message box. */
  children?: React.ReactNode;
  className?: string;
}

/** The new-chat screen: a question, the message box, and a few places to start. Sits over a background. */
export function EmptyChat({ title = "Where should we start?", suggestions = [], onPick, children, className }: EmptyChatProps) {
  return (
    <div className={cn("relative mx-auto grid w-full max-w-[560px] justify-items-center gap-6", className)}>
      <h2 className="m-0 text-center text-[length:clamp(22px,3vw,28px)] font-semibold tracking-[-0.01em] text-ink text-balance">{title}</h2>
      {children}
      {suggestions.length ? (
        <ul className="m-0 grid w-full list-none gap-0.5 p-0">
          {suggestions.map(({ icon: Icon, text }) => (
            <li key={text}>
              <button
                type="button"
                onClick={() => onPick?.(text)}
                className="ad-press flex h-control w-full cursor-pointer select-none items-center gap-3 rounded-control px-3 text-left text-body text-ink-muted hover:bg-fill hover:text-ink focus-visible:bg-fill focus-visible:text-ink active:scale-[0.99] max-lg:h-11"
              >
                {Icon ? <Icon size={16} className="shrink-0" /> : null}
                <span className="truncate">{text}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
