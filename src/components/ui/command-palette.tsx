import * as React from "react";
import { Dialog as D } from "radix-ui";
import { Search as SearchIcon } from "react-feather";
import { cn } from "@/lib/ad";
import { overlayClass, useReturnFocus } from "@/components/ui/dialog";
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

const finePointer = () => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  groups: CommandGroup[];
  placeholder?: string;
  /** Shown when nothing matches. */
  empty?: React.ReactNode;
  /** Render the panel in place (no dialog, no overlay, no autofocus), e.g. on a page or in a side card. */
  inline?: boolean;
  className?: string;
}

/**
 * Search box over every action. Arrows move, Enter runs, Esc closes.
 * Groups are separated by space and a quiet label, never by lines.
 */
export function CommandPalette({ open = false, onOpenChange, inline, className, ...panel }: CommandPaletteProps) {
  // Opened from state (a button or the shortcut), so Radix has no Trigger to hand focus back to on Esc.
  const returnFocus = useReturnFocus(open && !inline);
  if (inline) return <CommandPanel {...panel} inline className={cn("flex flex-col rounded-card bg-raised p-nest text-ink", className)} />;
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className={overlayClass} />
        <D.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            // Phones: focus the panel, not the field, so the keyboard doesn't cover the list until they tap it.
            if (finePointer()) return;
            e.preventDefault();
            (e.target as HTMLElement | null)?.focus();
          }}
          onCloseAutoFocus={returnFocus}
          className={cn(
            // A dialog over a dimmed page, so in dark it takes the dialog step, not the menu one (which would sit on the page grey).
            "fixed left-1/2 top-[14dvh] z-50 w-[min(560px,calc(100vw-24px))] -translate-x-1/2 rounded-card bg-raised p-nest text-ink shadow-dialog dark:bg-surface",
            // Opened many times a day, so it appears at once; it only fades on the way out.
            "data-[state=closed]:animate-[ad-fade-out_120ms_var(--ad-ease)]",
            className,
          )}
        >
          <D.Title className="sr-only">Commands</D.Title>
          <CommandPanel {...panel} autoFocus onRun={() => onOpenChange?.(false)} />
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

function CommandPanel({
  groups,
  placeholder = "Type a command or search",
  empty = "Nothing found",
  autoFocus,
  onRun,
  inline,
  className,
}: Pick<CommandPaletteProps, "groups" | "placeholder" | "empty" | "className" | "inline"> & { autoFocus?: boolean; onRun?: () => void }) {
  const [q, setQ] = React.useState("");
  const [active, setActive] = React.useState(0);
  const list = React.useRef<HTMLDivElement>(null);
  const uid = React.useId();

  const filtered = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return groups;
    // Word-start matches first ("bar" finds Bar chart before Scrollbar), then the label before keywords; ties keep order.
    const rank = (i: Command) => {
      const label = ` ${i.label.toLowerCase()}`;
      const keywords = ` ${(i.keywords ?? "").toLowerCase()}`;
      if (label.startsWith(` ${t}`)) return 0;
      if (label.includes(` ${t}`)) return 1;
      if (keywords.includes(` ${t}`)) return 2;
      return label.includes(t) || keywords.includes(t) ? 3 : -1;
    };
    return groups
      .map((g) => ({
        ...g,
        items: g.items
          .map((i) => [i, rank(i)] as const)
          .filter(([, r]) => r >= 0)
          .sort((x, y) => x[1] - y[1])
          .map(([i]) => i),
      }))
      .filter((g) => g.items.length);
  }, [groups, q]);
  const flat = filtered.flatMap((g) => g.items);

  React.useEffect(() => setActive(0), [q]);
  React.useEffect(() => {
    const box = list.current;
    const el = box?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!box || !el) return;
    // Scroll the list only (never the page, which scrollIntoView would do for an inline panel).
    if (el.offsetTop < box.scrollTop) box.scrollTop = el.offsetTop;
    else if (el.offsetTop + el.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = el.offsetTop + el.offsetHeight - box.clientHeight;
  }, [active]);

  const run = (c: Command | undefined) => {
    if (!c) return;
    onRun?.();
    c.onSelect();
  };

  let index = -1;
  return (
    <div
      className={className}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") setActive((a) => Math.min(flat.length - 1, a + 1));
        else if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
        else if (e.key === "Enter") run(flat[active]);
        else return;
        e.preventDefault();
      }}
    >
      <label className="flex h-[calc(var(--ad-control-h)+8px)] items-center gap-2.5 rounded-control bg-fill px-3 text-body focus-within:bg-fill-strong">
        <SearchIcon size={16} className="shrink-0 text-ink-muted" />
        <input
          autoFocus={autoFocus && finePointer()}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="go"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          aria-label="Search commands"
          role="combobox"
          aria-expanded
          aria-controls={`${uid}-list`}
          aria-activedescendant={flat[active] ? `${uid}-${flat[active].id}` : undefined}
          className="h-full w-full min-w-0 bg-transparent text-ink outline-none placeholder:text-ink-muted"
        />
      </label>
      <div ref={list} id={`${uid}-list`} role="listbox" className={cn("relative mt-nest overflow-auto", inline ? "min-h-0 flex-1" : "max-h-[min(360px,56dvh)]")}>
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
                  id={`${uid}-${c.id}`}
                  role="option"
                  aria-selected={i === active}
                  data-index={i}
                  onPointerMove={() => i !== active && setActive(i)}
                  onClick={() => run(c)}
                  className={cn("flex h-item cursor-pointer select-none items-center gap-2.5 rounded-control px-2.5 text-body", i === active && "bg-fill")}
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
    </div>
  );
}
