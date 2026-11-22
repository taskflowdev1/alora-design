import * as React from "react";
import { ArrowRight } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";

export type ProposalStatus = "pending" | "applying" | "applied" | "declined";

export interface ProposalChange {
  label: string;
  /** Today's value. Leave out for something new. */
  before?: string;
  after: string;
}

export interface ProposalCardProps {
  /** What the agent wants to do, as a plain sentence. */
  title: string;
  changes: ProposalChange[];
  /** Leave out to let the card hold its own state. */
  status?: ProposalStatus;
  /** Approve was pressed. A returned promise keeps the card on "Applying…" until it settles. */
  onApprove?: () => void | Promise<unknown>;
  onDecline?: () => void;
  /** Blocks both buttons, for example while the agent is still replying. */
  disabled?: boolean;
  className?: string;
}

const CSS = `
.ad-prop-part { display: inline-block; overflow: hidden; white-space: nowrap; vertical-align: bottom; width: max-content; interpolate-size: allow-keywords; transition: width 220ms var(--ad-ease), opacity 180ms var(--ad-ease), margin 220ms var(--ad-ease); }
.ad-prop-part[data-gone] { width: 0; opacity: 0; margin-inline: 0; }
.ad-prop-result { animation: ad-prop-in 220ms var(--ad-ease) both; }
@keyframes ad-prop-in { from { opacity: 0; transform: translateY(3px); } }
@media (prefers-reduced-motion: reduce) { .ad-prop-part { transition: none; } .ad-prop-result { animation: none; } }`;

/** A value with "Rp" as the small muted unit on its baseline. */
function Value({ v }: { v: string }) {
  const m = /^Rp\s?(.+)$/.exec(v);
  if (!m) return <>{v}</>;
  return (
    <>
      <span className="text-small text-ink-muted">Rp</span>
      {" "}
      {m[1]}
    </>
  );
}

/** A label that keeps the button one width through its states: both words share a grid cell. */
function Steady({ now, other }: { now: string; other: string }) {
  return (
    <span className="grid">
      <span className="col-start-1 row-start-1">{now}</span>
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        {other}
      </span>
    </span>
  );
}

/**
 * A change the agent wants to make, waiting for a person: each value before and after, with Approve and Decline.
 * Nothing changes until someone approves. Approving folds the old values away and leaves the new ones; declining
 * leaves the old ones. The answer lands in the row the buttons were in, so the card keeps its height.
 */
export function ProposalCard({ title, changes, status, onApprove, onDecline, disabled, className }: ProposalCardProps) {
  const [own, setOwn] = React.useState<ProposalStatus>("pending");
  const state = status ?? own;
  const busy = React.useRef(false);
  const approve = async () => {
    if (busy.current || state !== "pending") return;
    busy.current = true;
    setOwn("applying");
    try {
      await onApprove?.();
      setOwn("applied");
    } catch {
      setOwn("pending");
    } finally {
      busy.current = false;
    }
  };
  const decline = () => {
    if (state !== "pending") return;
    setOwn("declined");
    onDecline?.();
  };
  const applied = state === "applied";
  const declined = state === "declined";
  const settled = applied || declined;
  return (
    <article aria-label={`Proposed change: ${title}`} data-proposal={state} className={cn("grid min-w-0 gap-2.5 rounded-card bg-surface p-pad shadow-card", className)}>
      <style href="ad-proposal-card" precedence="default">
        {CSS}
      </style>
      <h3 className="m-0 text-body font-semibold text-ink text-balance">{title}</h3>
      <dl className="m-0 grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-4 gap-y-1 text-body">
        {changes.map((c) => (
          <React.Fragment key={c.label}>
            <dt className="truncate text-ink-muted">{c.label}</dt>
            <dd className="m-0 min-w-0 tabular-nums">
              {c.before !== undefined ? (
                <>
                  <span className="sr-only">Current: </span>
                  <span className={cn("ad-prop-part", declined ? "text-ink" : "text-ink-muted")} data-gone={applied ? "" : undefined}>
                    <Value v={c.before} />
                  </span>
                  <span className="ad-prop-part mx-1.5 text-ink-muted" data-gone={settled ? "" : undefined} aria-hidden="true">
                    <ArrowRight size={14} className="inline-block align-[-2px]" />
                  </span>
                </>
              ) : null}
              <span className="sr-only">Proposed: </span>
              <span className="ad-prop-part font-medium text-ink" data-gone={declined && c.before !== undefined ? "" : undefined}>
                <Value v={c.after} />
              </span>
            </dd>
          </React.Fragment>
        ))}
      </dl>
      <div className="flex min-h-control items-center gap-gap">
        {settled ? (
          <p role="status" className="ad-prop-result m-0 inline-flex items-center gap-2 text-body text-ink-muted">
            <span aria-hidden="true" className={cn("size-1.5 rounded-full", applied ? "bg-success" : "bg-ink-muted")} />
            {applied ? "Applied" : "Declined"}
          </p>
        ) : (
          <>
            <Button variant="primary" aria-label={`Approve: ${title}`} disabled={disabled || state === "applying"} onClick={approve}>
              <Steady now={state === "applying" ? "Applying…" : "Approve"} other={state === "applying" ? "Approve" : "Applying…"} />
            </Button>
            <Button aria-label={`Decline: ${title}`} disabled={disabled || state === "applying"} onClick={decline}>
              Decline
            </Button>
          </>
        )}
      </div>
    </article>
  );
}
