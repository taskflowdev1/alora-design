import * as React from "react";
import { cn } from "@/lib/ad";
import { Tooltip } from "@/components/ui/tooltip";

export interface AssistantMarkdownProps {
  /** The reply: paragraphs, `- ` and `1. ` lists, pipe tables, **bold**, `code`, and [1] citations. */
  text: string;
  /** Words shown so far while the reply streams. Leave out for the whole text. */
  reveal?: number;
  /** The name of citation n (1-based), shown on hover. */
  citeTitle?: (n: number) => string | undefined;
  onCite?: (n: number) => void;
  className?: string;
}

type Inline = { t: "text"; v: string } | { t: "bold"; v: string } | { t: "code"; v: string } | { t: "cite"; n: number };
type Block = { k: "p"; inl: Inline[] } | { k: "ul" | "ol"; items: Inline[][] } | { k: "table"; head: Inline[][]; rows: Inline[][][]; right: boolean[] };

const INLINE = /\*\*(.+?)\*\*|`([^`]+)`|\[(\d+)\]/g;

function inline(s: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of s.matchAll(INLINE)) {
    if (m.index > last) out.push({ t: "text", v: s.slice(last, m.index) });
    if (m[1] != null) out.push({ t: "bold", v: m[1] });
    else if (m[2] != null) out.push({ t: "code", v: m[2] });
    else out.push({ t: "cite", n: Number(m[3]) });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ t: "text", v: s.slice(last) });
  return out;
}

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
const NUMERIC = /^(Rp\s?)?[\d.,]+(\s?(%|jt|pcs))?$/;

/** Splits the reply into blocks once, so a streaming reply only changes how many words show. */
function parse(text: string): Block[] {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  for (let i = 0; i < lines.length; ) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
    } else if (line.trim().startsWith("|") && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1] ?? "")) {
      const head = cells(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(cells(lines[i++]));
      blocks.push({
        k: "table",
        head: head.map(inline),
        rows: rows.map((r) => r.map(inline)),
        right: head.map((_, c) => rows.length > 0 && rows.every((r) => NUMERIC.test(r[c] ?? ""))),
      });
    } else if (/^\s*[-*]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const ordered = /^\s*\d/.test(line);
      const marker = ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*]\s+/;
      const items: Inline[][] = [];
      while (i < lines.length && marker.test(lines[i])) items.push(inline(lines[i++].replace(marker, "")));
      blocks.push({ k: ordered ? "ol" : "ul", items });
    } else {
      const para: string[] = [];
      while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith("|") && !/^\s*([-*]|\d+[.)])\s+/.test(lines[i])) para.push(lines[i++]);
      blocks.push({ k: "p", inl: inline(para.join(" ")) });
    }
  }
  return blocks;
}

const CSS = `
.ad-md-word { animation: ad-md-in 220ms var(--ad-ease) both; }
@keyframes ad-md-in { from { opacity: 0; filter: blur(2px); } }
@media (prefers-reduced-motion: reduce) { .ad-md-word { animation: none; } }`;

/** How many words are left to draw, shared by the walk through the blocks. */
interface Walk {
  left: number;
  streaming: boolean;
  key: number;
  citeTitle?: (n: number) => string | undefined;
  onCite?: (n: number) => void;
}

/** One run of text: words until the reveal runs out. "Rp" before a number is the small muted unit, kept with it. */
function words(v: string, w: Walk) {
  const out: React.ReactNode[] = [];
  let plain = "";
  const flush = () => {
    if (plain) out.push(plain);
    plain = "";
  };
  const parts = v.split(/(\s+)/).filter(Boolean);
  parts.forEach((p, i) => {
    if (w.left <= 0) return;
    if (/^\s+$/.test(p)) {
      plain += parts[i - 1] === "Rp" ? " " : p;
      return;
    }
    w.left--;
    const unit = p === "Rp" && /^\d/.test(parts[i + 2] ?? "");
    if (unit || w.streaming) {
      flush();
      out.push(
        <span key={w.key++} className={cn(unit && "text-small text-ink-muted", w.streaming && "ad-md-word")}>
          {p}
        </span>,
      );
    } else plain += p;
  });
  flush();
  return out;
}

function Inlines({ list, w }: { list: Inline[]; w: Walk }) {
  return (
    <>
      {list.map((n, i) => {
        if (w.left <= 0) return null;
        if (n.t === "text") return <React.Fragment key={i}>{words(n.v, w)}</React.Fragment>;
        if (n.t === "bold")
          return (
            <strong key={i} className="font-semibold text-ink">
              {words(n.v, w)}
            </strong>
          );
        if (n.t === "code") {
          w.left--;
          return (
            <code key={i} className="rounded-small bg-fill px-1 py-px font-mono text-small">
              {n.v}
            </code>
          );
        }
        w.left--;
        const title = w.citeTitle?.(n.n);
        const mark = (
          <button
            type="button"
            aria-label={title ? `Source ${n.n}: ${title}` : `Source ${n.n}`}
            onClick={() => w.onCite?.(n.n)}
            className={cn(
              "ad-press relative top-[-0.15em] ms-0.5 inline-grid h-4 min-w-4 cursor-pointer place-items-center rounded-full bg-fill px-1 align-baseline text-[11px] font-medium leading-none text-ink-muted tabular-nums hover:bg-fill-strong hover:text-ink focus-visible:bg-fill-strong focus-visible:text-ink active:scale-[0.97]",
              w.streaming && "ad-md-word",
            )}
          >
            {n.n}
          </button>
        );
        return title ? (
          <Tooltip key={i} content={title}>
            {mark}
          </Tooltip>
        ) : (
          <React.Fragment key={i}>{mark}</React.Fragment>
        );
      })}
    </>
  );
}

/**
 * An agent's reply: short markdown with citations. While it streams, pass `reveal` and each new word fades in; the text
 * is parsed once, so half-written bold or a half-written table never flashes. Tables right-align their number columns.
 */
export function AssistantMarkdown({ text, reveal, citeTitle, onCite, className }: AssistantMarkdownProps) {
  const blocks = React.useMemo(() => parse(text), [text]);
  const w: Walk = { left: reveal ?? Infinity, streaming: reveal !== undefined, key: 0, citeTitle, onCite };
  return (
    <div className={cn("grid min-w-0 gap-2.5 text-body leading-relaxed text-ink [overflow-wrap:anywhere]", className)}>
      <style href="ad-assistant-markdown" precedence="default">
        {CSS}
      </style>
      {blocks.map((b, i) => {
        if (w.left <= 0) return null;
        if (b.k === "p")
          return (
            <p key={i} className="m-0 text-pretty">
              <Inlines list={b.inl} w={w} />
            </p>
          );
        if (b.k === "table")
          return (
            <div key={i} data-scroll className="max-w-full overflow-x-auto overscroll-x-contain rounded-item bg-fill p-1">
              <table className="w-full border-collapse text-body tabular-nums">
                <thead>
                  <tr>
                    {b.head.map((c, j) => (
                      <th key={j} scope="col" className={cn("whitespace-nowrap px-2 py-1 font-normal text-ink-muted", b.right[j] ? "text-right" : "text-left")}>
                        <Inlines list={c} w={{ ...w, left: Infinity, streaming: false }} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.rows.map((r, ri) =>
                    w.left <= 0 ? null : (
                      <tr key={ri}>
                        {r.map((c, j) => (
                          <td key={j} data-numeric={b.right[j] ? "" : undefined} className={cn("whitespace-nowrap px-2 py-1", b.right[j] ? "text-right" : "text-left")}>
                            <Inlines list={c} w={w} />
                          </td>
                        ))}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          );
        const List = b.k;
        return (
          <List key={i} className={cn("m-0 grid gap-1 ps-5", b.k === "ul" ? "list-disc" : "list-decimal")}>
            {b.items.map((it, j) =>
              w.left <= 0 ? null : (
                <li key={j} className="ps-0.5 marker:text-ink-muted">
                  <Inlines list={it} w={w} />
                </li>
              ),
            )}
          </List>
        );
      })}
    </div>
  );
}
