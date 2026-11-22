import * as React from "react";
import { Search as SearchIcon, X } from "react-feather";
import { cn, fieldChipClass, prefersReducedMotion } from "@/lib/ad";
import { useEdgeFade } from "@/lib/ad-hooks";
import { optionClass } from "@/components/ui/select";

export type FilterField = { key: string; label: string; values: { value: string; label: string }[] };
export type FilterToken = { field: string; value: string };

export interface FilterSearchProps {
  fields: FilterField[];
  tokens: FilterToken[];
  onTokensChange: (tokens: FilterToken[]) => void;
  query: string;
  onQueryChange: (query: string) => void;
  placeholder?: string;
  /** Height of the list under the field, in px: suggestions and results share it, so nothing moves. */
  listHeight?: number;
  /** The results. */
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
type Row = { kind: "field"; field: FilterField } | { kind: "value"; field: FilterField; value: string; label: string };

/**
 * Search with filter tokens, the way issue trackers do it. Type `status:` and the list offers its values; picking one
 * turns the text into a chip in the field. Backspace on an empty field selects the last chip, a second press removes it.
 */
export function FilterSearch({ fields, tokens, onTokensChange, query, onQueryChange, placeholder = "Search or filter", listHeight = 240, children, className, ...aria }: FilterSearchProps) {
  const id = React.useId();
  const input = React.useRef<HTMLInputElement>(null);
  const strip = React.useRef<HTMLDivElement>(null);
  const before = React.useRef<Map<string, number> | null>(null);
  const added = React.useRef<string | null>(null);
  const [active, setActive] = React.useState(-1);
  const [armed, setArmed] = React.useState(false);
  useEdgeFade(strip, { axis: "x", size: 12 });

  const q = query.trim().toLowerCase();
  const typedField = /^([a-z]+):(.*)$/i.exec(query.trimStart());
  const field = typedField ? fields.find((f) => f.key === typedField[1].toLowerCase()) : undefined;
  const rows: Row[] = field
    ? field.values
        .filter((v) => !tokens.some((t) => t.field === field.key && t.value === v.value) && v.label.toLowerCase().includes((typedField?.[2] ?? "").trim().toLowerCase()))
        .map((v) => ({ kind: "value", field, value: v.value, label: v.label }))
    : q && !q.includes(":")
      ? fields.filter((f) => f.key.startsWith(q) || f.label.toLowerCase().startsWith(q)).map((f) => ({ kind: "field", field: f }))
      : [];
  const shownActive = field ? Math.min(Math.max(active, 0), rows.length - 1) : active < rows.length ? active : -1;

  const tokenKey = (t: FilterToken) => `${t.field}:${t.value}`;
  const snapshot = () => {
    const m = new Map<string, number>();
    strip.current?.querySelectorAll<HTMLElement>("[data-flip]").forEach((el) => m.set(el.dataset.flip!, el.getBoundingClientRect().left));
    before.current = m;
  };
  React.useLayoutEffect(() => {
    const was = before.current;
    before.current = null;
    const box = strip.current;
    const fresh = added.current;
    added.current = null;
    if (!box) return;
    if (fresh) box.scrollLeft = box.scrollWidth;
    // The edge fade re-measures on scroll; a removed chip can change the overflow without one.
    box.dispatchEvent(new Event("scroll"));
    if (prefersReducedMotion()) return;
    box.querySelectorAll<HTMLElement>("[data-flip]").forEach((el) => {
      const key = el.dataset.flip!;
      if (key === fresh) {
        el.animate([{ opacity: 0, transform: "scale(0.94)", filter: "blur(2px)" }, { opacity: 1, transform: "none", filter: "blur(0px)" }], { duration: 200, easing: EASE });
        return;
      }
      const from = was?.get(key);
      const dx = from == null ? 0 : from - el.getBoundingClientRect().left;
      if (Math.abs(dx) > 0.5) el.animate([{ transform: `translateX(${dx}px)` }, { transform: "none" }], { duration: 220, easing: EASE });
    });
  }, [tokens]);

  const remove = (t: FilterToken) => {
    snapshot();
    setArmed(false);
    onTokensChange(tokens.filter((x) => tokenKey(x) !== tokenKey(t)));
    input.current?.focus();
  };
  const choose = (row: Row) => {
    if (row.kind === "field") {
      onQueryChange(`${row.field.key}:`);
      setActive(0);
    } else {
      const t = { field: row.field.key, value: row.value };
      snapshot();
      added.current = tokenKey(t);
      onTokensChange([...tokens, t]);
      onQueryChange("");
      setActive(-1);
    }
    input.current?.focus();
  };
  const labelOf = (t: FilterToken) => {
    const f = fields.find((x) => x.key === t.field);
    return { field: f?.label ?? t.field, value: f?.values.find((v) => v.value === t.value)?.label ?? t.value };
  };

  return (
    <div className={cn("grid min-w-0 gap-1", className)}>
      <div
        onMouseDown={(e) => {
          if (e.target !== input.current) {
            e.preventDefault();
            input.current?.focus();
          }
        }}
        className="flex h-control min-w-0 cursor-text items-center gap-2 rounded-control bg-fill pl-3 pr-1.5 transition-colors duration-[220ms] ease-ad hover:bg-fill-strong focus-within:bg-fill-strong"
      >
        <SearchIcon size={16} className="shrink-0 text-ink-muted" />
        <div ref={strip} className="flex h-full min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tokens.map((t, i) => {
            const l = labelOf(t);
            return (
              <span key={tokenKey(t)} data-flip={tokenKey(t)} data-armed={armed && i === tokens.length - 1 ? "" : undefined} className={cn(fieldChipClass, "shrink-0 whitespace-nowrap", armed && i === tokens.length - 1 && "bg-on text-on-ink shadow-none")}>
                {/* On a phone, two or more chips show just their values, so the field never has to scroll to fit them. */}
                <span className={cn(armed && i === tokens.length - 1 ? "opacity-70" : "text-ink-muted", tokens.length > 1 && "max-sm:hidden")}>{l.field}</span>
                <span>{l.value}</span>
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={`Remove ${l.field} ${l.value}`}
                  onClick={() => remove(t)}
                  className={cn(
                    "relative grid size-[18px] cursor-pointer place-items-center rounded-small ad-press after:absolute after:-inset-[3px] active:scale-[0.97]",
                    armed && i === tokens.length - 1 ? "text-on-ink" : "text-ink-muted hover:bg-fill hover:text-ink",
                  )}
                >
                  <X size={14} />
                </button>
              </span>
            );
          })}
          <input
            ref={input}
            data-flip="input"
            role="combobox"
            aria-label={aria["aria-label"] ?? "Search"}
            aria-expanded={rows.length > 0}
            aria-controls={`${id}-list`}
            aria-activedescendant={shownActive >= 0 ? `${id}-row-${shownActive}` : undefined}
            value={query}
            placeholder={tokens.length ? "" : placeholder}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            onChange={(e) => {
              setArmed(false);
              setActive(-1);
              onQueryChange(e.target.value);
            }}
            onBlur={() => setArmed(false)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !query && tokens.length) {
                e.preventDefault();
                if (armed) remove(tokens[tokens.length - 1]);
                else setArmed(true);
                return;
              }
              if (armed && e.key !== "Shift") setArmed(false);
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                if (!rows.length) return;
                e.preventDefault();
                const step = e.key === "ArrowDown" ? 1 : -1;
                setActive(((shownActive < 0 && step < 0 ? 0 : shownActive) + step + rows.length) % rows.length);
              } else if ((e.key === "Enter" || e.key === "Tab") && shownActive >= 0 && rows[shownActive]) {
                e.preventDefault();
                choose(rows[shownActive]);
              } else if (e.key === "Escape" && query) {
                e.preventDefault();
                onQueryChange("");
              }
            }}
            className="h-full min-w-12 flex-1 bg-transparent text-body pointer-coarse:text-[16px] text-ink outline-none placeholder:text-ink-muted"
          />
        </div>
        <button
          type="button"
          aria-label="Clear search"
          tabIndex={query || tokens.length ? 0 : -1}
          onClick={() => {
            snapshot();
            onTokensChange([]);
            onQueryChange("");
            input.current?.focus();
          }}
          className={cn(
            "relative grid size-[20px] shrink-0 cursor-pointer place-items-center rounded-item text-ink-muted transition-[opacity,background-color,scale] duration-[150ms] ease-ad after:absolute after:-inset-[2px] hover:bg-fill-strong focus-visible:bg-fill-strong active:scale-[0.97]",
            query || tokens.length ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <X size={14} />
        </button>
      </div>
      <div className="grid content-start gap-px overflow-y-auto" style={{ height: listHeight }}>
        <div id={`${id}-list`} role="listbox" aria-label="Suggestions" className={cn("grid gap-px", !rows.length && "hidden")}>
          {rows.map((r, i) => (
            <div
              key={r.kind === "field" ? r.field.key : r.value}
              id={`${id}-row-${i}`}
              role="option"
              aria-selected={i === shownActive}
              className={optionClass(i === shownActive)}
              onPointerMove={() => i !== active && setActive(i)}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => choose(r)}
            >
              {r.kind === "field" ? (
                <>
                  <span className="shrink-0">{r.field.key}:</span>
                  <span className="min-w-0 truncate text-ink-muted">{r.field.values.map((v) => v.label).join(", ")}</span>
                </>
              ) : (
                <>
                  <span className="shrink-0 text-ink-muted">{r.field.label}</span>
                  <span className="min-w-0 truncate">{r.label}</span>
                </>
              )}
            </div>
          ))}
        </div>
        {field ? (rows.length ? null : <div className="flex h-item items-center px-2.5 text-body text-ink-muted">No match</div>) : children}
      </div>
    </div>
  );
}
