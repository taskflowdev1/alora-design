import * as React from "react";
import { AlertCircle, Check, ChevronDown, Circle } from "react-feather";
import { Collapsible as C } from "radix-ui";
import { cn, formatNumber } from "@/lib/ad";

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
  /** When a running step started (Date.now()); its time ticks up live until it has a `time`. */
  startedAt?: number;
}

/** Seconds since `from`, ticking every 100 ms in tabular figures ("1,2 s"). */
function Elapsed({ from }: { from: number }) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, []);
  return <>{`${formatNumber(Math.max(0, now - from) / 1000, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s`}</>;
}

const glyph = (s: TraceStatus) =>
  s === "done" ? <Check size={14} className="text-ink-muted" /> : s === "error" ? <AlertCircle size={14} className="text-danger" /> : s === "running" ? <span className="size-2 animate-[ad-pulse_1.2s_ease-in-out_infinite] rounded-full bg-ink" /> : <Circle size={14} className="text-ink-muted" />;

/**
 * What an agent did, step by step (reasoning, tool calls, sources): a glyph per step on a quiet rail of spacing, the
 * running step pulsing, the time on the right. Steps with detail open in place. Plain words; ids and payloads stay in
 * the detail, closed by default. `live` (while the agent works): each new step slides in as it starts and the running
 * one's time counts up, so the wait shows the work behind it.
 */
export function Trace({ steps, live, className }: { steps: TraceStep[]; live?: boolean; className?: string }) {
  return (
    <ol className={cn("grid gap-px", className)}>
      {steps.map((s) => {
        const status = s.status ?? "done";
        const time = s.time ?? (status === "running" && s.startedAt != null ? <Elapsed from={s.startedAt} /> : null);
        const row = (
          <>
            <span className="grid size-5 shrink-0 place-items-center">{s.icon ? <s.icon size={14} className="text-ink-muted" /> : glyph(status)}</span>
            <span className="grid min-w-0 flex-1 text-left">
              <span className={cn("truncate text-body", status === "pending" ? "text-ink-muted" : "text-ink")}>{s.title}</span>
              {s.description ? <span className="truncate text-small text-ink-muted">{s.description}</span> : null}
            </span>
            {time != null ? <span className="shrink-0 text-small tabular-nums text-ink-muted">{time}</span> : null}
          </>
        );
        return (
          <li key={s.id} aria-current={status === "running" ? "step" : undefined} className={cn(live && "animate-[ad-up_200ms_var(--ad-ease)]")}>
            {s.detail ? (
              <C.Root>
                <C.Trigger className="group flex min-h-item w-full cursor-pointer items-center gap-2.5 rounded-item px-2 py-1 hover:bg-fill focus-visible:bg-fill">
                  {row}
                  <ChevronDown size={14} className="shrink-0 text-ink-muted transition-transform duration-[220ms] group-data-[state=open]:rotate-180" />
                </C.Trigger>
                <C.Content className="ml-[calc(1.25rem+0.625rem+0.5rem)] mr-2 mt-1 mb-2 rounded-item bg-fill px-3 py-2 text-small leading-relaxed text-ink-muted data-[state=open]:animate-[ad-fade-in_200ms_var(--ad-ease)]">{s.detail}</C.Content>
              </C.Root>
            ) : (
              <div className="flex min-h-item items-center gap-2.5 px-2 py-1">
                {row}
                {/* The chevron's slot, so times line up with the rows that have one. */}
                <span aria-hidden className="size-[14px] shrink-0" />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
