import * as React from "react";
import { Archive, ArrowLeft, Check, Edit, Edit2, MessageSquare, MoreHorizontal, RotateCcw, Search, Sidebar as SidebarIcon, Star, Trash2, X } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem } from "@/components/ui/menu";
import { SlidingPill } from "@/components/ui/sliding-pill";
import { Tooltip } from "@/components/ui/tooltip";
import { ThinkingOrbs } from "./thinking-orbs";

export interface ChatListItem {
  id: string;
  title: string;
  /** Short time on the right: "14:05", "Mon", "12 Nov". */
  when?: string;
  /** The agent is working here: orbs instead of the time, and the chat rides at the top. */
  running?: boolean;
  pinned?: boolean;
  /** The heading it sits under ("Today", "Last 7 days"). */
  group?: string;
}

export interface ChatListProps {
  chats: ChatListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onPin?: (id: string) => void;
  onRename?: (id: string, title: string) => void;
  onArchive?: (id: string) => void;
  /** Shown in the archived view instead of Archive. */
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
  /** The list shows archived chats, with a way back. */
  archived?: boolean;
  onExitArchived?: () => void;
  /** Folded to a rail of icons. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Below the list: settings, an account. */
  footer?: React.ReactNode;
  className?: string;
}

const ROW = "h-item max-lg:h-11";

/** The title with what was searched for in ink. */
function Match({ text, query }: { text: string; query: string }) {
  const at = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <b className="font-semibold text-ink">{text.slice(at, at + query.length)}</b>
      {text.slice(at + query.length)}
    </>
  );
}

function Row({ chat, selected, query, archived, props }: { chat: ChatListItem; selected: boolean; query: string; archived?: boolean; props: ChatListProps }) {
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState(chat.title);
  const [menu, setMenu] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (editing) input.current?.select();
  }, [editing]);
  const save = () => {
    const next = title.trim();
    if (next && next !== chat.title) props.onRename?.(chat.id, next);
    else setTitle(chat.title);
    setEditing(false);
  };
  if (editing)
    return (
      <li className={cn("flex items-center gap-0.5 rounded-item bg-fill pe-0.5", ROW)}>
        <input
          ref={input}
          aria-label={`Rename ${chat.title}`}
          maxLength={80}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              e.stopPropagation();
              setTitle(chat.title);
              setEditing(false);
            }
          }}
          className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-body text-ink outline-none max-lg:text-[16px]"
        />
        <Button variant="ghost" size="sm" icon aria-label="Save name" onPointerDown={(e) => e.preventDefault()} onClick={save} className="hover:bg-fill-strong focus-visible:bg-fill-strong">
          <Check />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon
          aria-label="Cancel rename"
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => {
            setTitle(chat.title);
            setEditing(false);
          }}
          className="hover:bg-fill-strong focus-visible:bg-fill-strong"
        >
          <X />
        </Button>
      </li>
    );
  const hasMenu = !chat.running && (props.onPin || props.onRename || props.onArchive || props.onRestore || props.onDelete);
  return (
    <li className="group/row relative" data-menu-open={menu || undefined}>
      <button
        type="button"
        aria-current={selected ? "page" : undefined}
        onClick={() => props.onSelect(chat.id)}
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-item px-2.5 text-left text-body",
          ROW,
          selected ? "font-medium text-ink" : "text-ink-muted hover:bg-fill hover:text-ink focus-visible:bg-fill focus-visible:text-ink group-data-[menu-open]/row:bg-fill group-data-[menu-open]/row:text-ink",
        )}
      >
        <span className="min-w-0 flex-1 truncate">
          <Match text={chat.title} query={query} />
        </span>
        {chat.running ? (
          <>
            <ThinkingOrbs size={16} tone="muted" />
            <span className="sr-only">Still running</span>
          </>
        ) : chat.when ? (
          <span
            className={cn(
              "shrink-0 text-small font-normal tabular-nums text-ink-muted",
              hasMenu && "[@media(hover:hover)]:group-hover/row:invisible [@media(hover:hover)]:group-focus-within/row:invisible [@media(hover:hover)]:group-data-[menu-open]/row:invisible",
              hasMenu && selected && "[@media(hover:none)]:invisible",
            )}
          >
            {chat.when}
          </span>
        ) : null}
      </button>
      {hasMenu ? (
        <div
          className={cn(
            "absolute right-0.5 top-1/2 -translate-y-1/2 opacity-0 [@media(hover:hover)]:group-hover/row:opacity-100 group-focus-within/row:opacity-100 group-data-[menu-open]/row:opacity-100",
            selected ? "[@media(hover:none)]:opacity-100" : "[@media(hover:none)]:pointer-events-none",
          )}
        >
          <Menu
            tone="dark"
            align="end"
            open={menu}
            onOpenChange={setMenu}
            trigger={
              <Button variant="ghost" size="sm" icon aria-label={`Chat options for ${chat.title}`} className="hover:bg-fill-strong focus-visible:bg-fill-strong data-[state=open]:bg-fill-strong">
                <MoreHorizontal />
              </Button>
            }
          >
            {archived ? (
              <MenuItem icon={RotateCcw} onSelect={() => props.onRestore?.(chat.id)}>
                Restore
              </MenuItem>
            ) : (
              <>
                {props.onPin ? (
                  <MenuItem icon={Star} onSelect={() => props.onPin?.(chat.id)}>
                    {chat.pinned ? "Unpin" : "Pin"}
                  </MenuItem>
                ) : null}
                {props.onRename ? (
                  <MenuItem
                    icon={Edit2}
                    onSelect={() => {
                      setTitle(chat.title);
                      // After the menu closes and hands focus back, so the field keeps it.
                      window.setTimeout(() => setEditing(true), 0);
                    }}
                  >
                    Rename…
                  </MenuItem>
                ) : null}
                {props.onArchive ? (
                  <MenuItem icon={Archive} onSelect={() => props.onArchive?.(chat.id)}>
                    Archive
                  </MenuItem>
                ) : null}
              </>
            )}
            {props.onDelete ? (
              <MenuItem icon={Trash2} onSelect={() => props.onDelete?.(chat.id)}>
                Delete…
              </MenuItem>
            ) : null}
          </Menu>
        </div>
      ) : null}
    </li>
  );
}

