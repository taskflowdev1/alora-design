import * as React from "react";
import { Check, Copy } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";

export interface CodeBlockProps {
  code: string;
  /** A file name or language over the code, on the same soft card. */
  title?: React.ReactNode;
  /** Line numbers in the faint ink. */
  lineNumbers?: boolean;
  /** Taller code scrolls inside. */
  maxHeight?: number;
  onCopy?: (code: string) => void;
  className?: string;
}

/**
 * Code on a soft card in the mono face (the one place a second face appears). A copy button sits in the corner one
 * nest gap in, concentric; it flips to a check for a moment. Long lines scroll sideways inside, never the page.
 */
export function CodeBlock({ code, title, lineNumbers, maxHeight = 420, onCopy, className }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);
  const lines = code.split("\n");
  return (
    <div className={cn("relative min-w-0 rounded-card bg-fill", className)}>
      {title != null ? <div className="flex h-control items-center px-pad pr-14 text-small text-ink-muted">{title}</div> : null}
      <pre className={cn("overflow-auto p-pad pr-14 font-mono text-[12.5px] leading-relaxed text-ink", title != null && "pt-0")} style={{ maxHeight }}>
        <code className={cn(lineNumbers && "grid grid-cols-[auto_1fr] gap-x-4")}>
          {lineNumbers
            ? lines.map((l, i) => (
                <React.Fragment key={i}>
                  <span aria-hidden className="select-none text-right tabular-nums text-ink-faint">
                    {i + 1}
                  </span>
                  <span>{l || " "}</span>
                </React.Fragment>
              ))
            : code}
        </code>
      </pre>
      <Button
        variant="ghost"
        icon
        size="sm"
        aria-label={copied ? "Copied" : "Copy code"}
        className="absolute right-nest top-nest"
        onClick={() => {
          void navigator.clipboard?.writeText(code);
          onCopy?.(code);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1400);
        }}
      >
        {copied ? <Check /> : <Copy />}
      </Button>
    </div>
  );
}
