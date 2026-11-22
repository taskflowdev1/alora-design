import * as React from "react";
import { Popover as P } from "radix-ui";
import { Check, ChevronDown, Plus, Search } from "react-feather";
import { cn, prefersReducedMotion } from "@/lib/ad";
import { usePopupOpen, usePressOpen } from "@/lib/ad-hooks";
import { OptionList, dropdownSurface, optionClass, triggerClass, useListNav, type Option } from "@/components/ui/select";

export interface ComboboxProps {
  value: string | null;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  empty?: string;
  /** Offers to create what was typed when no option has that name. Add the option and return its value. */
  onCreate?: (label: string) => string | Promise<string>;
  /** The create row's text. */
  createLabel?: (label: string) => string;
  /** Show the field and list in place, at a fixed height, instead of in a dropdown. */
  inline?: boolean;
  /** Height of the inline list, in px. */
  listHeight?: number;
  className?: string;
  "aria-label"?: string;
}

const CREATE = "\u0000create";
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
/** How long the new name rests in the row it was created in before the full list returns around it. */
const SETTLE = 460;
const ROLL_CSS = `
@keyframes ad-cb-out { to { opacity: 0; transform: translateY(-70%); filter: blur(2px); } }
@keyframes ad-cb-in { from { opacity: 0; transform: translateY(70%); filter: blur(2px); } }`;

