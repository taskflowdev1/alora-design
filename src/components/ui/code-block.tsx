import * as React from "react";
import { Check, Copy } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

/**
 * Copies text and resolves only once it is really on the clipboard, so the check never shows for a write the browser
 * refused (http, an iframe without permission). Falls back to the older selection copy where the async API is missing
 * or refuses.
 */
function copyText(text: string) {
  const legacy = () => {
    const back = document.activeElement as HTMLElement | null;
    const t = document.createElement("textarea");
    t.value = text;
    t.setAttribute("readonly", "");
    t.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.append(t);
    t.select();
    const ok = document.execCommand("copy");
    t.remove();
    back?.focus({ preventScroll: true });
    return ok ? Promise.resolve() : Promise.reject(new Error("Copy failed"));
  };
  return navigator.clipboard?.writeText ? navigator.clipboard.writeText(text).catch(legacy) : legacy();
}

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
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const lines = code.split("\n");
  return (
    <div className={cn("relative min-w-0 rounded-card bg-fill", className)}>
      {title != null ? <div className="flex h-control items-center px-pad pr-14 text-small text-ink-muted">{title}</div> : null}
      <pre className={cn("overflow-auto p-pad pr-14 font-mono text-[12.5px] leading-relaxed text-ink", title != null && "pt-0")} style={{ maxHeight }}>
        <code className={cn(lineNumbers && "grid grid-cols-[auto_1fr] gap-x-4")}>
          {lineNumbers
            ? lines.map((l, i) => (
                <React.Fragment key={i}>
                  <span aria-hidden className="select-none text-right tabular-nums text-ink-muted">
                    {i + 1}
                  </span>
                  <span>{l || " "}</span>
                </React.Fragment>
              ))
            : code}
        </code>
      </pre>
      <Tooltip content={copied ? "Copied" : "Copy code"}>
        <Button
          variant="ghost"
          icon
          size="sm"
          aria-label={copied ? "Copied" : "Copy code"}
          className="absolute right-nest top-nest"
          onClick={() => {
            copyText(code).then(
              () => {
                onCopy?.(code);
                setCopied(true);
                window.clearTimeout(timer.current);
                timer.current = window.setTimeout(() => setCopied(false), 1400);
              },
              () => {},
            );
          }}
        >
          <span className="relative grid size-[16px] place-items-center [&>svg]:absolute [&>svg]:transition-[opacity,scale,filter] [&>svg]:duration-[160ms] [&>svg]:ease-ad">
            <Copy className={cn(copied && "opacity-0 scale-[0.8] blur-[2px]")} />
            <Check className={cn(!copied && "opacity-0 scale-[0.8] blur-[2px]")} />
          </span>
        </Button>
      </Tooltip>
    </div>
  );
}
