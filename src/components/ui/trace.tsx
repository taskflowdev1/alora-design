import * as React from "react";
import { AlertCircle, Check, ChevronDown, Circle } from "react-feather";
import { Collapsible as C } from "radix-ui";
import { cn } from "@/lib/ad";

export type TraceStatus = "done" | "running" | "pending" | "error";

export interface TraceStep {
  id: string;
  title: React.ReactNode;
  /** One short line (the tool, the source), only when it helps. */
  description?: React.ReactNode;
  status?: TraceStatus;
  /** How long it took, e.g. "1,2 s". */
  time?: React.ReactNode;
  /** Expandable detail: the query, the rows read, the source text. */
  detail?: React.ReactNode;
  /** A bare icon instead of the status glyph (the tool's icon). */
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
}

const glyph = (s: TraceStatus) =>
  s === "done" ? <Check size={14} className="text-ink-muted" /> : s === "error" ? <AlertCircle size={14} className="text-danger" /> : s === "running" ? <span className="size-2 animate-[ad-pulse_1.2s_ease-in-out_infinite] rounded-full bg-ink" /> : <Circle size={10} className="text-ink-muted" />;

/**
 * What an agent did, step by step (reasoning, tool calls, sources): a glyph per step on a quiet rail of spacing, the
 * running step pulsing, the time on the right. Steps with detail open in place. Plain words; ids and payloads stay in
 * the detail, closed by default.
 */
export function Trace({ steps, className }: { steps: TraceStep[]; className?: string }) {
  return (
    <ol className={cn("grid gap-px", className)}>
      {steps.map((s) => {
        const status = s.status ?? "done";
        const row = (
          <>
            <span className="grid size-5 shrink-0 place-items-center">{s.icon ? <s.icon size={14} className="text-ink-muted" /> : glyph(status)}</span>
            <span className="grid min-w-0 flex-1 text-left">
              <span className={cn("truncate text-body", status === "pending" ? "text-ink-muted" : "text-ink")}>{s.title}</span>
              {s.description ? <span className="truncate text-small text-ink-muted">{s.description}</span> : null}
            </span>
            {s.time != null ? <span className="shrink-0 text-small tabular-nums text-ink-muted">{s.time}</span> : null}
          </>
        );
        return (
          <li key={s.id} aria-current={status === "running" ? "step" : undefined}>
            {s.detail ? (
              <C.Root>
                <C.Trigger className="group flex min-h-item w-full cursor-pointer items-center gap-2.5 rounded-item px-2 py-1 transition-colors duration-[160ms] ease-ad hover:bg-fill">
                  {row}
                  <ChevronDown size={14} className="shrink-0 text-ink-muted transition-transform duration-[220ms] group-data-[state=open]:rotate-180" />
                </C.Trigger>
                <C.Content className="ml-[calc(1.25rem+0.625rem+0.5rem)] mr-2 mt-1 mb-2 rounded-item bg-fill px-3 py-2 text-small leading-relaxed text-ink-muted data-[state=open]:animate-[ad-fade-in_200ms_var(--ad-ease)]">{s.detail}</C.Content>
              </C.Root>
            ) : (
              <div className="flex min-h-item items-center gap-2.5 px-2 py-1">{row}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
