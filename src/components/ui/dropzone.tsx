import * as React from "react";
import { File, UploadCloud, X } from "react-feather";
import { cn, formatNumber, prefersReducedMotion } from "@/lib/ad";
import { useDoubleTapGuard } from "@/lib/ad-hooks";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";

export interface DropFile {
  id: string;
  name: string;
  size: number;
  /** 0–100 while uploading; undefined when done. */
  progress?: number;
  /** A preview image: the row shows it as a thumbnail, and it flies from the drop area into the row. */
  thumb?: string;
  /** Why the upload stopped. The row says so and offers Retry in place (with `onRetry`). */
  error?: string;
}

export interface DropzoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  files?: DropFile[];
  onRemove?: (id: string) => void;
  /** Start a failed upload again; shows Retry on a row with an `error`. */
  onRetry?: (id: string) => void;
  /** What to drop, e.g. "Drop product photos". */
  title?: string;
  className?: string;
  /** On the file list, e.g. a fixed height so a new row never moves what is below. */
  listClassName?: string;
}

const CSS = `@keyframes ad-drop-roll { from { opacity: 0; transform: translateY(0.6em); } }
.ad-drop-ch { display: inline-block; animation: ad-drop-roll 180ms var(--ad-ease); }
@media (prefers-reduced-motion: reduce) { .ad-drop-ch { animation: none; } }`;

/** A figure whose changed characters roll up into place. Keyed from the right, so the units stay put as it grows. */
function Roll({ text }: { text: string }) {
  const chars = [...text];
  return (
    <span className="inline-flex overflow-hidden whitespace-pre">
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-flex">
        {chars.map((c, i) => (
          <span key={`${chars.length - i}-${c}`} className="ad-drop-ch">
            {c}
          </span>
        ))}
      </span>
    </span>
  );
}

// A no-break space keeps the number and its unit together.
const kb = (n: number) => (n >= 1e6 ? `${formatNumber(n / 1e6, { maximumFractionDigits: 1 })}\u00a0MB` : `${Math.max(1, Math.round(n / 1e3))}\u00a0KB`);

/**
 * A file name that truncates in the middle: "restock…dago.csv". The kept tail is the extension plus the last word
 * before it (3 to 8 characters), so the cut falls between words; without a separator it keeps 6 characters.
 */
function FileName({ name, className }: { name: string; className?: string }) {
  const dot = name.lastIndexOf(".");
  const sep = dot > 0 ? Math.max(...["-", "_", " ", "."].map((c) => name.lastIndexOf(c, dot - 1))) : -1;
  const word = dot - sep - 1;
  const cut = dot <= 0 ? name.length : sep >= 0 && word >= 3 && word <= 8 ? sep + 1 : Math.max(0, dot - 6);
  return (
    <span className={cn("flex min-w-0", className)}>
      <span className="min-w-[3ch] truncate">{name.slice(0, cut)}</span>
      <span className="shrink-0 whitespace-nowrap">{name.slice(cut)}</span>
    </span>
  );
}

const FLY_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Everything a row needs to fly in from the drop area, once per file. */
interface FlyContext {
  area: React.RefObject<HTMLElement | null>;
  layer: React.RefObject<HTMLDivElement | null>;
  known: React.RefObject<Set<string>>;
  ready: React.RefObject<boolean>;
}

/**
 * One file. While it uploads the row itself is the progress: a fill sweeps across behind the name, with the bytes and
 * percent rolling. At 100 the fill finishes and melts away, leaving the plain row: that is the done state.
 */
