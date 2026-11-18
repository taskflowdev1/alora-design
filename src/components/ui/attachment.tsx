import * as React from "react";
import { AlertCircle, File, FileText, Image as ImageIcon, X } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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
  /** Opens the file (whole card is the target). */
  onOpen?: () => void;
  /** "sm" for the strip above a composer. */
  size?: "default" | "sm";
  className?: string;
}

const KIND_ICON = { image: ImageIcon, doc: FileText, file: File };

/**
 * A file on a soft card: preview or icon, the name (it truncates cleanly), one muted
 * line, a remove button. Uploading shows a slim bar in place of the meta; an error says so in words, quietly.
 */
export function Attachment({ name, meta, kind = "file", src, state = "done", progress = 0, onRemove, onOpen, size = "default", className }: AttachmentProps) {
  const Icon = KIND_ICON[kind];
  const sm = size === "sm";
  return (
    <div
      onClick={onOpen}
      className={cn(
        "group relative flex min-w-0 items-center gap-2.5 rounded-card bg-fill p-nest pr-2 text-left",
        sm ? "h-control w-48" : "w-64",
        onOpen && "cursor-pointer transition-colors duration-[160ms] ease-ad hover:bg-fill-strong",
        state === "error" && "bg-danger-soft",
        className,
      )}
    >
      <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-item bg-surface text-ink-muted", sm ? "size-[calc(var(--ad-control-h)-var(--ad-nest)*2)]" : "size-10")}>
        {kind === "image" && src ? <img src={src} alt="" className="size-full object-cover" /> : state === "error" ? <AlertCircle size={16} className="text-danger" /> : <Icon size={16} />}
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="truncate text-body text-ink">{name}</span>
        {!sm ? (
          state === "uploading" ? (
            <Progress value={progress} aria-label={`Uploading ${name}`} className="mt-1" />
          ) : (
            <span className={cn("truncate text-small", state === "error" ? "text-danger" : "text-ink-muted")}>{state === "error" ? "Didn't upload. Try again" : meta}</span>
          )
        ) : null}
      </span>
      {onRemove ? (
        <Button
          variant="ghost"
          size="sm"
          icon
          aria-label={`Remove ${name}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-ink-muted hover:bg-fill-strong hover:text-ink"
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}

/** Attachments in a row that scrolls sideways inside itself (above a composer, under a message). */
export function AttachmentGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain pb-1 [&>*]:shrink-0", className)} {...props} />;
}
