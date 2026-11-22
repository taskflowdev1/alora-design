import * as React from "react";
import { AlertCircle, File, FileText, Image as ImageIcon, RotateCw, X } from "react-feather";
import { cn } from "@/lib/ad";
import { useEdgeFade } from "@/lib/ad-hooks";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";

export interface AttachmentProps {
  name: string;
  /** "PDF · 240 KB". */
  meta?: React.ReactNode;
  kind?: "image" | "doc" | "file";
  /** A preview image (kind "image"). */
  src?: string;
  state?: "uploading" | "error" | "done";
  /** 0 to 100 while uploading. */
  progress?: number;
  onRemove?: () => void;
  /** Shown with state "error": a retry button before the remove button. */
  onRetry?: () => void;
  /** Opens the file (whole card is the target). */
  onOpen?: () => void;
  /** "sm" for the strip above a composer. */
  size?: "default" | "sm";
  className?: string;
}

const KIND_ICON = { image: ImageIcon, doc: FileText, file: File };

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
 * A file on a soft card: preview or icon, the name (it truncates cleanly), one muted
 * line, a remove button. Uploading shows a slim bar in place of the meta; an error says so in words, quietly.
 */
export function Attachment({ name, meta, kind = "file", src, state = "done", progress = 0, onRemove, onRetry, onOpen, size = "default", className }: AttachmentProps) {
  const Icon = KIND_ICON[kind];
  const sm = size === "sm";
  return (
    <div
      onClick={onOpen}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => onOpen && e.target === e.currentTarget && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
      className={cn(
        "group relative flex min-w-0 items-center gap-2.5 rounded-card bg-fill p-nest pr-2 text-left",
        sm ? "h-control w-[188px]" : "w-64",
        onOpen && "cursor-pointer select-none ad-press hover:bg-fill-strong focus-visible:bg-fill-strong active:scale-[0.98]",
        state === "error" && "bg-danger-soft",
        className,
      )}
    >
      <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-item bg-surface text-ink-muted", sm ? "size-[calc(var(--ad-control-h)-var(--ad-nest)*2)]" : "size-10")}>
        {kind === "image" && src ? <img src={src} alt="" className="size-full object-cover" /> : state === "error" ? <AlertCircle size={16} className="text-danger" /> : <Icon size={16} />}
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <FileName name={name} className="text-body text-ink" />
        {!sm ? (
          state === "uploading" ? (
            <Progress value={progress} aria-label={`Uploading ${name}`} className="mt-1 bg-fill-strong" />
          ) : (
            <span className={cn("truncate text-small", state === "error" ? "text-danger" : "text-ink-muted")}>{state === "error" ? "Didn’t upload" : meta}</span>
          )
        ) : null}
      </span>
      {state === "error" && onRetry ? (
        <Tooltip content="Upload again">
          <Button
            variant="ghost"
            size="sm"
            icon
            aria-label={`Upload ${name} again`}
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="text-ink-muted hover:bg-fill-strong focus-visible:bg-fill-strong hover:text-ink focus-visible:text-ink"
          >
            <RotateCw />
          </Button>
        </Tooltip>
      ) : null}
      {onRemove ? (
        <Tooltip content="Remove">
          <Button
            variant="ghost"
            size="sm"
            icon
            aria-label={`Remove ${name}`}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-ink-muted hover:bg-fill-strong focus-visible:bg-fill-strong hover:text-ink focus-visible:text-ink"
          >
            <X />
          </Button>
        </Tooltip>
      ) : null}
    </div>
  );
}

/** Attachments in a row that scrolls sideways inside itself (above a composer, under a message). */
export function AttachmentGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const ref = React.useRef<HTMLDivElement>(null);
  useEdgeFade(ref, { axis: "x", size: 24 });
  return <div ref={ref} className={cn("flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain pb-1 [&>*]:shrink-0", className)} {...props} />;
}