function FileRow({ f, leaving, fly, onRemove, onRetry }: { f: DropFile; leaving?: boolean; fly: FlyContext; onRemove?: (id: string) => void; onRetry?: (id: string) => void }) {
  const wrap = React.useRef<HTMLLIElement>(null);
  const thumb = React.useRef<HTMLSpanElement>(null);
  const uploading = f.progress != null;
  const [run, setRun] = React.useState({ uploading, finishing: false });
  // Derived during render: the moment an upload ends cleanly, the fill plays out instead of vanishing.
  if (run.uploading !== uploading) setRun({ uploading, finishing: !uploading && !f.error });
  const { finishing } = run;
  React.useEffect(() => {
    if (!finishing) return;
    const t = window.setTimeout(() => setRun((r) => ({ ...r, finishing: false })), 560);
    return () => window.clearTimeout(t);
  }, [finishing]);

  // A new file starts big over the drop area and shrinks into its row's thumbnail while the row opens under it.
  React.useLayoutEffect(() => {
    const { area, layer, known, ready } = fly;
    if (known.current.has(f.id)) return;
    known.current.add(f.id);
    const row = wrap.current;
    const t = thumb.current;
    if (!ready.current || !row || !t || !area.current || !layer.current || prefersReducedMotion()) return;
    const tr = t.getBoundingClientRect();
    const ar = area.current.getBoundingClientRect();
    const lr = layer.current.getBoundingClientRect();
    const ghost = t.cloneNode(true) as HTMLElement;
    Object.assign(ghost.style, { position: "absolute", left: `${tr.left - lr.left}px`, top: `${tr.top - lr.top}px`, width: `${tr.width}px`, height: `${tr.height}px`, margin: "0" });
    layer.current.append(ghost);
    t.style.opacity = "0";
    const from = `translate(${ar.left + ar.width / 2 - tr.left - tr.width / 2}px, ${ar.top + ar.height / 2 - tr.top - tr.height / 2}px) scale(${Math.min(2.6, Math.max(1.4, (ar.height * 0.55) / tr.height)).toFixed(2)})`;
    const flight = ghost.animate(
      [
        { transform: from, opacity: 0 },
        { transform: from, opacity: 1, offset: 0.16 },
        { transform: "none", opacity: 1 },
      ],
      { duration: 480, easing: FLY_EASE },
    );
    const land = () => {
      ghost.remove();
      t.style.opacity = "";
    };
    flight.onfinish = land;
    flight.oncancel = land;
    row.animate([{ gridTemplateRows: "0fr", opacity: 0 }, { gridTemplateRows: "1fr", opacity: 1 }], { duration: 280, easing: FLY_EASE });
    // No cleanup on purpose: Strict Mode's replayed effect would cancel the flight; it removes itself when it lands.
  }, [f.id, fly]);

  const pct = Math.round(f.progress ?? 100);
  const sent = uploading ? (f.size * (f.progress ?? 0)) / 100 : f.size;
  const showPct = uploading || finishing;
  return (
    <li ref={wrap} data-file={f.id} className={cn("grid transition-[grid-template-rows,opacity] duration-[220ms] ease-ad", leaving ? "pointer-events-none grid-rows-[0fr] opacity-0" : "grid-rows-[1fr]")}>
      <div className="min-h-0 overflow-hidden">
        <div className="pb-2">
          <div className={cn("relative isolate flex min-h-[calc(var(--ad-control-h)+var(--ad-nest)*2)] items-center gap-3 overflow-hidden rounded-item bg-fill pr-1.5", f.thumb ? "p-nest" : "py-1.5 pl-3")}>
            {showPct ? (
              <Progress
                value={uploading ? pct : 100}
                aria-label={`Uploading ${f.name}`}
                className={cn(
                  "absolute inset-0 -z-10 h-full rounded-none bg-transparent transition-opacity duration-[280ms] ease-ad [&>div]:rounded-none [&>div]:bg-fill-strong",
                  finishing && "opacity-0 delay-[220ms]",
                )}
              />
            ) : null}
            {f.thumb ? (
              <span ref={thumb} className="block size-control shrink-0 overflow-hidden rounded-[max(2px,calc(var(--ad-radius-item)-var(--ad-nest)))] bg-fill-strong">
                <img src={f.thumb} alt="" draggable={false} className="size-full object-cover" />
              </span>
            ) : (
              <span ref={thumb} className="grid shrink-0 place-items-center text-ink-muted">
                <File size={16} />
              </span>
            )}
            <div className={cn("min-w-0 flex-1 text-body", f.error ? "grid" : "flex items-baseline gap-2")}>
              <FileName name={f.name} className="flex-1" />
              {f.error ? (
                <span className="truncate animate-[ad-fade-in_200ms_var(--ad-ease)] text-small text-danger">{f.error}</span>
              ) : (
                <span className="flex shrink-0 items-baseline text-small tabular-nums text-ink-muted">
                  <Roll text={kb(sent)} />
                  {/* Its width closes when the upload ends, so the size glides over to the row's edge. */}
                  <span className={cn("overflow-hidden text-right text-ink transition-[width,opacity] duration-[240ms] ease-ad", showPct && !finishing ? "w-[calc(4ch+var(--ad-gap))] opacity-100" : "w-0 opacity-0")}>
                    <Roll text={`${pct}%`} />
                  </span>
                </span>
              )}
            </div>
            {f.error && onRetry ? (
              <Button variant="secondary" size="sm" className="shrink-0 animate-[ad-fade-in_200ms_var(--ad-ease)] bg-fill-strong" onClick={() => onRetry(f.id)}>
                Retry
              </Button>
            ) : null}
            {onRemove ? (
              <Tooltip content="Remove">
                <Button variant="ghost" size="sm" icon aria-label={`Remove ${f.name}`} onClick={() => onRemove(f.id)}>
                  <X />
                </Button>
              </Tooltip>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * A soft area, no dashed border. The whole area opens the file picker and deepens on hover; dragging over it deepens
 * the fill too. Browse stays as the visible (and keyboard) way in. A new file shrinks from the area into its row, the
 * row fills with its progress, and a removed row collapses so the ones below close up.
 */
export function Dropzone({ onFiles, accept, multiple = true, files = [], onRemove, onRetry, title = "Drop files here", className, listClassName }: DropzoneProps) {
  const [over, setOver] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  const area = React.useRef<HTMLLabelElement>(null);
  const layer = React.useRef<HTMLDivElement>(null);
  const known = React.useRef(new Set<string>());
  const ready = React.useRef(false);
  const fly = React.useMemo(() => ({ area, layer, known, ready }), []);
  React.useEffect(() => {
    ready.current = true;
  }, []);
  // The next file moves up into the removed one's row, so a double click would remove two.
  const remove = useDoubleTapGuard(onRemove);

  // Rows that just left keep playing their collapse where they were.
  const [gone, setGone] = React.useState<{ file: DropFile; index: number }[]>([]);
  const before = React.useRef(files);
  const ids = files.map((f) => f.id).join("\n");
  React.useLayoutEffect(() => {
    const now = new Set(ids ? ids.split("\n") : []);
    const left = before.current.flatMap((file, index) => (now.has(file.id) ? [] : [{ file, index }]));
    before.current = files;
    for (const { file } of left) known.current.delete(file.id);
    if (!left.length || prefersReducedMotion()) return;
    setGone((g) => [...g, ...left]);
    window.setTimeout(() => setGone((g) => g.filter((x) => !left.some((l) => l.file.id === x.file.id))), 240);
    // `files` is read for the snapshot only; the joined ids are what changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);
  const rows: { file: DropFile; leaving?: boolean }[] = files.map((file) => ({ file }));
  for (const g of [...gone].sort((a, b) => a.index - b.index)) {
    if (!rows.some((r) => r.file.id === g.file.id)) rows.splice(Math.min(g.index, rows.length), 0, { file: g.file, leaving: true });
  }

  return (
    <div className={cn("relative grid gap-2", className)}>
      <style href="ad-dropzone" precedence="default">
        {CSS}
      </style>
      {/* A label for the hidden input, so a click anywhere in the area opens the picker (Browse handles its own click). */}
      <label
        ref={area}
        onDragOver={(e) => (e.preventDefault(), setOver(true))}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          onFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "grid min-h-0 flex-1 cursor-pointer place-content-center place-items-center gap-2 rounded-card px-pad py-6 text-center transition-colors",
          over ? "bg-fill-strong" : "bg-fill hover:bg-fill-strong",
        )}
      >
        <UploadCloud size={24} className={cn("text-ink-muted transition-transform duration-[220ms] ease-ad [--ad-icon-stroke:1.5]", over && "-translate-y-0.5")} />
        <span className="text-body font-medium text-ink">{title}</span>
        <Button size="sm" variant="secondary" className="mt-1 bg-surface hover:bg-fill focus-visible:bg-fill" onClick={() => input.current?.click()}>
          Browse
        </Button>
        <input
          ref={input}
          type="file"
          hidden
          accept={accept}
          multiple={multiple}
          onChange={(e) => {
            onFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </label>
      {rows.length || listClassName ? (
        <ul className={cn("-mb-2 grid content-start", listClassName)}>
          {rows.map(({ file, leaving }) => (
            <FileRow key={file.id} f={file} leaving={leaving} fly={fly} onRemove={onRemove ? remove : undefined} onRetry={onRetry} />
          ))}
        </ul>
      ) : null}
      <div ref={layer} aria-hidden className="pointer-events-none absolute inset-0 z-10" />
    </div>
  );
}
