import * as React from "react";
import { cn, formatNumber } from "@/lib/ad";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ApprovalPerson {
  /** Their part in the flow: "Requested", "Manager", "Finance". */
  role: string;
  name: string;
  src?: string;
}

export type ApprovalDecision = { type: "approve"; by: string } | { type: "reject"; by: string; reason: string } | { type: "resubmit"; by: string };

type Face = "waiting" | "reason" | "rejected" | "approved";

export interface ApprovalFlowProps {
  title?: React.ReactNode;
  /** The document's number. */
  code?: string;
  /** The amount in rupiah, written after a small Rp. */
  amount?: number;
  /** The requester first, then each approver in order. */
  people?: ApprovalPerson[];
  onDecision?: (decision: ApprovalDecision) => void;
  /** True once the last approver has approved. */
  onApprovedChange?: (approved: boolean) => void;
  className?: string;
}

const PEOPLE: ApprovalPerson[] = [
  { role: "Requested", name: "Rizky" },
  { role: "Manager", name: "Sari" },
  { role: "Finance", name: "Dewi" },
];

const faceClass = (on: boolean) =>
  cn(
    "col-start-1 row-start-1 flex min-w-0 items-center gap-gap transition-[translate,opacity] duration-[240ms] ease-ad motion-reduce:transition-none",
    !on && "pointer-events-none translate-y-2 opacity-0",
  );

/**
 * A purchase order on its way to approval. A line runs from the requester through each approver: Approve carries it to
 * the next person, Reject asks for one reason in place and the line retracts to the requester, who can resubmit. The
 * answer lands in the action row, so the card never changes size.
 */
