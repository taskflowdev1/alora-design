import * as React from "react";
import { Check, Edit2 } from "react-feather";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/ad";

export interface InlineEditProps {
  /** The stored value, unformatted ("99000"). */
  value: string;
  /** Gets the parsed value. Called only when it changed and `validate` passed. */
  onSave: (value: string) => void;
  /** Shown before and after the value in both states, never part of the editable text ("Rp", "pcs"). */
  prefix?: string;
  suffix?: string;
  /** Stored value to text ("99000" to "99.000"). Applied at rest and live while typing, caret kept on its digit. */
  format?: (value: string) => string;
  /** Typed text back to a stored value ("99.000" to "99000"). Must only remove characters (separators, spaces). */
  parse?: (text: string) => string;
  /** Return an error message to refuse the value. Checked on save; while the error shows, re-checked as you type. */
  validate?: (value: string) => string | null;
  align?: "left" | "right";
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  className?: string;
  "aria-label"?: string;
}

/** Whole numbers with dot thousands ("99000" ⇄ "99.000"). Spread it: `<InlineEdit prefix="Rp" {...grouped} />`. */
export const grouped = {
  format: (v: string) => (/^\d+$/.test(v) ? v.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : v),
  parse: (t: string) => t.replace(/[.\s]/g, ""),
};

const same = (v: string) => v;

/** Where in `text` (a text node inside `el`) the point falls, or null when it misses the text. */
function caretAt(el: HTMLElement, x: number, y: number): number | null {
  const d = document as Document & { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null };
  let node: Node | null = null;
  let offset = 0;
  if (d.caretPositionFromPoint) {
    const p = d.caretPositionFromPoint(x, y);
    if (p) {
      node = p.offsetNode;
      offset = p.offset;
    }
  } else if (d.caretRangeFromPoint) {
    const r = d.caretRangeFromPoint(x, y);
    if (r) {
      node = r.startContainer;
      offset = r.startOffset;
    }
  }
  return node && node.nodeType === Node.TEXT_NODE && el.contains(node) ? offset : null;
}

/**
 * A table cell you edit in place, the spreadsheet way. Click puts the caret where you clicked; the editing box is the
 * resting box (same size, same text position, same right edge), so nothing in the row moves. The prefix stays fixed
 * and `format` regroups the digits as you type. Enter saves, Tab saves and edits the next cell (Shift+Tab the one
 * before), Esc reverts, leaving the cell saves. A refused value shows a soft danger fill and its message; a saved
 * one shows a quiet check where the pencil sits.
 */