/**
 * An assistant's chat sidebar, a dark island like the app Sidebar: search, new chat, running chats on top, then pinned
 * and dated groups. Each row has a menu (pin, rename, archive, delete), and the whole list folds to a rail of icons.
 */
export function ChatList(props: ChatListProps) {
  const { chats, selectedId, onNewChat, archived, onExitArchived, collapsed = false, onCollapsedChange, footer, className } = props;
  const [query, setQuery] = React.useState("");
  const search = React.useRef<HTMLInputElement>(null);
  const q = query.trim();
  const visible = q ? chats.filter((c) => c.title.toLowerCase().includes(q.toLowerCase())) : chats;
  const groups = React.useMemo(() => {
    if (archived) return visible.length ? [{ id: "archived", label: "Archived", items: visible }] : [];
    const running = visible.filter((c) => c.running);
    const idle = visible.filter((c) => !c.running);
    const pinned = idle.filter((c) => c.pinned);
    const rest = idle.filter((c) => !c.pinned);
    const labels = [...new Set(rest.map((c) => c.group ?? ""))];
    return [
      ...(running.length ? [{ id: "running", label: "", items: running }] : []),
      ...(pinned.length ? [{ id: "pinned", label: "Pinned", items: pinned }] : []),
      ...labels.map((l) => ({ id: l || "recent", label: l, items: rest.filter((c) => (c.group ?? "") === l) })),
    ];
  }, [archived, visible]);
  const toggle = onCollapsedChange ? (
    <Tooltip content={collapsed ? "Expand sidebar" : "Collapse sidebar"} side="right">
      <Button variant="ghost" icon aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => onCollapsedChange(!collapsed)} className="text-ink-muted hover:text-ink focus-visible:text-ink">
        <SidebarIcon />
      </Button>
    </Tooltip>
  ) : null;
  const newChat = (
    <Tooltip content="New chat" side={collapsed ? "right" : "bottom"}>
      <Button variant="ghost" icon aria-label="New chat" onClick={onNewChat} className="text-ink-muted hover:text-ink focus-visible:text-ink">
        <Edit />
      </Button>
    </Tooltip>
  );
  return (
    <aside
      aria-label="Chats"
      data-collapsed={collapsed || undefined}
      className={cn(
        "ad-on-dark flex min-h-0 shrink-0 flex-col gap-1.5 overflow-hidden rounded-card bg-side p-[calc(var(--ad-nest)*2)] text-ink transition-[width] duration-[220ms] ease-ad motion-reduce:transition-none",
        collapsed ? "w-[calc(var(--ad-control-h)+var(--ad-nest)*4)]" : "w-[264px]",
        className,
      )}
    >
      {collapsed ? (
        <div className="grid justify-items-center gap-1">
          {toggle}
          {newChat}
          <Tooltip content="Search chats" side="right">
            <Button
              variant="ghost"
              icon
              aria-label="Search chats"
              onClick={() => {
                onCollapsedChange?.(false);
                window.setTimeout(() => search.current?.focus(), 0);
              }}
              className="text-ink-muted hover:text-ink focus-visible:text-ink"
            >
              <Search />
            </Button>
          </Tooltip>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <label className="flex h-control min-w-0 flex-1 cursor-text items-center gap-2 rounded-control bg-fill px-2.5 text-body transition-colors duration-[160ms] ease-ad hover:bg-fill-strong focus-within:bg-fill-strong">
            <Search size={14} className="shrink-0 text-ink-muted" />
            <input
              ref={search}
              type="search"
              aria-label="Search chats"
              placeholder="Search chats"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && query) {
                  e.stopPropagation();
                  setQuery("");
                }
              }}
              className="h-full w-full min-w-0 bg-transparent text-ink outline-none placeholder:text-ink-muted max-lg:text-[16px] [&::-webkit-search-cancel-button]:hidden"
            />
          </label>
          {newChat}
          {toggle}
        </div>
      )}
      {archived && !collapsed ? (
        <button
          type="button"
          onClick={onExitArchived}
          className={cn("ad-press flex shrink-0 cursor-pointer items-center gap-2 rounded-item px-2.5 text-body text-ink-muted hover:bg-fill hover:text-ink focus-visible:bg-fill focus-visible:text-ink active:scale-[0.98]", ROW)}
        >
          <ArrowLeft size={16} />
          Back to chats
        </button>
      ) : null}
      <div data-scroll className={cn("relative -mx-0.5 min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5", collapsed && "invisible")}>
        <SlidingPill selector='[aria-current="page"]' className="rounded-item bg-fill-strong" />
        {!chats.length ? (
          <div className="grid justify-items-center gap-3 pt-12 text-ink-muted">
            <MessageSquare size={40} strokeWidth={1.5} aria-hidden="true" />
            <p className="m-0 text-body font-medium">{archived ? "No archived chats" : "No chats yet"}</p>
          </div>
        ) : !groups.length ? (
          <p role="status" className="m-0 px-2.5 py-3 text-body text-ink-muted">
            No matching chats
          </p>
        ) : (
          groups.map((g) => (
            <section key={g.id} aria-label={g.label || (g.id === "running" ? "Running" : "Chats")} className="relative mt-2.5 first:mt-0">
              {g.label ? <h3 className="m-0 flex h-7 items-center px-2.5 text-small font-normal text-ink-muted">{g.label}</h3> : null}
              <ul className="m-0 grid list-none gap-px p-0">
                {g.items.map((c) => (
                  <Row key={c.id} chat={c} selected={c.id === selectedId} query={q} archived={archived} props={props} />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
      {footer ? <div className={cn("shrink-0", collapsed && "grid justify-items-center")}>{footer}</div> : null}
    </aside>
  );
}
