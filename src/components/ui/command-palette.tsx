import * as React from "react";
import { Dialog as D } from "radix-ui";
import { Search as SearchIcon } from "react-feather";
import { cn } from "@/lib/ad";
import { overlayClass } from "@/components/ui/dialog";
import { Shortcut } from "@/components/ui/kbd";

export interface Command {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  /** Extra words that should find this command. */
  keywords?: string;
  shortcut?: string[];
  onSelect: () => void;
}

export interface CommandGroup {
  label: string;
  items: Command[];
}

/** Opens on Cmd+K / Ctrl+K anywhere on the page. */
export function useCommandShortcut(setOpen: (fn: (open: boolean) => boolean) => void, key = "k") {
  React.useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === key) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [setOpen, key]);
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: CommandGroup[];
  placeholder?: string;
  /** Shown when nothing matches. */
  empty?: React.ReactNode;
}

/**
 * Search box over every action. Arrows move, Enter runs, Esc closes.
 * Groups are separated by space and a quiet label, never by lines.
 */
export function CommandPalette({ open, onOpenChange, groups, placeholder = "Type a command or search", empty = "Nothing found" }: CommandPaletteProps) {
  const [q, setQ] = React.useState("");
  const [active, setActive] = React.useState(0);
  const list = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    return groups
      .map((g) => ({ ...g, items: g.items.filter((i) => !t || `${i.label} ${i.keywords ?? ""}`.toLowerCase().includes(t)) }))
      .filter((g) => g.items.length);
  }, [groups, q]);
  const flat = filtered.flatMap((g) => g.items);

  React.useEffect(() => setActive(0), [q, open]);
  React.useEffect(() => {
    if (!open) setQ("");
  }, [open]);
  React.useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const run = (c: Command | undefined) => {
    if (!c) return;
    onOpenChange(false);
    c.onSelect();
  };

  let index = -1;
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className={overlayClass} />
        <D.Content
          aria-describedby={undefined}
          className={cn(
            "fixed left-1/2 top-[14vh] z-50 w-[min(560px,calc(100vw-24px))] -translate-x-1/2 rounded-card bg-raised p-nest text-ink shadow-dialog",
            "data-[state=open]:animate-[ad-in_220ms_var(--ad-ease)] data-[state=closed]:animate-[ad-out_140ms_ease-in]",
          )}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setActive((a) => Math.min(flat.length - 1, a + 1));
            else if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
            else if (e.key === "Enter") run(flat[active]);
            else return;
            e.preventDefault();
          }}
        >
          <D.Title className="sr-only">Commands</D.Title>
          <label className="flex h-[calc(var(--ad-control-h)+8px)] items-center gap-2.5 rounded-control bg-fill px-3 text-body focus-within:bg-fill-hover">
            <SearchIcon size={16} className="shrink-0 text-ink-muted" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              aria-label="Search commands"
              role="combobox"
              aria-expanded
              aria-controls="ad-command-list"
              aria-activedescendant={flat[active] ? `ad-cmd-${flat[active].id}` : undefined}
              className="h-full w-full min-w-0 bg-transparent text-ink outline-none placeholder:text-ink-faint"
            />
          </label>
          <div ref={list} id="ad-command-list" role="listbox" className="mt-nest max-h-[min(360px,56vh)] overflow-auto">
            {flat.length === 0 ? <div className="flex h-16 items-center justify-center text-body text-ink-muted">{empty}</div> : null}
            {filtered.map((g) => (
              <div key={g.label} role="group" aria-label={g.label} className="grid gap-px pb-1">
                <div className="flex h-7 items-center px-2.5 text-small text-ink-muted">{g.label}</div>
                {g.items.map((c) => {
                  index++;
                  const i = index;
                  const Icon = c.icon;
                  return (
                    <div
                      key={c.id}
                      id={`ad-cmd-${c.id}`}
                      role="option"
                      aria-selected={i === active}
                      data-index={i}
                      onPointerMove={() => i !== active && setActive(i)}
                      onClick={() => run(c)}
                      className={cn(
                        "flex h-item cursor-pointer select-none items-center gap-2.5 rounded-control px-2.5 text-body",
                        i === active && "bg-fill",
                      )}
                    >
                      {Icon ? <Icon size={16} className="shrink-0 text-ink-muted" /> : null}
                      <span className="min-w-0 flex-1 truncate">{c.label}</span>
                      {c.shortcut ? <Shortcut keys={c.shortcut} /> : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