/** Text that rolls to its new value: only the part that changed moves. */
function RollText({ text }: { text: string }) {
  const [shown, setShown] = React.useState(text);
  const [from, setFrom] = React.useState<string | null>(null);
  if (text !== shown) {
    setShown(text);
    setFrom(shown);
  }
  if (from == null || from === text) return <span className="whitespace-pre">{text}</span>;
  const most = Math.min(from.length, text.length);
  let head = 0;
  while (head < most && from[head] === text[head]) head++;
  let tail = 0;
  while (tail < most - head && from[from.length - 1 - tail] === text[text.length - 1 - tail]) tail++;
  return (
    <span className="whitespace-pre">
      <span aria-hidden>{text.slice(0, head)}</span>
      <span aria-hidden className="relative inline-grid overflow-clip">
        <span key={text} style={{ animation: "ad-cb-in 240ms var(--ad-ease) both" }}>
          {text.slice(head, text.length - tail) || "​"}
        </span>
        <span key={from} className="absolute left-0 top-0" style={{ animation: "ad-cb-out 200ms var(--ad-ease) forwards" }} onAnimationEnd={() => setFrom(null)}>
          {from.slice(head, from.length - tail)}
        </span>
      </span>
      <span aria-hidden>{tail ? text.slice(-tail) : ""}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

/** A dropdown with a search field on top, for long lists. With `onCreate`, a name that isn't there can be added without leaving the field. */
export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = "Select",
  searchPlaceholder = "Search",
  empty = "No match",
  onCreate,
  createLabel = (label) => `Create "${label}"`,
  inline,
  listHeight = 216,
  className,
  ...aria
}: ComboboxProps) {
  const id = React.useId();
  const [query, setQuery] = React.useState("");
  const [creating, setCreating] = React.useState<string | null>(null);
  const listBox = React.useRef<HTMLDivElement>(null);
  const settle = React.useRef<{ value: string; top: number } | null>(null);
  const timer = React.useRef<number>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const typed = query.trim();
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);
  const canCreate = !!onCreate && !!typed && !options.some((o) => o.label.toLowerCase() === typed.toLowerCase());
  const rows = React.useMemo<Option[]>(
    () => (canCreate ? [...filtered, { value: CREATE, label: creating ?? createLabel(typed), icon: <Plus size={16} /> }] : filtered),
    // createLabel is usually an inline function; the row's text only depends on what was typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canCreate, filtered, creating, typed],
  );

  const create = async () => {
    if (!onCreate || creating != null) return;
    const label = typed;
    setCreating(label);
    let made: string;
    try {
      made = await onCreate(label);
    } catch {
      setCreating(null);
      return;
    }
    onValueChange(made);
    setCreating(null);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (!inline) return setOpen(false, true);
      const el = listBox.current?.querySelector<HTMLElement>(`[data-row="${CSS.escape(made)}"]`);
      settle.current = el ? { value: made, top: el.getBoundingClientRect().top } : null;
      setQuery("");
      nav.setActive(0);
    }, SETTLE);
  };
  const pick = (i: number) => {
    const o = rows[i];
    if (!o) return;
    if (o.value === CREATE) return void create();
    window.clearTimeout(timer.current);
    onValueChange(o.value);
    if (inline) setQuery("");
    else setOpen(false, true);
  };
  const nav = useListNav(rows, pick, Math.max(0, options.findIndex((x) => x.value === value)));
  const setActiveRow = nav.setActive;
  const [open, setOpen] = usePopupOpen({
    onOpenChange: (o) => {
      if (!o) return;
      setQuery("");
      nav.setActive(Math.max(0, options.findIndex((x) => x.value === value)));
    },
  });
  const press = usePressOpen(open, setOpen);
  const current = options.find((o) => o.value === value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // The full list comes back around the new row: it glides to its place, the others fade in.
  React.useLayoutEffect(() => {
    const s = settle.current;
    settle.current = null;
    const box = listBox.current;
    if (!s || !box) return;
    const el = box.querySelector<HTMLElement>(`[data-row="${CSS.escape(s.value)}"]`);
    if (!el) return;
    setActiveRow([...box.querySelectorAll("[data-row]")].indexOf(el));
    if (el.offsetTop < box.scrollTop) box.scrollTop = el.offsetTop;
    else if (el.offsetTop + el.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = el.offsetTop + el.offsetHeight - box.clientHeight;
    if (prefersReducedMotion()) return;
    const dy = s.top - el.getBoundingClientRect().top;
    box.querySelectorAll<HTMLElement>("[data-row]").forEach((r) => {
      if (r !== el) r.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: EASE });
    });
    if (Math.abs(dy) > 0.5) el.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 300, easing: EASE });
  }, [query, setActiveRow]);

  const style = onCreate ? (
    <style href="ad-combobox" precedence="default">
      {ROLL_CSS}
    </style>
  ) : null;
  const field = (
    <input
      ref={inputRef}
      role="combobox"
      aria-expanded
      aria-label={inline ? aria["aria-label"] : undefined}
      aria-controls={`${id}-list`}
      aria-activedescendant={rows.length ? `${id}-opt-${nav.active}` : undefined}
      value={query}
      placeholder={inline && current ? "" : searchPlaceholder}
      autoComplete="off"
      spellCheck={false}
      enterKeyHint="search"
      onChange={(e) => {
        // Typing during the pause after a create keeps what was typed.
        window.clearTimeout(timer.current);
        setQuery(e.target.value);
        nav.setActive(0);
      }}
      onKeyDown={(e) => {
        if (inline && e.key === "Escape" && query) {
          e.preventDefault();
          setQuery("");
          return;
        }
        nav.onKeyDown(e, false);
        if (inline && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End")) {
          requestAnimationFrame(() => {
            const box = listBox.current;
            const el = box?.querySelector<HTMLElement>('[data-active="true"]');
            if (!box || !el) return;
            if (el.offsetTop < box.scrollTop) box.scrollTop = el.offsetTop;
            else if (el.offsetTop + el.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = el.offsetTop + el.offsetHeight - box.clientHeight;
          });
        }
      }}
      className="h-full w-full min-w-0 bg-transparent text-body pointer-coarse:text-[16px] text-ink outline-none placeholder:text-ink-muted [&::-webkit-search-cancel-button]:hidden"
    />
  );

  if (inline) {
    return (
      <div className={cn("group/cb grid min-w-0 gap-1", className)}>
        {style}
        <label className="flex h-control min-w-0 cursor-text items-center gap-2 rounded-control bg-fill px-3 transition-colors duration-[220ms] ease-ad hover:bg-fill-strong focus-within:bg-fill-strong">
          <Search size={16} className="shrink-0 text-ink-muted" />
          <span className="relative flex h-full min-w-0 flex-1 items-center">
            {field}
            {!query && current ? (
              <span className="pointer-events-none absolute inset-y-0 left-0 flex max-w-full items-center truncate text-body leading-[normal] text-ink">
                <RollText text={current.label} />
              </span>
            ) : null}
          </span>
        </label>
        <div ref={listBox} id={`${id}-list`} role="listbox" aria-label={aria["aria-label"]} className="relative grid content-start gap-px overflow-y-auto" style={{ height: listHeight }}>
          {rows.length === 0 ? <div className="flex h-item items-center px-2.5 text-body text-ink-muted">{empty}</div> : null}
          {rows.map((o, i) => {
            const on = o.value === value;
            const isCreate = o.value === CREATE;
            return (
              <div
                key={isCreate ? CREATE : o.value}
                id={`${id}-opt-${i}`}
                role="option"
                data-row={o.value}
                data-active={i === nav.active}
                aria-selected={on}
                aria-disabled={o.disabled || undefined}
                className={cn(optionClass(false, o.disabled), "relative hover:bg-fill", (on || isCreate) && "bg-fill", i === nav.active && "group-focus-within/cb:bg-fill-strong")}
                onPointerMove={() => i !== nav.active && nav.setActive(i)}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => pick(i)}
              >
                {o.icon ? <span className="flex shrink-0 items-center text-ink-muted">{o.icon}</span> : null}
                <span className={cn("min-w-0 flex-1 truncate", isCreate && creating != null && "animate-ad-pulse")}>{isCreate ? <RollText text={o.label} /> : o.label}</span>
                <Check size={16} className={cn("shrink-0 text-ink transition-opacity duration-[220ms]", on ? "opacity-100" : "opacity-0")} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <P.Root open={open} onOpenChange={setOpen}>
      {style}
      <P.Trigger data-ad-anchor="" aria-haspopup="listbox" {...press} aria-label={aria["aria-label"]} className={cn(triggerClass, className)}>
        {current ? (
          <>
            {current.icon ? <span className="flex shrink-0 items-center text-ink-muted">{current.icon}</span> : null}
            <span className="min-w-0 truncate">{current.label}</span>
          </>
        ) : (
          <span className="truncate text-ink-muted">{placeholder}</span>
        )}
        <ChevronDown size={16} className="ml-auto shrink-0 text-ink-muted" />
      </P.Trigger>
      <P.Portal>
        <P.Content
          align="start"
          sideOffset={6}
          collisionPadding={8}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            // Desktop only: on a phone the keyboard would cover the list (tap the field to type).
            if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
          }}
          className={cn(dropdownSurface, "w-[max(240px,var(--radix-popover-trigger-width))]")}
        >
          <label className="mb-1 flex h-item items-center gap-2 rounded-control bg-fill px-2.5 focus-within:bg-fill-strong">
            <Search size={16} className="shrink-0 text-ink-muted" />
            {field}
          </label>
          <div className="max-h-[min(280px,calc(var(--radix-popover-content-available-height)-48px))] overflow-auto">
            <OptionList
              id={id}
              options={rows}
              active={nav.active}
              setActive={nav.setActive}
              isSelected={(v) => v === value}
              onPick={pick}
              empty={empty}
            />
          </div>
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}
