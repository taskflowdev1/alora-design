import * as React from "react";
import { Dialog as D } from "radix-ui";
import { Archive, Clock, Database, Edit, Edit2, File as FileIcon, Inbox, Menu as MenuIcon, MessageCircle, MoreHorizontal, Settings, Star, Trash2, TrendingUp, X } from "react-feather";
import { cn, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Dialog, overlayClass } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Menu, MenuItem } from "@/components/ui/menu";
import { toast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { AssistantMarkdown } from "@/components/ai/assistant-markdown";
import { ChatList, type ChatListItem } from "@/components/ai/chat-list";
import { Composer, ComposerGlow, type ComposerGlowProps } from "@/components/ai/composer-glow";
import { EmptyChat } from "@/components/ai/empty-chat";
import { MessageSources } from "@/components/ai/message-sources";
import { ProposalCard } from "@/components/ai/proposal-card";
import { ReportRow } from "@/components/ai/report-row";
import { RunStatus } from "@/components/ai/run-status";
import { TurnRail, type RailTurn } from "@/components/ai/turn-rail";
import { SandField } from "@/components/backgrounds/sand-field";
import { AppFrame } from "./app-frame";
import { RUNNING_CHAT, RUNNING_SCRIPT, SEED_CHATS, scriptFor, wordCount, type AgentChat, type AgentMessage, type AgentReport, type AgentScript } from "./agent-data";
import { DataControls, ReportPreview, WhatsAppLink } from "./agent-settings";
import { useEdgeFade } from "./layout";

const SUGGESTIONS = [
  { icon: Clock, text: "Which orders are late this week?" },
  { icon: TrendingUp, text: "Summarize today’s sales" },
  { icon: Inbox, text: "Draft a restock list for Dago" },
];

/** The new-chat screen over a background (the Backgrounds page uses it too). */
export function NewChat({ glow, className }: { glow?: Omit<ComposerGlowProps, "children">; className?: string }) {
  return (
    <EmptyChat suggestions={SUGGESTIONS} className={className}>
      <ComposerGlow {...glow} className="w-full">
        <Composer working={glow?.working} placeholder="Ask about orders, stock or payouts" />
      </ComposerGlow>
    </EmptyChat>
  );
}

const CSS = `
.ad-agent-swap { animation: ad-agent-swap 160ms var(--ad-ease); }
@keyframes ad-agent-swap { from { opacity: 0; } }
.ad-agent-new { animation: ad-agent-new 220ms var(--ad-ease) both; }
@keyframes ad-agent-new { from { opacity: 0; transform: translateY(6px); } }
.ad-agent-settle { animation: ad-agent-settle 220ms var(--ad-ease) both; }
@keyframes ad-agent-settle { from { opacity: 0; transform: translateY(4px); } }
.ad-agent-drawer[data-state=open] { animation: ad-agent-drawer-in 240ms var(--ad-ease); }
.ad-agent-drawer[data-state=closed] { animation: ad-agent-drawer-out 180ms var(--ad-ease); }
@keyframes ad-agent-drawer-in { from { transform: translateX(calc(-100% - 12px)); } }
@keyframes ad-agent-drawer-out { to { transform: translateX(calc(-100% - 12px)); } }
@media (prefers-reduced-motion: reduce) { .ad-agent-swap, .ad-agent-new, .ad-agent-settle, .ad-agent-drawer[data-state] { animation: none; } }`;

/** The conversation column: centred and capped so lines stay readable. */
const COLUMN = "mx-auto w-full max-w-[720px] px-4 lg:px-6";
const STEP_MS = 800;
const WORD_MS = 34;
const FOLLOW_DISTANCE = 80;

interface Run {
  msgId: string;
  script: AgentScript;
  step: number;
  stepMs: number;
  nextAt: number;
  words: number;
  total: number;
  lastWord: number;
}

let nextId = 0;
const uid = (p: string) => `${p}-${++nextId}`;

/** One reply: its text, then what came with it. Sources, files and proposals land once the text has finished. */
function Reply({ m, run, onDecide, onPreview }: { m: AgentMessage; run?: Run; onDecide: (id: string, yes: boolean) => void; onPreview: (r: AgentReport) => void }) {
  const [open, setOpen] = React.useState<string | null>(null);
  const live = run?.msgId === m.id;
  const thinking = live && run.words === 0;
  const sources = !live && !m.stopped ? (m.sources ?? []) : [];
  const [making, setMaking] = React.useState(!!m.fresh && !!m.report);
  const hasReport = !live && !!m.report && !m.stopped;
  React.useEffect(() => {
    if (!hasReport || !making) return;
    const t = window.setTimeout(() => setMaking(false), 1400);
    return () => window.clearTimeout(t);
  }, [hasReport, making]);
  if (thinking) return <RunStatus text={run.script.steps[run.step]} />;
  const reveal = live ? run.words : m.reveal;
  return (
    <article className="grid min-w-0 gap-2.5">
      <span className="sr-only">Assistant: </span>
      {m.text && reveal !== 0 ? (
        <AssistantMarkdown text={m.text} reveal={reveal} citeTitle={(n) => m.sources?.[n - 1]?.title} onCite={(n) => setOpen((o) => (o === m.sources?.[n - 1]?.id ? null : (m.sources?.[n - 1]?.id ?? null)))} />
      ) : null}
      {m.stopped ? <p className="m-0 text-small text-ink-muted">Stopped</p> : null}
      {sources.length ? <MessageSources sources={sources} openId={open} onOpenChange={setOpen} className={m.fresh ? "ad-agent-settle" : undefined} /> : null}
      {hasReport && m.report ? <ReportRow name={m.report.name} meta={m.report.meta} making={making} onPreview={() => onPreview(m.report!)} className={m.fresh ? "ad-agent-settle" : undefined} /> : null}
      {!live && !m.stopped && m.proposal ? (
        <ProposalCard
          title={m.proposal.title}
          changes={m.proposal.changes}
          status={m.proposal.status}
          onApprove={() => onDecide(m.id, true)}
          onDecline={() => onDecide(m.id, false)}
          className={cn("mt-0.5", m.fresh && "ad-agent-settle")}
        />
      ) : null}
    </article>
  );
}

function Mine({ m }: { m: AgentMessage }) {
  return (
    <div data-turn={m.id} className={cn("ml-auto grid w-fit max-w-[80%] justify-items-end gap-1", m.fresh && "ad-agent-new", m.waiting && "opacity-55")}>
      {m.files?.length ? (
        <ul className="m-0 flex list-none flex-wrap justify-end gap-1 p-0">
          {m.files.map((f) => (
            <li key={f} className="inline-flex h-7 max-w-[220px] items-center gap-1.5 rounded-full bg-fill px-bubble-sm text-small text-ink">
              <FileIcon size={14} className="shrink-0 text-ink-muted" />
              <span className="truncate">{f}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {m.text ? <p className="m-0 whitespace-pre-wrap rounded-card bg-fill px-3.5 py-2 text-body text-ink [overflow-wrap:anywhere]">{m.text}</p> : null}
    </div>
  );
}

/** The scrolling thread. One per chat, so its edge fade always watches the content on screen. */
function ThreadScroll({ scrollRef, onScroll, children }: { scrollRef: React.RefObject<HTMLDivElement | null>; onScroll: React.UIEventHandler<HTMLDivElement>; children: React.ReactNode }) {
  useEdgeFade(scrollRef);
  return (
    <div ref={scrollRef} data-scroll data-thread-scroll onScroll={onScroll} className="ad-fade-y min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {children}
    </div>
  );
}

/** The thread's own options, the same ones a row in the list has. */
function ThreadMenu({ chat, onPin, onRename, onArchive, onDelete }: { chat: AgentChat; onPin: () => void; onRename: () => void; onArchive: () => void; onDelete: () => void }) {
  return (
    <Menu
      align="end"
      trigger={
        <Button variant="ghost" icon aria-label="Chat options" className="text-ink-muted hover:text-ink focus-visible:text-ink">
          <MoreHorizontal />
        </Button>
      }
    >
      <MenuItem icon={Star} onSelect={onPin}>
        {chat.pinned ? "Unpin" : "Pin"}
      </MenuItem>
      <MenuItem icon={Edit2} onSelect={onRename}>
        Rename…
      </MenuItem>
      <MenuItem icon={Archive} onSelect={onArchive}>
        Archive
      </MenuItem>
      <MenuItem icon={Trash2} onSelect={onDelete}>
        Delete…
      </MenuItem>
    </Menu>
  );
}

/** The assistant, whole: chat sidebar, new-chat screen, thread with sources, proposals and a turn rail, and the composer. */
export function AgentApp({ className }: { className?: string }) {
  const [chats, setChats] = React.useState<AgentChat[]>(SEED_CHATS);
  const [selected, setSelected] = React.useState<string | null>("late");
  const [archivedView, setArchivedView] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [drawer, setDrawer] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [files, setFiles] = React.useState<string[]>([]);
  const [, tick] = React.useReducer((n: number) => n + 1, 0);
  const [dialog, setDialog] = React.useState<"data" | "whatsapp" | null>(null);
  const [preview, setPreview] = React.useState<AgentReport | null>(null);
  const [renaming, setRenaming] = React.useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const runs = React.useRef<Record<string, Run>>({});
  const chatsRef = React.useRef(chats);
  chatsRef.current = chats;
  const scroller = React.useRef<HTMLDivElement>(null);
  const follow = React.useRef(true);
  const lastTop = React.useRef(0);
  const fileInput = React.useRef<HTMLInputElement>(null);
  const root = React.useRef<HTMLDivElement>(null);
  const timers = React.useRef<number[]>([]);

  const patch = React.useCallback((id: string, f: (c: AgentChat) => AgentChat) => setChats((list) => list.map((c) => (c.id === id ? f(c) : c))), []);

  const startRun = React.useCallback(
    (chatId: string, script: AgentScript, stepMs = STEP_MS) => {
      const msg: AgentMessage = { id: uid("reply"), role: "assistant", text: script.text, sources: script.sources, report: script.report, fresh: true, proposal: script.proposal ? { ...script.proposal, status: "pending" } : undefined };
      runs.current[chatId] = { msgId: msg.id, script, step: 0, stepMs, nextAt: performance.now() + stepMs, words: 0, total: wordCount(script.text), lastWord: 0 };
      patch(chatId, (c) => {
        const at = c.messages.findIndex((m) => m.waiting);
        const messages = c.messages.map((m, i) => (i === at ? { ...m, waiting: false } : m));
        const after = at >= 0 ? at + 1 : messages.length;
        return { ...c, messages: [...messages.slice(0, after), msg, ...messages.slice(after)] };
      });
    },
    [patch],
  );

  React.useEffect(() => {
    if (!runs.current[RUNNING_CHAT] && chatsRef.current.find((c) => c.id === RUNNING_CHAT)?.messages.length === 1) startRun(RUNNING_CHAT, RUNNING_SCRIPT, 5200);
  }, [startRun]);

  const anyRun = Object.keys(runs.current).length > 0;
  React.useEffect(() => {
    if (!anyRun) return;
    let on = true;
    const io = root.current && typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([e]) => (on = e.isIntersecting)) : null;
    if (root.current) io?.observe(root.current);
    const t = window.setInterval(() => {
      const ids = Object.keys(runs.current);
      if (!on || document.hidden) return;
      const now = performance.now();
      let changed = false;
      for (const id of ids) {
        const r = runs.current[id];
        if (r.words === 0 && now < r.nextAt) continue;
        if (r.words === 0 && r.step < r.script.steps.length - 1) {
          r.step++;
          r.nextAt = now + r.stepMs;
          changed = true;
          continue;
        }
        if (now - r.lastWord < WORD_MS) continue;
        r.lastWord = now;
        r.words = prefersReducedMotion() ? r.total : r.words + 1;
        changed = true;
        if (r.words >= r.total) {
          delete runs.current[id];
          const next = chatsRef.current.find((c) => c.id === id)?.messages.find((m) => m.waiting);
          patch(id, (c) => ({ ...c, when: "Now" }));
          if (next) startRun(id, scriptFor(next.text));
        }
      }
      if (changed) tick();
    }, 16);
    return () => {
      window.clearInterval(t);
      io?.disconnect();
    };
  }, [anyRun, patch, startRun]);

  React.useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const chat = chats.find((c) => c.id === selected) ?? null;
  const run = selected ? runs.current[selected] : undefined;
  const words = run?.words;

  React.useLayoutEffect(() => {
    const el = scroller.current;
    if (el && follow.current) el.scrollTop = el.scrollHeight;
  }, [selected, chat?.messages, words, run?.step]);

  const open = (id: string | null) => {
    follow.current = true;
    setSelected(id);
    setDraft("");
    setFiles([]);
    setDrawer(false);
  };

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text && !files.length) return;
    const sent = files;
    setDraft("");
    setFiles([]);
    follow.current = true;
    const msg: AgentMessage = { id: uid("me"), role: "user", text, files: sent.length ? sent : undefined, fresh: true };
    let id = selected;
    if (!id) {
      id = uid("chat");
      const title = (text || sent[0]).slice(0, 44);
      setChats((list) => [{ id: id!, title, when: "Now", group: "Today", messages: [msg] }, ...list]);
      setSelected(id);
      startRun(id, scriptFor(text));
      return;
    }
    if (runs.current[id]) {
      patch(id, (c) => ({ ...c, messages: [...c.messages, { ...msg, waiting: true }] }));
      return;
    }
    setChats((list) => {
      const me = list.find((c) => c.id === id);
      return me ? [{ ...me, when: "Now", group: "Today", messages: [...me.messages, msg] }, ...list.filter((c) => c.id !== id)] : list;
    });
    startRun(id, scriptFor(text));
  };

  const stop = () => {
    if (!selected) return;
    const r = runs.current[selected];
    if (!r) return;
    delete runs.current[selected];
    patch(selected, (c) => ({ ...c, messages: c.messages.map((m) => (m.id === r.msgId ? { ...m, stopped: true, reveal: r.words } : m)) }));
    tick();
  };

  const stopRef = React.useRef(stop);
  stopRef.current = stop;
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || e.isComposing) return;
      if (!root.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      if (e.target instanceof Element && e.target.closest("input, select, [contenteditable='true']")) return;
      if (document.querySelector("[role='dialog'][data-state='open'], [role='menu'], [role='alertdialog'][data-state='open']")) return;
      stopRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const decide = (msgId: string, yes: boolean) => {
    if (!selected) return;
    const chatId = selected;
    const setStatus = (status: "applying" | "applied" | "declined") =>
      patch(chatId, (c) => ({ ...c, messages: c.messages.map((m) => (m.id === msgId && m.proposal ? { ...m, proposal: { ...m.proposal, status } } : m)) }));
    if (!yes) return setStatus("declined");
    setStatus("applying");
    timers.current.push(window.setTimeout(() => setStatus("applied"), 800));
  };

  const pin = (id: string) => patch(id, (c) => ({ ...c, pinned: !c.pinned }));
  const rename = (id: string, title: string) => patch(id, (c) => ({ ...c, title }));
  const archive = (id: string) => {
    patch(id, (c) => ({ ...c, archived: true, pinned: false }));
    if (selected === id) open(null);
    toast("Chat archived");
  };
  const restore = (id: string) => {
    patch(id, (c) => ({ ...c, archived: false }));
    toast("Chat restored");
  };
  const remove = (id: string) => {
    delete runs.current[id];
    setChats((list) => list.filter((c) => c.id !== id));
    if (selected === id) open(null);
    setDeleting(null);
    toast("Chat deleted");
  };
  const toggleArchived = (on: boolean) => {
    setArchivedView(on);
    open(on ? null : "late");
  };

  const items: ChatListItem[] = chats.filter((c) => !!c.archived === archivedView).map((c) => ({ id: c.id, title: c.title, when: c.when, group: c.group, pinned: c.pinned, running: !!runs.current[c.id] }));
  const turns: RailTurn[] = (chat?.messages ?? []).flatMap((m, i, all) => {
    if (m.role !== "user") return [];
    const next = all[i + 1];
    return [{ id: m.id, question: m.text || m.files?.[0] || "Attachment", reply: next?.role === "assistant" ? next.text.replace(/\s?\[\d+\]|[*|`]/g, "").replace(/\s+/g, " ").trim() : undefined }];
  });

  const list = (phone: boolean) => (
    <ChatList
      chats={items}
      selectedId={selected}
      onSelect={open}
      onNewChat={() => {
        if (archivedView) setArchivedView(false);
        open(null);
      }}
      onPin={pin}
      onRename={rename}
      onArchive={archive}
      onRestore={restore}
      onDelete={setDeleting}
      archived={archivedView}
      onExitArchived={() => toggleArchived(false)}
      collapsed={phone ? false : collapsed}
      onCollapsedChange={phone ? undefined : setCollapsed}
      className={phone ? "h-full w-full" : "h-full"}
      footer={
        <Menu
          tone="dark"
          side="top"
          trigger={
            <Button variant="ghost" icon={!phone && collapsed} aria-label={!phone && collapsed ? "Settings" : undefined} className={cn("text-ink-muted hover:text-ink focus-visible:text-ink", (phone || !collapsed) && "w-full justify-start gap-2.5 px-2.5 font-normal max-lg:h-11")}>
              <Settings />
              {!phone && collapsed ? null : "Settings"}
            </Button>
          }
        >
          {archivedView ? null : (
            <MenuItem icon={Archive} onSelect={() => toggleArchived(true)}>
              Archived
            </MenuItem>
          )}
          <MenuItem icon={Database} onSelect={() => setDialog("data")}>
            Data controls…
          </MenuItem>
          <MenuItem icon={MessageCircle} onSelect={() => setDialog("whatsapp")}>
            WhatsApp…
          </MenuItem>
        </Menu>
      }
    />
  );

  const composer = (
    <div className="grid gap-1.5">
      {files.length ? (
        <ul aria-label="Files to send" className="m-0 flex list-none flex-wrap gap-1 p-0">
          {files.map((f) => (
            <li key={f} className="ad-agent-settle inline-flex h-7 max-w-[240px] items-center gap-1.5 rounded-full bg-fill pe-1 ps-bubble-sm text-small text-ink">
              <FileIcon size={14} className="shrink-0 text-ink-muted" />
              <span className="truncate">{f}</span>
              <button
                type="button"
                aria-label={`Remove ${f}`}
                onClick={() => setFiles((all) => all.filter((x) => x !== f))}
                className="relative grid size-5 cursor-pointer place-items-center rounded-full text-ink-muted after:absolute after:-inset-1 after:content-[''] hover:bg-fill-strong hover:text-ink focus-visible:bg-fill-strong focus-visible:text-ink"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <ComposerGlow working={!!run} halo={16} className="w-full">
        <Composer
          working={!!run}
          value={draft}
          onValueChange={setDraft}
          onSend={send}
          onStop={stop}
          onAttach={() => fileInput.current?.click()}
          canSendEmpty={files.length > 0}
          placeholder={chat ? "Reply" : "Ask about your shop"}
        />
      </ComposerGlow>
    </div>
  );

  const showEmpty = !chat && !archivedView;
  return (
    <div ref={root} data-agent-app className={cn("h-[calc(100dvh-64px-16px)] min-h-[560px] max-lg:h-[calc(100dvh-108px-12px)] max-lg:min-h-[480px]", className)}>
      <style href="ad-agent-app" precedence="default">
        {CSS}
      </style>
      <input
        ref={fileInput}
        type="file"
        multiple
        hidden
        aria-label="Choose files"
        onChange={(e) => {
          const names = Array.from(e.target.files ?? []).map((f) => f.name);
          setFiles((all) => [...new Set([...all, ...names])].slice(0, 5));
          e.target.value = "";
        }}
      />
      <AppFrame
        className="h-full"
        sidebar={
          <div data-chats className="flex min-h-0 shrink-0 max-lg:hidden">
            {list(false)}
          </div>
        }
      >
        <div data-thread className="relative flex h-full min-h-0 flex-col">
          {showEmpty ? <SandField className="rounded-[inherit]" /> : null}
          <header className="relative z-20 flex min-h-[calc(var(--ad-control-h)+var(--ad-nest)*4)] shrink-0 items-center gap-1 px-[calc(var(--ad-nest)*2)] max-lg:px-0">
            <Tooltip content="Chats">
              <Button variant="ghost" icon aria-label="Chats" onClick={() => setDrawer(true)} className="lg:hidden max-lg:size-11">
                <MenuIcon />
              </Button>
            </Tooltip>
            <div className={cn(COLUMN, "flex min-w-0 flex-1 items-center gap-1 max-lg:px-1")}>
              <h2 className="m-0 min-w-0 flex-1 truncate text-title font-semibold text-ink max-lg:text-center">{chat?.title ?? (archivedView ? "Archived" : "New chat")}</h2>
              {chat && !chat.archived ? (
                <span className="max-lg:hidden">
                  <ThreadMenu chat={chat} onPin={() => pin(chat.id)} onRename={() => setRenaming({ id: chat.id, title: chat.title })} onArchive={() => archive(chat.id)} onDelete={() => setDeleting(chat.id)} />
                </span>
              ) : null}
            </div>
            <Tooltip content="New chat">
              <Button
                variant="ghost"
                icon
                aria-label="New chat"
                onClick={() => {
                  if (archivedView) setArchivedView(false);
                  open(null);
                }}
                className="lg:hidden max-lg:size-11"
              >
                <Edit />
              </Button>
            </Tooltip>
          </header>
          {showEmpty ? (
            <div className="relative grid min-h-0 flex-1 place-items-center overflow-y-auto px-4 pb-10">
              <EmptyChat suggestions={SUGGESTIONS} onPick={send}>
                <div className="w-full">{composer}</div>
              </EmptyChat>
            </div>
          ) : !chat ? (
            <div className="grid min-h-0 flex-1 place-items-center px-4 pb-10 text-body text-ink-muted">Pick an archived chat</div>
          ) : (
            <>
              <ThreadScroll
                key={chat.id}
                scrollRef={scroller}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const near = el.scrollHeight - el.scrollTop - el.clientHeight <= FOLLOW_DISTANCE;
                  follow.current = near && (follow.current || el.scrollTop >= lastTop.current);
                  lastTop.current = el.scrollTop;
                }}
              >
                <div className={cn(COLUMN, "ad-agent-swap flex flex-col gap-5 pb-4 pt-1")}>
                  {chat.messages.map((m) => (m.role === "user" ? <Mine key={m.id} m={m} /> : <Reply key={m.id} m={m} run={run} onDecide={decide} onPreview={setPreview} />))}
                </div>
              </ThreadScroll>
              <TurnRail
                key={`rail-${chat.id}`}
                turns={turns}
                scrollRef={scroller}
                onJump={() => {
                  follow.current = false;
                }}
                className="max-lg:hidden"
              />
              {chat.archived ? (
                <div className={cn(COLUMN, "shrink-0 pb-4 pt-1")}>
                  <Button className="w-full" onClick={() => restore(chat.id)}>
                    Restore this chat
                  </Button>
                </div>
              ) : (
                <div className={cn(COLUMN, "shrink-0 pb-4 pt-1")}>{composer}</div>
              )}
            </>
          )}
        </div>
      </AppFrame>

      <D.Root open={drawer} onOpenChange={setDrawer}>
        <D.Portal>
          <D.Overlay className={cn(overlayClass, "lg:hidden")} />
          <D.Content aria-describedby={undefined} className="ad-agent-drawer fixed inset-y-2 left-2 z-50 w-[min(340px,calc(100vw-48px))] outline-none lg:hidden">
            <D.Title className="sr-only">Chats</D.Title>
            {list(true)}
          </D.Content>
        </D.Portal>
      </D.Root>

      <DataControls open={dialog === "data"} onOpenChange={(o) => setDialog(o ? "data" : null)} />
      <WhatsAppLink open={dialog === "whatsapp"} onOpenChange={(o) => setDialog(o ? "whatsapp" : null)} />
      <ReportPreview report={preview} onClose={() => setPreview(null)} />
      <Dialog
        open={!!renaming}
        onOpenChange={(o) => !o && setRenaming(null)}
        title="Rename chat"
        footer={
          <Button
            variant="primary"
            disabled={!renaming?.title.trim()}
            onClick={() => {
              if (renaming) rename(renaming.id, renaming.title.trim());
              setRenaming(null);
            }}
          >
            Save
          </Button>
        }
      >
        <Input
          aria-label="Chat name"
          maxLength={80}
          value={renaming?.title ?? ""}
          onChange={(e) => setRenaming((r) => (r ? { ...r, title: e.target.value } : r))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && renaming?.title.trim()) {
              rename(renaming.id, renaming.title.trim());
              setRenaming(null);
            }
          }}
        />
      </Dialog>
      <Dialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this chat?"
        footer={
          <>
            <Button onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="strong" onClick={() => deleting && remove(deleting)}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}
