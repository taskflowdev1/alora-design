import * as React from "react";
import { ArrowUp, Paperclip } from "react-feather";
import { cn } from "@/lib/ad";

const SAFE_BOTTOM = "var(--ad-safe-bottom, env(safe-area-inset-bottom, 0px))";
const LIFT = `max(10px, ${SAFE_BOTTOM}, calc(var(--ad-keyboard, 0px) + 8px))`;

export interface MobileChatMessage {
  id: string;
  mine?: boolean;
  text?: React.ReactNode;
  /** A card inside the bubble (an order, a product). */
  attachment?: React.ReactNode;
  /** Starts a new time group: shown centred above it ("Today, 14:05"). */
  time?: string;
}

/**
 * A conversation on a phone: your messages on the right in ink, theirs on the left on the surface; messages from the
 * same side stack close, a new side or a time gap opens space. New messages rise in and the screen follows them to
 * the bottom. The last line stays above the composer and the keyboard. Put it in a MobileScreen with bottomInset="none".
 */
export function MobileChatThread({ messages, typing, className }: { messages: MobileChatMessage[]; typing?: boolean; className?: string }) {
  const end = React.useRef<HTMLDivElement>(null);
  const seen = React.useRef(messages.length);
  const fresh = messages.length > seen.current ? messages.length - seen.current : 0;
  React.useLayoutEffect(() => {
    seen.current = messages.length;
  });
  React.useEffect(() => {
    const scroller = end.current?.closest<HTMLElement>("[data-mobile-screen]");
    if (!scroller) return;
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: fresh || typing ? "smooth" : "auto" });
  }, [messages.length, typing, fresh]);
  return (
    <div className={cn("grid px-pad", className)} style={{ paddingBottom: `calc(var(--ad-composer, 60px) + ${LIFT} + 12px)` }}>
      {messages.map((m, i) => {
        const prev = messages[i - 1];
        const joined = prev && prev.mine === m.mine && !m.time;
        const isNew = i >= messages.length - fresh;
        return (
          <React.Fragment key={m.id}>
            {m.time ? <p className="pb-2 pt-4 text-center text-[12px] text-ink-muted">{m.time}</p> : null}
            <div className={cn("grid max-w-[80%]", m.mine ? "justify-self-end justify-items-end" : "justify-self-start justify-items-start", joined ? "mt-1" : i && !m.time ? "mt-3" : null, isNew && "animate-[ad-up_220ms_var(--ad-ease)]")}>
              <div className={cn("grid w-fit gap-2 rounded-card px-3.5 py-2 text-[16px] leading-[22px]", m.mine ? "bg-on text-on-ink" : "bg-surface text-ink shadow-card")}>
                {m.attachment}
                {m.text ? <p className="[overflow-wrap:anywhere]">{m.text}</p> : null}
              </div>
            </div>
          </React.Fragment>
        );
      })}
      {typing ? (
        <div role="status" aria-label="Typing" className="mt-3 flex w-fit items-center gap-1 rounded-card bg-surface px-3.5 py-3 shadow-card animate-[ad-up_200ms_var(--ad-ease)]">
          <style href="ad-chat-typing" precedence="default">{`@keyframes ad-typing { 0%, 60%, 100% { transform: translateY(0); opacity: .5; } 30% { transform: translateY(-3px); opacity: 1; } }`}</style>
          {[0, 1, 2].map((i) => (
            <span key={i} data-shape="round" className="size-[7px] rounded-full bg-ink-muted animate-[ad-typing_1s_ease-in-out_infinite] motion-reduce:animate-none" style={{ animationDelay: `${i * 140}ms` }} />
          ))}
        </div>
      ) : null}
      <div ref={end} />
    </div>
  );
}

export interface MobileComposerProps {
  value: string;
  onValueChange: (value: string) => void;
  onSend: (text: string) => void;
  /** Shows the paperclip (photo, order, product). */
  onAttach?: () => void;
  placeholder?: string;
  /** Quick replies above the field; a tap sends one. */
  suggestions?: string[];
  /** While a reply streams in: send is off. */
  busy?: boolean;
}

/**
 * The message box on a phone: a floating card at the bottom that rides on top of the keyboard, a field that grows to
 * five lines (16 px, so nothing zooms), the paperclip on the left and send on the right (the accent only once there is
 * something to send). Enter adds a line; the button sends. Quick replies sit on top in one sideways row.
 */
export function MobileComposer({ value, onValueChange, onSend, onAttach, placeholder = "Message", suggestions, busy }: MobileComposerProps) {
  const box = React.useRef<HTMLDivElement>(null);
  const field = React.useRef<HTMLTextAreaElement>(null);
  // Tell the thread how tall the composer is, so its last message stays in view.
  React.useLayoutEffect(() => {
    const el = box.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    const ro = new ResizeObserver(() => host.style.setProperty("--ad-composer", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => {
      ro.disconnect();
      host.style.removeProperty("--ad-composer");
    };
  }, []);
  React.useLayoutEffect(() => {
    const t = field.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = `${Math.min(t.scrollHeight, 22 * 5 + 22)}px`;
  }, [value]);
  const can = !!value.trim() && !busy;
  const send = (text: string) => {
    if (!text.trim() || busy) return;
    onSend(text.trim());
  };
  const round = "rounded-[calc(var(--ad-radius-sheet)-var(--ad-nest))]";
  return (
    <div ref={box} data-mobile-composer className="fixed inset-x-3 z-30 grid gap-1 rounded-sheet bg-surface p-nest shadow-dialog transition-[bottom] duration-[250ms] ease-ad" style={{ bottom: LIFT }}>
      {suggestions?.length ? (
        <div className="-mx-nest flex gap-1 overflow-x-auto px-nest [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy}
              onClick={() => send(s)}
              className={cn("h-touch shrink-0 cursor-pointer whitespace-nowrap bg-fill px-3.5 text-[15px] text-ink transition-[background-color,transform] duration-[150ms] ease-ad focus-visible:bg-fill-strong active:scale-[0.96] active:bg-fill-strong disabled:opacity-45 [-webkit-tap-highlight-color:transparent]", round)}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex items-end gap-1">
        {onAttach ? (
          <button type="button" aria-label="Attach" onClick={onAttach} className={cn("grid size-touch shrink-0 cursor-pointer place-items-center text-ink transition-[background-color,transform] duration-[150ms] ease-ad focus-visible:bg-fill active:scale-[0.9] [-webkit-tap-highlight-color:transparent]", round)}>
            <Paperclip size={20} strokeWidth={1.75} />
          </button>
        ) : null}
        <textarea
          ref={field}
          rows={1}
          value={value}
          aria-label={placeholder}
          placeholder={placeholder}
          enterKeyHint="enter"
          onChange={(e) => onValueChange(e.target.value)}
          className={cn("min-h-touch min-w-0 flex-1 resize-none bg-transparent py-[11px] text-[16px] leading-[22px] text-ink outline-none placeholder:text-ink-muted [scrollbar-width:none]", !onAttach && "pl-2.5")}
        />
        <button
          type="button"
          aria-label="Send"
          disabled={!can}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => send(value)}
          className={cn(
            "grid size-touch shrink-0 cursor-pointer place-items-center transition-[background-color,color,transform] duration-[150ms] ease-ad active:scale-[0.9] disabled:cursor-default [-webkit-tap-highlight-color:transparent]",
            round,
            can ? "bg-brand text-brand-ink focus-visible:bg-brand-hover" : "bg-fill text-ink-muted",
          )}
        >
          <ArrowUp size={20} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
