import * as React from "react";
import { Check, Download, Eye, FileText } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

export interface ReportRowProps {
  /** The file's name, with its extension. */
  name: string;
  /** Facts about the file, for example "2 pages · 84 KB". */
  meta?: string;
  /** The agent is still writing it: the row shimmers and its actions wait. */
  making?: boolean;
  onPreview?: () => void;
  onDownload?: () => void;
  className?: string;
}

const CSS = `
.ad-report-making { background: linear-gradient(90deg, var(--ad-ink-muted) 0 35%, var(--ad-ink) 50%, var(--ad-ink-muted) 65% 100%) 0 0 / 250% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: ad-report-shimmer 2.2s linear infinite; }
@keyframes ad-report-shimmer { from { background-position: 100% 0; } to { background-position: 0 0; } }
.ad-report-icon { animation: ad-report-swap 180ms var(--ad-ease); }
@keyframes ad-report-swap { from { opacity: 0; scale: .9; filter: blur(2px); } }
@media (prefers-reduced-motion: reduce) { .ad-report-making { animation: none; background: none; color: var(--ad-ink-muted); } .ad-report-icon { animation: none; } }`;

/** Splits a long file name so the middle truncates and the extension stays. */
function FileName({ name }: { name: string }) {
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  return (
    <span translate="no" className="flex min-w-0 font-medium text-ink">
      <span className="truncate">{stem}</span>
      <span className="shrink-0">{ext}</span>
    </span>
  );
}

/**
 * A file the agent made, in the thread: name, facts, preview and download. While it's being written the facts line
 * shimmers. Download confirms on the button itself.
 */
export function ReportRow({ name, meta, making = false, onPreview, onDownload, className }: ReportRowProps) {
  const [done, setDone] = React.useState(false);
  const timer = React.useRef(0);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const download = () => {
    onDownload?.();
    setDone(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDone(false), 1600);
  };
  return (
    <div data-report-row className={cn("flex min-w-0 items-center gap-3 rounded-card bg-surface p-[calc(var(--ad-nest)*2)] ps-3 shadow-card", className)}>
      <style href="ad-report-row" precedence="default">
        {CSS}
      </style>
      <FileText size={16} className="shrink-0 text-ink-muted" />
      <div className="grid min-w-0 flex-1 text-body">
        <FileName name={name} />
        <span role="status" className={cn("truncate text-small text-ink-muted", making && "ad-report-making")}>
          {making ? "Making the PDF…" : meta}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Tooltip content={making ? "Still making it" : "Preview"}>
          <span className="inline-flex">
            <Button variant="ghost" icon aria-label="Preview" disabled={making} onClick={onPreview}>
              <Eye />
            </Button>
          </span>
        </Tooltip>
        <Tooltip content={making ? "Still making it" : done ? "Downloaded" : "Download"}>
          <span className="inline-flex">
            <Button variant="ghost" icon aria-label="Download" disabled={making} onClick={download}>
              {done ? <Check key="done" className="ad-report-icon" /> : <Download key="down" className="ad-report-icon" />}
            </Button>
          </span>
        </Tooltip>
      </div>
    </div>
  );
}
