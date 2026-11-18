// Agent screens the AI and Backgrounds pieces sit in on the site: a message box, the new-chat screen, a thread
// with its live run line, and a chat list. Site-only (not shipped); the pieces themselves (Composer included) are in
// src/components/ai.
import * as React from "react";
import { Clock, Edit, Inbox, TrendingUp } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Composer, ComposerGlow, type ComposerGlowProps } from "@/components/ai/composer-glow";
import { RunStatus } from "@/components/ai/run-status";
import { ThinkingOrbs } from "@/components/ai/thinking-orbs";

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
        <Composer working={glow?.working} placeholder="Ask about orders, stock or payouts" />
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

/** Earlier exchanges in the running chat (question, answer), so the thread fills a real chat-app height. */
const EXCHANGES: { me: string; agent: string; wide?: boolean }[] = [
  { me: "Any returns today?", agent: "Two, both at Senopati: a cracked mug and a taplak in the wrong size. Both refunds are queued.", wide: true },
  { me: "Did the Shopee payout land?", agent: "Yes, Rp 12.400.000 at 09:12. TikTok's Rp 4.180.000 is due tomorrow.", wide: true },
  { me: "How did Rimba Kemang do yesterday?", agent: "42 orders for Rp 8.960.000, up 12% on the Sunday before. Taplak meja tenun ikat sold out by 15:00." },
  { me: "Restock it from Dago?", agent: "Dago has 9 left. I moved 6 to Kemang and kept 3 for Dago's open orders." },
];

/** The user's turn: a soft bubble on the right, sized to its text. */
function Mine({ children }: { children: React.ReactNode }) {
  return <div className="ml-auto w-fit max-w-[80%] rounded-card bg-fill px-3.5 py-2 text-body text-ink">{children}</div>;
}

/** The conversation column: centred and capped so lines stay readable in a wide thread. */
const COLUMN = "mx-auto w-full max-w-[720px]";

/**
 * A thread: earlier turns, the answer so far, the live run line, then the working message box pinned to the bottom.
 * From lg the card has a fixed chat-app height and the turns scroll above the box, starting at the latest.
 */
export function ThreadCard({ title = CHATS[0].label, className }: { title?: string; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const scroller = React.useRef<HTMLDivElement>(null);
  const step = useCycle(STEPS, 2400, ref);
  React.useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);
  return (
    <Card data-thread className={cn("flex min-h-0 min-w-0 flex-col gap-3", className)}>
      <CardHeader title={title} />
      <div ref={scroller} className="-ms-2 -me-3 flex min-h-0 flex-1 flex-col overflow-y-auto ps-2 pe-3">
        {/* Turns pair up: a question sits close to its answer, and exchanges get more room between them. */}
        <div className={cn(COLUMN, "mt-auto grid gap-6 pt-1")}>
          {EXCHANGES.map((t) => (
            <div key={t.me} className={cn("grid gap-3", t.wide && "max-lg:hidden")}>
              <Mine>{t.me}</Mine>
              <p className="max-w-[92%] text-body leading-relaxed text-ink">{t.agent}</p>
            </div>
          ))}
          <div className="grid gap-3">
            <Mine>Which orders are late this week?</Mine>
            <div className="grid gap-1.5 text-body leading-relaxed text-ink">
              <p>Seven orders are past their ship-by date, five of them at Rimba Kemang. Two are waiting on stock for Gelas kopi tanah liat.</p>
              <p className="text-ink-muted">Checking whether the other two have a courier booked.</p>
            </div>
            <div ref={ref} className="pt-1">
              <RunStatus text={step} />
            </div>
          </div>
        </div>
      </div>
      <ComposerGlow working halo={16} className={COLUMN}>
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
  { label: "Courier costs, October", time: "Sun" },
  { label: "Best sellers at Senopati", time: "Sat" },
  { label: "Unpaid orders over 3 days", time: "Fri" },
  { label: "Price check, rattan baskets", time: "12 Nov" },
  { label: "Stock count before 11.11", time: "10 Nov" },
  { label: "New shop setup, Darmo", time: "8 Nov" },
  { label: "Weekly sales summary", time: "3 Nov" },
  { label: "Shopee fees, Q3", time: "1 Nov" },
  { label: "Slow movers to discount", time: "30 Oct" },
  { label: "Packing errors last month", time: "28 Oct" },
];

/** On phones and tablets the list shows the latest few; from lg it fills the column beside the thread. */
const PHONE_CHATS = 5;

/** The chat list, the app's sidebar: a running chat shows the orbs where its time would be. */
export function ChatsCard({ active, onActive, className }: { active: number; onActive: (i: number) => void; className?: string }) {
  return (
    <Card data-chats className={cn("flex min-h-0 min-w-0 flex-col gap-2", className)}>
      <CardHeader
        title="Chats"
        action={
          <Button variant="ghost" icon aria-label="New chat" className="-mr-1.5">
            <Edit />
          </Button>
        }
      />
      <div className="-mx-1.5 grid min-h-0 flex-1 content-start gap-px overflow-y-auto">
        {CHATS.map((c, i) => (
          <button
            key={c.label}
            type="button"
            onClick={() => onActive(i)}
            className={cn(
              "flex h-item shrink-0 cursor-pointer items-center gap-3 rounded-control px-2.5 text-left text-body transition-colors duration-[160ms] ease-ad",
              i >= PHONE_CHATS && "max-lg:hidden",
              i === active ? "bg-fill-strong text-ink" : "text-ink-muted hover:bg-fill hover:text-ink",
            )}
          >
            <span className="min-w-0 flex-1 truncate">{c.label}</span>
            {c.running ? (
              <>
                <ThinkingOrbs size={16} />
                <span className="sr-only">Still running</span>
              </>
            ) : (
              <span className="shrink-0 text-small text-ink-muted">{c.time}</span>
            )}
          </button>
        ))}
      </div>
    </Card>
  );
}

/**
 * The agent in use, as an app: the chat list on the left as a sidebar (sized to its labels, 240 to 280 px), the running
 * thread takes the rest. Below lg they stack.
 */
export function AgentApp({ className }: { className?: string }) {
  const [active, setActive] = React.useState(0);
  return (
    <div data-agent-app className={cn("grid grid-cols-1 gap-4 lg:h-[580px] lg:grid-cols-[fit-content(280px)_minmax(0,1fr)]", className)}>
      <ChatsCard active={active} onActive={setActive} className="lg:min-w-[240px]" />
      <ThreadCard title={CHATS[active].label} />
    </div>
  );
}