export function ApprovalFlow({ title = "Gelas kopi tanah liat, 200 pcs", code = "PO-1042", amount = 17800000, people = PEOPLE, onDecision, onApprovedChange, className }: ApprovalFlowProps) {
  const last = people.length; // the Approved stop comes after the last person
  const [at, setAt] = React.useState(1);
  const [face, setFace] = React.useState<Face>("waiting");
  const [reason, setReason] = React.useState("");
  const [rejected, setRejected] = React.useState<{ by: string; at: number; reason: string } | null>(null);
  const row = React.useRef<HTMLDivElement>(null);
  const field = React.useRef<HTMLInputElement>(null);
  const current = people[Math.min(at, people.length - 1)];

  const approved = face === "approved";
  const report = React.useRef(onApprovedChange);
  React.useEffect(() => {
    report.current = onApprovedChange;
  });
  React.useEffect(() => {
    report.current?.(approved);
  }, [approved]);

  // The button that was pressed leaves with its face: focus follows to the new face's main control.
  const moved = React.useRef(false);
  const go = (next: Face) => {
    moved.current = !!row.current?.contains(document.activeElement);
    setFace(next);
  };
  React.useLayoutEffect(() => {
    if (face === "reason") field.current?.focus();
    else if (moved.current) row.current?.querySelector<HTMLElement>(`[data-face="${face}"] [data-main]`)?.focus();
    moved.current = false;
  }, [face]);

  const approve = () => {
    const next = at + 1;
    onDecision?.({ type: "approve", by: current.name });
    setAt(next);
    setRejected(null);
    if (next >= last) go("approved");
  };
  const reject = () => {
    const why = reason.trim();
    if (!why) return;
    onDecision?.({ type: "reject", by: current.name, reason: why });
    setRejected({ by: current.name, at, reason: why });
    setAt(0);
    setReason("");
    go("rejected");
  };
  const resubmit = () => {
    onDecision?.({ type: "resubmit", by: people[0].name });
    setRejected(null);
    setAt(1);
    go("waiting");
  };
  const cancel = () => {
    setReason("");
    go("waiting");
  };

  const stops = [...people, null];
  const percent = (at / last) * 100;

  return (
    <div className={cn("grid gap-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-body font-medium text-ink">{title}</p>
          <p translate="no" className="text-small tabular-nums text-ink-muted">
            {code}
          </p>
        </div>
        <p className="flex shrink-0 items-baseline gap-1 tabular-nums">
          <span className="text-small text-ink-muted">Rp</span>
          <span className="text-heading font-semibold text-ink">{formatNumber(amount)}</span>
        </p>
      </div>

      <ol className="relative grid" style={{ gridTemplateColumns: `repeat(${stops.length}, minmax(0, 1fr))` }}>
        {/* The line runs centre to centre; the fill is clipped, so its round end stays round at any length. */}
        <span aria-hidden className="absolute top-[calc(1rem+2px)] h-[3px] -translate-y-1/2 rounded-full bg-fill" style={{ left: `${50 / stops.length}%`, right: `${50 / stops.length}%` }}>
          <span
            className="block size-full rounded-full bg-on transition-[clip-path] duration-[300ms] ease-ad motion-reduce:transition-none"
            style={{ clipPath: `inset(0 ${100 - percent}% 0 0 round 999px)` }}
          />
        </span>
        {stops.map((p, i) => {
          const reached = i <= at;
          const refused = rejected?.at === i;
          return (
            <li key={p?.name ?? "approved"} aria-current={i === at ? "step" : undefined} className="relative grid min-w-0 justify-items-center gap-1.5 text-center">
              {/* The card's own colour around each stop parts the line, without a ring. */}
              <span className="rounded-full bg-surface p-[2px]">
                {p ? (
                  <Avatar
                    name={p.name}
                    src={p.src}
                    className={cn("transition-[opacity,scale] delay-[100ms] duration-[220ms] ease-ad motion-reduce:transition-none", reached ? "scale-100" : "scale-[0.92] opacity-45")}
                  />
                ) : (
                  <span className="grid size-8 place-items-center rounded-full bg-fill">
                    <span className={cn("size-2 rounded-full transition-colors delay-[160ms] duration-[220ms] ease-ad motion-reduce:transition-none", approved ? "bg-success" : "bg-fill-strong")} />
                  </span>
                )}
              </span>
              <span className="grid min-w-0 max-w-full">
                <span className={cn("truncate text-body font-medium transition-colors duration-[220ms] ease-ad", reached ? "text-ink" : "text-ink-muted")}>{p ? p.name : "Approved"}</span>
                <span className={cn("truncate text-small", refused ? "text-danger" : "text-ink-muted")}>{refused ? "Rejected" : p ? p.role : " "}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <div ref={row} className="grid h-control">
        <div data-face="waiting" inert={face !== "waiting"} className={faceClass(face === "waiting")}>
          <span aria-live="polite" className="min-w-0 flex-1 truncate text-body text-ink-muted">
            Waiting on <span className="font-medium text-ink">{current.name}</span>
          </span>
          <Button onClick={() => go("reason")}>Reject</Button>
          <Button data-main variant="primary" onClick={approve}>
            Approve
          </Button>
        </div>

        <div data-face="reason" inert={face !== "reason"} className={faceClass(face === "reason")}>
          <Input
            ref={field}
            aria-label="Reason for rejecting"
            placeholder="Reason"
            value={reason}
            maxLength={80}
            wrapperClassName="min-w-0 flex-1"
            onChange={(e) => setReason(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // Focus moves to Resubmit during this key press: without this, the same Enter would press it.
                e.preventDefault();
                reject();
              }
              if (e.key === "Escape") {
                e.stopPropagation();
                cancel();
              }
            }}
          />
          <Button variant="ghost" onClick={cancel}>
            Cancel
          </Button>
          <Button variant="strong" disabled={!reason.trim()} onClick={reject}>
            Reject
          </Button>
        </div>

        <div data-face="rejected" inert={face !== "rejected"} className={faceClass(face === "rejected")}>
          <span role="status" className="min-w-0 flex-1 truncate text-body text-ink-muted">
            <span className="font-medium text-ink">{rejected?.by}</span>: {rejected?.reason}
          </span>
          <Button data-main onClick={resubmit}>
            Resubmit
          </Button>
        </div>

        <div data-face="approved" inert={!approved} className={faceClass(approved)}>
          <span role="status" className="flex min-w-0 items-center gap-2 truncate text-body font-medium text-ink">
            <span className="size-1.5 shrink-0 rounded-full bg-success" />
            Approved by {people[people.length - 1].name}
          </span>
        </div>
      </div>
    </div>
  );
}
