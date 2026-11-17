// Agent screens the AI and Backgrounds pieces sit in on the site: a message box, the new-chat screen, a thread
// with its live run line, and a chat list. Site-only (not shipped); the pieces themselves are in src/components/ai.
import * as React from "react";
import { ArrowUp, Clock, Inbox, Paperclip, Square, TrendingUp } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ComposerGlow, type ComposerGlowProps } from "@/components/ai/composer-glow";
import { RunStatus } from "@/components/ai/run-status";
import { ThinkingOrbs } from "@/components/ai/thinking-orbs";

/** The message box: text, attach, send (stop while working). */
export function Composer({ working, placeholder = "Ask about orders, stock or payouts", className }: { working?: boolean; placeholder?: string; className?: string }) {
  const [value, setValue] = React.useState("");
  return (
    <div className={cn("grid gap-1 rounded-sheet bg-surface p-nest shadow-card", className)}>
      <textarea
        aria-label="Message"
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent px-2 pt-1.5 text-body text-ink outline-none placeholder:text-ink-faint"
      />
      <div className="flex items-center justify-between">
        <Button variant="ghost" icon aria-label="Attach">
          <Paperclip />
        </Button>
        {working ? (
          <Button icon aria-label="Stop">
            <Square />
          </Button>
        ) : (
          <Button variant="primary" icon aria-label="Send" disabled={!value.trim()}>
            <ArrowUp />
          </Button>
        )}
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  { icon: Clock, text: "Which orders are late this week?" },
  { icon: TrendingUp, text: "Summarize today's sales" },
  { icon: Inbox, text: "Draft a restock list for Dago" },
];

/** The new-chat screen: a title, the glowing message box and three suggestions. Sits over a background. */
export function NewChat({ glow, className }: { glow?: Omit<ComposerGlowProps, "children">; className?: string }) {
  return (
    <div className={cn("relative mx-auto grid w-full max-w-[560px] justify-items-center gap-6", className)}>
      <h2 className="text-center text-[length:clamp(22px,3vw,28px)] font-semibold tracking-[-0.01em] text-ink">Where should we start?</h2>
      <ComposerGlow {...glow} className="w-full">
        <Composer working={glow?.working} />
      </ComposerGlow>
      <ul className="grid w-full gap-0.5">
        {SUGGESTIONS.map(({ icon: Icon, text }) => (
          <li key={text}>
            <button type="button" className="flex h-control w-full cursor-pointer items-center gap-3 rounded-control px-3 text-left text-body text-ink-muted transition-colors duration-[160ms] ease-ad hover:text-ink">
              <Icon size={16} className="shrink-0" />
              <span className="truncate">{text}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const STEPS = ["Reading the Board…", "Checking 3 shops…", "Comparing with last week…", "Thinking…"];

/** Steps through `list` every `ms` while on screen. */
export function useCycle<T>(list: T[], ms: number, ref: React.RefObject<HTMLElement | null>) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const el = ref.current;
    let on = true;
    const io = el && typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([e]) => (on = e.isIntersecting)) : null;
    if (el) io?.observe(el);
    const t = window.setInterval(() => on && setI((n) => (n + 1) % list.length), ms);
    return () => {
      window.clearInterval(t);
      io?.disconnect();
    };
  }, [list.length, ms, ref]);
  return list[i];
}

/** A thread: the question, the answer so far, the live run line, then the working message box. */
export function ThreadCard({ className }: { className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const step = useCycle(STEPS, 2400, ref);
  return (
    <Card className={cn("flex flex-col gap-5", className)}>
      <div className="ml-auto max-w-[80%] rounded-card bg-fill px-3.5 py-2 text-body text-ink">Which orders are late this week?</div>
      <div className="grid gap-2 text-body leading-relaxed text-ink">
        <p>Seven orders are past their ship-by date, five of them at Rimba Kemang. Two are waiting on stock for Gelas kopi tanah liat.</p>
        <p className="text-ink-muted">Checking whether the other two have a courier booked.</p>
      </div>
      <div ref={ref}>
        <RunStatus text={step} />
      </div>
      <ComposerGlow working className="mt-auto" halo={16}>
        <Composer working placeholder="Reply" />
      </ComposerGlow>
    </Card>
  );
}

const CHATS = [
  { label: "Late orders this week", time: "", running: true },
  { label: "Payout for Rimba Dago", time: "14:05" },
  { label: "Restock list, clay mugs", time: "11:40" },
  { label: "Promo results, 11.11", time: "Yesterday" },
  { label: "Returns over Rp 500.000", time: "Mon" },
];

/** The chat list: a running chat shows the orbs where its time would be. */
export function ChatsCard({ className }: { className?: string }) {
  const [active, setActive] = React.useState(0);
  return (
    <Card className={cn("grid content-start gap-2", className)}>
      <CardHeader title="Chats" />
      <div className="-mx-1.5 grid gap-px">
        {CHATS.map((c, i) => (
          <button
            key={c.label}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "flex h-item cursor-pointer items-center gap-3 rounded-control px-2.5 text-left text-body transition-colors duration-[160ms] ease-ad",
              i === active ? "bg-fill-hover text-ink" : "text-ink-muted hover:bg-fill hover:text-ink",
            )}
          >
            <span className="min-w-0 flex-1 truncate">{c.label}</span>
            {c.running ? (
              <>
                <ThinkingOrbs size={16} />
                <span className="sr-only">Still running</span>
              </>
            ) : (
              <span className="shrink-0 text-small text-ink-faint">{c.time}</span>
            )}
          </button>
        ))}
      </div>
    </Card>
  );
}
