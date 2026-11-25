import * as React from "react";
import { Clock, Inbox, TrendingUp } from "react-feather";
import { AssistantMarkdown } from "@/components/ai/assistant-markdown";
import { ChatList, type ChatListItem } from "@/components/ai/chat-list";
import { Composer, ComposerGlow } from "@/components/ai/composer-glow";
import { EmptyChat } from "@/components/ai/empty-chat";
import { MessageSources, type MessageSource } from "@/components/ai/message-sources";
import { ProposalCard, type ProposalStatus } from "@/components/ai/proposal-card";
import { ReportRow } from "@/components/ai/report-row";
import { TurnRail, type RailTurn } from "@/components/ai/turn-rail";

type Values = Record<string, number | string | boolean>;

const REPLY = "**7 orders** are late, **5 at Kemang** [1].\n\n| Shop | Late | Value |\n|---|---|---|\n| Kemang | 5 | Rp 2.140.000 |\n| Senopati | 1 | Rp 420.000 |\n| Darmo | 1 | Rp 354.000 |";

function MarkdownDemo({ stream }: Values) {
  const [words, setWords] = React.useState(0);
  React.useEffect(() => {
    if (!stream) return;
    setWords(0);
    const t = window.setInterval(() => setWords((n) => (n > 34 ? 0 : n + 1)), 90);
    return () => window.clearInterval(t);
  }, [stream]);
  return <AssistantMarkdown text={REPLY} reveal={stream ? words : undefined} citeTitle={() => "7 late orders"} className="w-full max-w-[420px]" />;
}

const SOURCES: MessageSource[] = [
  { id: "orders", title: "7 late orders", kind: "order", fields: [{ label: "Kemang", value: "5 orders" }, { label: "Oldest", value: "RMB-24761, 3 days" }, { label: "Value", value: "Rp 2.914.000" }] },
  { id: "gelas", title: "Gelas kopi tanah liat", kind: "product", fields: [{ label: "SKU", value: "RMB-GL-014" }, { label: "Price", value: "Rp 89.000" }, { label: "Kemang", value: "2 left" }] },
  { id: "payout", title: "Shopee payout", kind: "payout", fields: [{ label: "Amount", value: "Rp 12.400.000" }, { label: "Landed", value: "Today, 09:12" }] },
];

const SourcesDemo = () => <MessageSources sources={SOURCES} className="w-full max-w-[420px]" />;

function ProposalDemo({ status }: Values) {
  const [run, setRun] = React.useState(0);
  const fixed = status !== "live";
  return (
    <div className="grid w-full max-w-[380px] justify-items-center gap-3">
      <ProposalCard
        key={run}
        title="Move 6 Gelas kopi tanah liat from Dago to Kemang"
        status={fixed ? (status as ProposalStatus) : undefined}
        onApprove={() => new Promise((res) => window.setTimeout(res, 800))}
        onDecline={() => window.setTimeout(() => setRun((n) => n + 1), 1600)}
        changes={[
          { label: "Kemang stock", before: "2", after: "8" },
          { label: "Dago stock", before: "9", after: "3" },
        ]}
        className="w-full bg-fill shadow-none"
      />
    </div>
  );
}

const RAIL_TURNS: RailTurn[] = ["Which orders are late?", "Why are the Kemang ones stuck?", "Move stock from Dago", "Tell the buyers", "Any returns today?", "Did the payout land?", "Summarize today"].map((question, i) => ({
  id: `t${i}`,
  question,
  reply: "Seven orders, five of them at Kemang.",
}));

function RailDemo() {
  const scroller = React.useRef<HTMLDivElement>(null);
  return (
    <div className="relative h-[176px] w-full max-w-[420px] overflow-hidden rounded-card bg-fill">
      <div ref={scroller} data-scroll className="h-full overflow-y-auto overscroll-contain py-3 pe-3 ps-12 [scrollbar-width:none]">
        <div className="grid gap-5">
          {RAIL_TURNS.map((t) => (
            <p key={t.id} data-turn={t.id} className="m-0 text-body text-ink">
              {t.question}
            </p>
          ))}
        </div>
      </div>
      <TurnRail turns={RAIL_TURNS} scrollRef={scroller} />
    </div>
  );
}

const ReportDemo = ({ making }: Values) => <ReportRow name="Payout Rimba Dago, November.pdf" meta="2 pages · 84 KB" making={!!making} className="w-full max-w-[420px] bg-fill shadow-none" />;

const DEMO_CHATS: ChatListItem[] = [
  { id: "count", title: "Stock count before 12.12", running: true, group: "Today" },
  { id: "payout", title: "Payout for Rimba Dago", when: "14:05", pinned: true, group: "Today" },
  { id: "late", title: "Late orders this week", when: "14:12", group: "Today" },
  { id: "mugs", title: "Restock list, clay mugs", when: "11:40", group: "Today" },
  { id: "promo", title: "Promo results, 11.11", when: "Wed", group: "Last 7 days" },
];

function ChatListDemo({ collapsed }: Values) {
  const [chats, setChats] = React.useState(DEMO_CHATS);
  const [selected, setSelected] = React.useState<string | null>("late");
  const [fold, setFold] = React.useState(!!collapsed);
  React.useEffect(() => setFold(!!collapsed), [collapsed]);
  return (
    <ChatList
      chats={chats}
      selectedId={selected}
      onSelect={setSelected}
      onNewChat={() => setSelected(null)}
      onPin={(id) => setChats((l) => l.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)))}
      onRename={(id, title) => setChats((l) => l.map((c) => (c.id === id ? { ...c, title } : c)))}
      onDelete={(id) => setChats((l) => l.filter((c) => c.id !== id))}
      collapsed={fold}
      onCollapsedChange={setFold}
      className="h-[320px]"
    />
  );
}

const EmptyDemo = () => (
  <EmptyChat
    className="max-w-[420px]"
    suggestions={[
      { icon: Clock, text: "Which orders are late this week?" },
      { icon: TrendingUp, text: "Summarize today’s sales" },
      { icon: Inbox, text: "Draft a restock list for Dago" },
    ]}
  >
    <ComposerGlow className="w-full">
      <Composer placeholder="Ask about orders, stock or payouts" />
    </ComposerGlow>
  </EmptyChat>
);

/** Items that need sample data to show anything. */
export const AI_DEMOS: Record<string, React.ComponentType<Values>> = {
  "assistant-markdown": MarkdownDemo,
  "message-sources": SourcesDemo,
  "proposal-card": ProposalDemo,
  "turn-rail": RailDemo,
  "report-row": ReportDemo,
  "chat-list": ChatListDemo,
  "empty-chat": EmptyDemo,
};
