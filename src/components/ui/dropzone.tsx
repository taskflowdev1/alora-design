import * as React from "react";
import { File, UploadCloud, X } from "react-feather";
import { cn, formatNumber } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";

export interface DropFile {
  id: string;
  name: string;
  size: number;
  /** 0–100 while uploading; undefined when done. */
  progress?: number;
}

export interface DropzoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  files?: DropFile[];
  onRemove?: (id: string) => void;
  /** What to drop, e.g. "Drop product photos". */
  title?: string;
  className?: string;
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

/**
 * A soft area, no dashed border. The whole area opens the file picker and deepens on hover; dragging over it deepens
 * the fill too. Browse stays as the visible (and keyboard) way in. Files list under it with progress.
 */
export function Dropzone({ onFiles, accept, multiple = true, files = [], onRemove, title = "Drop files here", className }: DropzoneProps) {
  const [over, setOver] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  return (
    <div className={cn("grid gap-2", className)}>
      {/* A label for the hidden input, so a click anywhere in the area opens the picker (Browse handles its own click). */}
      <label
        onDragOver={(e) => (e.preventDefault(), setOver(true))}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          onFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "grid cursor-pointer place-items-center gap-2 rounded-card px-pad py-6 text-center transition-colors",
          over ? "bg-fill-strong" : "bg-fill hover:bg-fill-strong",
        )}
      >
        <UploadCloud size={24} className="text-ink-muted [--ad-icon-stroke:1.5]" />
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
      {files.length ? (
        <ul className="grid gap-2">
          {files.map((f) => (
            <li key={f.id} className="flex min-h-[calc(var(--ad-control-h)+var(--ad-nest)*2)] items-center gap-3 rounded-item bg-fill py-1.5 pl-3 pr-1.5">
              <File size={16} className="shrink-0 text-ink-muted" />
              <div className="grid min-w-0 flex-1 gap-1.5">
                <div className="flex items-baseline gap-2 text-body">
                  <FileName name={f.name} className="flex-1" />
                  <span className="shrink-0 text-small tabular-nums text-ink-muted">{f.progress != null ? `${Math.round(f.progress)}%` : kb(f.size)}</span>
                </div>
                {f.progress != null ? <Progress value={f.progress} aria-label={`Uploading ${f.name}`} className="h-1 bg-fill-strong" /> : null}
              </div>
              {onRemove ? (
                <Tooltip content="Remove">
                  <Button variant="ghost" size="sm" icon aria-label={`Remove ${f.name}`} onClick={() => onRemove(f.id)}>
                    <X />
                  </Button>
                </Tooltip>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
