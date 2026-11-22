import * as React from "react";
import { Check, Clock, RefreshCw, WifiOff } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { MobileList, MobileListRow } from "./mobile-list";
import { MobileSheet } from "./mobile-sheet";

export type SyncState = "waiting" | "sending" | "done" | "failed";
export interface SyncItem {
  id: string;
  title: string;
  state: SyncState;
}

/**
 * The offline queue. `add` keeps a change on the phone; while online the queue sends one at a time through `send`, in
 * the order they were made. A failed send stays in the list for `retry`, and the ones behind it carry on.
 */
export function useSyncQueue({ online, send, initial = [] }: { online: boolean; send: (item: SyncItem) => Promise<void>; initial?: SyncItem[] }) {
  const [items, setItems] = React.useState<SyncItem[]>(initial);
  const sender = React.useRef(send);
  sender.current = send;
  const busy = React.useRef(false);
  const alive = React.useRef(true);
  React.useEffect(() => {
    alive.current = true;
    return () => void (alive.current = false);
  }, []);
  React.useEffect(() => {
    if (!online || busy.current) return;
    const next = items.find((i) => i.state === "waiting");
    if (!next) return;
    busy.current = true;
    setItems((l) => l.map((i) => (i.id === next.id ? { ...i, state: "sending" } : i)));
    sender.current(next).then(
      () => alive.current && (busy.current = false, setItems((l) => l.map((i) => (i.id === next.id ? { ...i, state: "done" } : i)))),
      () => alive.current && (busy.current = false, setItems((l) => l.map((i) => (i.id === next.id ? { ...i, state: "failed" } : i)))),
    );
  }, [items, online]);
  const add = React.useCallback((id: string, title: string) => setItems((l) => [...l.filter((i) => i.id !== id), { id, title, state: "waiting" }]), []);
  const retry = React.useCallback(() => setItems((l) => l.map((i) => (i.state === "failed" ? { ...i, state: "waiting" } : i))), []);
  const clear = React.useCallback(() => setItems((l) => l.filter((i) => i.state !== "done")), []);
  return { items, add, retry, clear };
}

function syncLabel(online: boolean, items: SyncItem[]) {
  const left = items.filter((i) => i.state !== "done").length;
  const failed = items.filter((i) => i.state === "failed").length;
  if (failed && !items.some((i) => i.state === "sending" || i.state === "waiting")) return `${failed} not sent`;
  if (!online) return left ? `${left} waiting` : "Offline";
  if (left) return `Sending ${items.length - left + 1} of ${items.length}`;
  return "Synced";
}

export interface MobileSyncPillProps {
  online: boolean;
  items: SyncItem[];
  onClick?: () => void;
  className?: string;
}

/** Sync state in the header: a dot and a few words, always in the same place. The dot's ring fills as the queue drains. */
export function MobileSyncPill({ online, items, onClick, className }: MobileSyncPillProps) {
  const total = items.length;
  const done = items.filter((i) => i.state === "done").length;
  const sending = online && items.some((i) => i.state === "sending" || i.state === "waiting");
  const C = 2 * Math.PI * 6;
  const text = syncLabel(online, items);
  return (
    <button type="button" onClick={onClick} aria-label={`Sync: ${text}`} className={cn("group relative flex h-touch shrink-0 cursor-pointer items-center rounded-control px-1 ad-press active:scale-[0.97] data-pressed:scale-[0.97]", className)}>
      <span className="flex h-8 items-center gap-2 rounded-full bg-fill px-bubble-sm text-[13px] tabular-nums text-ink transition-colors duration-[150ms] group-focus-visible:bg-fill-strong [@media(hover:hover)]:group-hover:bg-fill-strong">
        <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" className="-rotate-90">
          <circle cx="8" cy="8" r="6" fill="none" strokeWidth="2" className="stroke-fill-strong" />
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={!online ? C : sending && total ? C * (1 - done / total) : 0}
            className="stroke-ink transition-[stroke-dashoffset] duration-[320ms] ease-ad motion-reduce:transition-none"
          />
        </svg>
        <span>{text}</span>
      </span>
    </button>
  );
}

const ROW_ICON = { waiting: Clock, sending: RefreshCw, done: Check, failed: WifiOff };
const ROW_TEXT = { waiting: "Waiting", sending: "Sending", done: "Sent", failed: "Not sent" };

export interface MobileSyncSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SyncItem[];
  onRetry?: () => void;
}

/** What is still on this phone, in order, each with its state. */
export function MobileSyncSheet({ open, onOpenChange, items, onRetry }: MobileSyncSheetProps) {
  const failed = items.some((i) => i.state === "failed");
  return (
    <MobileSheet open={open} onOpenChange={onOpenChange} title="Changes on this phone" footer={failed ? <Button variant="primary" onClick={onRetry}>Try again</Button> : undefined}>
      {items.length ? (
        <MobileList>
          {items.map((i) => {
            const Icon = ROW_ICON[i.state];
            return <MobileListRow key={i.id} media={<Icon className={cn(i.state === "sending" && "animate-spin motion-reduce:animate-none [animation-duration:1400ms]")} />} title={i.title} value={ROW_TEXT[i.state]} />;
          })}
        </MobileList>
      ) : (
        <p className="grid h-24 place-items-center text-[15px] text-ink-muted">All synced</p>
      )}
    </MobileSheet>
  );
}