export function InlineEdit({
  value,
  onSave,
  prefix,
  suffix,
  format: formatProp,
  parse: parseProp,
  validate,
  align = "left",
  inputMode,
  className,
  ...aria
}: InlineEditProps) {
  const format = formatProp ?? same;
  const parse = parseProp ?? same;
  const [draft, setDraft] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  const rest = React.useRef<HTMLButtonElement>(null);
  const caret = React.useRef<number | null>(null);
  const editing = React.useRef(false);
  const refocus = React.useRef(false);
  const editingNow = draft != null;

  // Caret after mount (where you clicked, or the end) and after each live reformat.
  React.useLayoutEffect(() => {
    const el = input.current;
    if (!el || caret.current == null) return;
    if (document.activeElement !== el) el.focus({ preventScroll: true });
    el.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  }, [draft]);
  React.useLayoutEffect(() => {
    if (!editingNow && refocus.current) rest.current?.focus({ preventScroll: true });
    refocus.current = false;
  }, [editingNow]);
  React.useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 1400);
    return () => clearTimeout(t);
  }, [saved]);

  const start = (at: number | null) => {
    const text = format(value);
    caret.current = at == null ? text.length : Math.min(at, text.length);
    editing.current = true;
    setSaved(false);
    setDraft(text);
  };
  const stop = (focusCell: boolean) => {
    editing.current = false;
    refocus.current = focusCell;
    setDraft(null);
    setError(null);
  };
  /** Validates and saves. False when refused (the cell stays open with its message). */
  const commit = (focusCell: boolean) => {
    if (!editing.current || draft == null) return true;
    const next = parse(draft).trim();
    const err = validate?.(next) ?? null;
    if (err) {
      setError(err);
      return false;
    }
    if (next !== value) {
      onSave(next);
      setSaved(true);
    }
    stop(focusCell);
    return true;
  };
  const change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    const at = e.target.selectionStart ?? text.length;
    const raw = parse(text);
    const shown = format(raw);
    if (shown !== text && parse(shown) === raw) {
      // Keep the caret after the same number of value characters it was after.
      const keep = parse(text.slice(0, at)).length;
      let pos = 0;
      while (pos < shown.length && parse(shown.slice(0, pos)).length < keep) pos++;
      caret.current = pos;
      setDraft(shown);
    } else setDraft(text);
    if (error) setError(validate?.(raw.trim()) ?? null);
  };
  const neighbour = (from: HTMLElement, step: 1 | -1) => {
    const scope = from.closest("table") ?? document;
    const all = [...scope.querySelectorAll<HTMLElement>("[data-inline-edit]")];
    return all[all.indexOf(from) + step] ?? null;
  };

  const right = align === "right";
  const box = cn(
    "-mx-2 flex h-item w-[calc(100%+1rem)] min-w-0 items-center gap-1.5 rounded-control px-2 text-body tabular-nums transition-colors duration-[160ms]",
    right && "flex-row-reverse",
    className,
  );
  const text = editingNow ? draft : format(value);
  const affix = (s: string, side: "pre" | "post") => (
    <span className={cn("shrink-0 whitespace-pre transition-colors duration-[160ms]", editingNow ? "text-ink-muted" : "text-ink")}>
      {side === "pre" ? `${s}\u00a0` : `\u00a0${s}`}
    </span>
  );
  const body = (
    <>
      <span className={cn("flex min-w-0 flex-1 items-baseline whitespace-nowrap", right && "justify-end")}>
        {prefix ? affix(prefix, "pre") : null}
        {/* The hidden value sizes the slot and the input lies over it, out of flow: an input's own intrinsic width
            (about 20 characters) would otherwise widen the slot and push its left-aligned text away from the right edge. */}
        <span className="relative min-w-0">
          <span data-value className={cn("block overflow-hidden text-ink", editingNow && "invisible")}>
            {text || "\u200b"}
          </span>
          {editingNow ? (
            <input
              ref={input}
              value={draft}
              inputMode={inputMode}
              enterKeyHint="done"
              autoComplete="off"
              spellCheck={false}
              aria-label={aria["aria-label"]}
              aria-invalid={!!error || undefined}
              onChange={change}
              onBlur={() => commit(false)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") {
                  e.preventDefault();
                  commit(true);
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  stop(true);
                } else if (e.key === "Tab") {
                  e.preventDefault();
                  const root = e.currentTarget.closest<HTMLElement>("[data-inline-edit]");
                  const next = root && neighbour(root, e.shiftKey ? -1 : 1);
                  if (commit(!next) && next) next.click();
                }
              }}
              // 4 px wider than the text so the caret at the end never scrolls the text sideways.
              className="absolute left-0 top-0 m-0 h-full w-[calc(100%+4px)] min-w-px border-0 bg-transparent p-0 text-left tabular-nums text-ink caret-ink outline-none selection:bg-[color-mix(in_oklch,var(--ad-brand)_32%,transparent)] selection:text-ink"
            />
          ) : null}
        </span>
        {suffix ? affix(suffix, "post") : null}
      </span>
      {/* One reserved slot: pencil on hover, a check for a moment after a save, empty while editing. */}
      <span className="relative grid size-[14px] shrink-0 place-items-center" aria-hidden>
        <Edit2
          size={14}
          className={cn(
            "absolute text-ink-muted opacity-0 transition-opacity duration-[160ms]",
            !editingNow && !saved && "group-hover:opacity-100 group-focus-visible:opacity-100",
          )}
        />
        <Check
          size={14}
          className={cn(
            "absolute text-success transition-[opacity,scale,filter] duration-[160ms] ease-ad motion-reduce:transition-opacity",
            saved && !editingNow ? "scale-100 opacity-100 blur-[0px]" : "scale-75 opacity-0 blur-[2px] motion-reduce:scale-100 motion-reduce:blur-[0px]",
          )}
        />
      </span>
    </>
  );

  if (editingNow) {
    return (
      <Tooltip content={error} open={!!error}>
        <span
          data-inline-edit
          data-editing=""
          // A press on the prefix, suffix or padding keeps (or puts) the caret in the input instead of closing it.
          onMouseDown={(e) => {
            if (e.target === input.current) return;
            e.preventDefault();
            input.current?.focus({ preventScroll: true });
          }}
          onClick={(e) => e.stopPropagation()}
          className={cn(box, "cursor-text", error ? "bg-danger-soft" : "bg-fill-strong")}
        >
          {body}
        </span>
      </Tooltip>
    );
  }
  return (
    <button
      ref={rest}
      type="button"
      data-inline-edit
      aria-label={aria["aria-label"] ? `Edit ${aria["aria-label"]}` : "Edit"}
      onClick={(e) => {
        e.stopPropagation();
        if (e.detail === 0) return start(null);
        const val = e.currentTarget.querySelector<HTMLElement>("[data-value]");
        const at = val ? caretAt(val, e.clientX, e.clientY) : null;
        start(at ?? (val && e.clientX < val.getBoundingClientRect().left ? 0 : null));
      }}
      className={cn(box, "group cursor-text hover:bg-fill focus-visible:bg-fill")}
    >
      {body}
    </button>
  );
}
