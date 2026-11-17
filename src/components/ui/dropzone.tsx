import * as React from "react";
import { File, UploadCloud, X } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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

const kb = (n: number) => (n >= 1e6 ? `${(n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);

/** A soft area, no dashed border. Dragging over it deepens the fill. Files list under it with progress. */
export function Dropzone({ onFiles, accept, multiple = true, files = [], onRemove, title = "Drop files here", className }: DropzoneProps) {
  const [over, setOver] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  return (
    <div className={cn("grid gap-2", className)}>
      <div
        onDragOver={(e) => (e.preventDefault(), setOver(true))}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          onFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "grid place-items-center gap-3 rounded-card px-pad py-8 text-center transition-[background-color,transform] duration-[220ms] ease-ad",
          over ? "scale-[1.01] bg-fill-hover" : "bg-fill",
        )}
      >
        <UploadCloud size={28} className="text-ink-muted [--ad-icon-stroke:1.5]" />
        <span className="text-body font-medium text-ink">{title}</span>
        <Button size="sm" variant="secondary" className="bg-surface hover:bg-fill-hover" onClick={() => input.current?.click()}>
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
      </div>
      {files.length ? (
        <ul className="grid gap-1">
          {files.map((f) => (
            <li key={f.id} className="flex min-h-row items-center gap-3 rounded-item bg-fill px-2.5 py-1.5">
              <File size={16} className="shrink-0 text-ink-muted" />
              <div className="grid min-w-0 flex-1 gap-1">
                <div className="flex items-baseline gap-2 text-body">
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <span className="shrink-0 text-small tabular-nums text-ink-muted">{f.progress != null ? `${Math.round(f.progress)}%` : kb(f.size)}</span>
                </div>
                {f.progress != null ? <Progress value={f.progress} aria-label={`Uploading ${f.name}`} className="h-1" /> : null}
              </div>
              {onRemove ? (
                <Button variant="ghost" size="sm" icon aria-label={`Remove ${f.name}`} onClick={() => onRemove(f.id)}>
                  <X />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
