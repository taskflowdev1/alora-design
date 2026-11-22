// Showpiece batch I (ERP workflow): page demos and Components-page tiles for its new components (inside a Mark, exactly
// once), and its landing moments. Aggregated in ./index.ts.
import * as React from "react";
import { MoreHorizontal } from "react-feather";
import { cn, formatRp, prefersReducedMotion } from "@/lib/ad";
import { ApprovalFlow } from "@/components/ui/approval-flow";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { KanbanBoard, type KanbanBoardCard } from "@/components/ui/kanban-card";
import { Menu, MenuItem, MenuLabel } from "@/components/ui/menu";
import { NotificationBell, type Notice } from "@/components/ui/notification-bell";
import { StatusSelect } from "@/components/ui/status-select";
import { Thumb } from "@/components/ui/thumb";
import type { Demo } from "../demos";
import { Mark, S, type TileDef } from "../mark";
import type { ShowpieceMoment } from "./types";

/** Keeps a press on a playable piece from also opening its page. */
const Play = ({ children }: { children: React.ReactNode }) => (
  <div className="contents" onClick={(e) => e.stopPropagation()}>
    {children}
  </div>
);

/** A reset sits outside the piece, in a slot whose height is always kept, so nothing moves when it appears. */
const Again = ({ show, onClick }: { show: boolean; onClick: () => void }) => (
  <div className="flex h-control items-center justify-center">
    {show ? (
      <Button size="sm" variant="ghost" onClick={onClick} className="animate-[ad-fade-in_220ms_var(--ad-ease)_both]">
        Start over
      </Button>
    ) : null}
  </div>
);

const ORDERS = [
  { id: "RMB-24817", name: "Gelas kopi tanah liat", photo: "/photos/cup-terracotta.webp", total: 1250000, status: "packed" },
  { id: "RMB-24818", name: "Keranjang pandan besar", photo: "/photos/products/kr-1.webp", total: 478000, status: "packed" },
  { id: "RMB-24819", name: "Taplak meja tenun ikat", photo: "/photos/products/tp-1.webp", total: 329000, status: "paid" },
  { id: "RMB-24820", name: "Vas keramik glasir hijau", photo: "/photos/products/vs-2.webp", total: 630000, status: "packed" },
  { id: "RMB-24821", name: "Piring rotan bundar", photo: "/photos/products/pr-2.webp", total: 435000, status: "paid" },
  { id: "RMB-24822", name: "Nampan anyaman bambu", photo: "/photos/products/np-1.webp", total: 175000, status: "packed" },
];
const ALL_IDS = ORDERS.map((o) => o.id);
const START_STATUS = Object.fromEntries(ORDERS.map((o) => [o.id, o.status]));
const LIST_TOTAL = ORDERS.reduce((sum, o) => sum + o.total, 0);
/** The gap between one row and the next in a wave, in ms. */
const WAVE = 55;

/* ------------------------------------------------------------ Bulk action bar */

function BulkOrders({ className }: { className?: string }) {
  const [status, setStatus] = React.useState<Record<string, string>>(START_STATUS);
  const [ticked, setTicked] = React.useState<ReadonlySet<string>>(new Set());
  const [done, setDone] = React.useState<{ ids: string[]; before: Record<string, string> } | null>(null);
  const timers = React.useRef<number[]>([]);
  const stop = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  };
  React.useEffect(() => stop, []);

  const wave = (ids: string[], step: (id: string) => void) => {
    if (prefersReducedMotion()) return ids.forEach(step);
    ids.forEach((id, i) => timers.current.push(window.setTimeout(() => step(id), i * WAVE)));
  };
  const toggle = (id: string) =>
    setTicked((t) => {
      const next = new Set(t);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const ship = () => {
    stop();
    const ids = ALL_IDS.filter((id) => ticked.has(id));
    setDone({ ids, before: Object.fromEntries(ids.map((id) => [id, status[id]])) });
    wave(ids, (id) => {
      setTicked((t) => {
        const next = new Set(t);
        next.delete(id);
        return next;
      });
      setStatus((s) => ({ ...s, [id]: "shipped" }));
    });
  };
  const undo = () => {
    if (!done) return;
    stop();
    const { ids, before } = done;
    setDone(null);
    setTicked(new Set(ids));
    wave(ids, (id) => setStatus((s) => ({ ...s, [id]: before[id] })));
  };
  const reset = () => {
    stop();
    setDone(null);
    setTicked(new Set());
    setStatus(START_STATUS);
  };

  const all = ticked.size === ALL_IDS.length;
  const moved = !done && ALL_IDS.some((id) => status[id] !== START_STATUS[id]);
  const onKeys = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const boxes = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[role=checkbox]"));
    const at = boxes.indexOf(document.activeElement as HTMLElement);
    if (at < 0) return;
    e.preventDefault();
    boxes[at + (e.key === "ArrowDown" ? 1 : -1)]?.focus();
  };

  return (
    <div className={cn("grid w-full gap-3", className)}>
      <Card inset="nest" className="relative grid overflow-hidden">
        <div className="flex h-item items-center gap-2.5 px-2 text-small text-ink-muted">
          <Checkbox
            aria-label="Select all orders"
            checked={all ? true : ticked.size ? "indeterminate" : false}
            onCheckedChange={() => setTicked(all ? new Set() : new Set(ALL_IDS))}
          />
          <span className="min-w-0 flex-1 pl-[calc(28px+0.625rem)]">Order</span>
          <span className="w-[84px] shrink-0">Status</span>
          <span className="w-[92px] shrink-0 text-right max-sm:hidden">Total</span>
        </div>
        <ul className="grid gap-px" onKeyDown={onKeys}>
          {ORDERS.map((o) => {
            const on = ticked.has(o.id);
            return (
              <li key={o.id} onClick={() => toggle(o.id)} className="relative flex h-row cursor-pointer select-none items-center gap-2.5 rounded-item px-2 hover:bg-fill">
                {/* The selection is a fill that collapses to the left when the row is done. */}
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-item bg-fill-strong transition-[clip-path] duration-[240ms] ease-ad motion-reduce:transition-none"
                  style={{ clipPath: on ? "inset(0 0 0 0 round var(--ad-radius-item))" : "inset(0 100% 0 0 round var(--ad-radius-item))" }}
                />
                <span className="relative grid place-items-center" onClick={(e) => e.stopPropagation()}>
                  <Checkbox aria-label={`Select ${o.id}`} checked={on} onCheckedChange={() => toggle(o.id)} />
                </span>
                <Thumb src={o.photo} alt="" size={28} className="relative" />
                <span className="relative min-w-0 flex-1 truncate text-body text-ink">{o.name}</span>
                <span className="relative flex w-[84px] shrink-0">
                  <StatusSelect readOnly value={status[o.id]} />
                </span>
                <span className="relative w-[92px] shrink-0 text-right text-body tabular-nums text-ink max-sm:hidden">{formatRp(o.total)}</span>
              </li>
            );
          })}
        </ul>
        {/* The list's own footer: the bar rises over it, so ticking a row moves nothing. */}
        <div className="flex h-[calc(var(--ad-item-h)+var(--ad-nest)*2)] items-center justify-between px-2 text-body text-ink-muted">
          <span>{ALL_IDS.length} orders</span>
          <span className="tabular-nums text-ink">{formatRp(LIST_TOTAL)}</span>
        </div>
        <BulkActionBar
          count={ticked.size}
          actions={
            <Button size="sm" variant="primary" onClick={ship}>
              Mark shipped
            </Button>
          }
          onClear={() => setTicked(new Set())}
          done={done ? `${done.ids.length} ${done.ids.length === 1 ? "order" : "orders"} shipped` : undefined}
          onUndo={undo}
          onExpire={() => setDone(null)}
        />
      </Card>
      <Again show={moved} onClick={reset} />
    </div>
  );
}

/* ------------------------------------------------------------ Status changer */

function StatusRows({ className }: { className?: string }) {
  return (
    <Card inset="nest" className={cn("grid w-full gap-px", className)}>
      {ORDERS.slice(0, 3).map((o, i) => (
        <div key={o.id} className="flex items-center gap-2.5 rounded-item px-2 py-1.5">
          <Thumb src={o.photo} alt="" size={32} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body font-medium text-ink">{o.name}</span>
            <span className="block truncate text-small tabular-nums text-ink-muted">{formatRp(o.total)}</span>
          </span>
          {/* As wide as the widest status, so the pill's morph never moves the name. */}
          <span className="flex w-[112px] shrink-0 justify-end">
            <StatusSelect aria-label={`Status of ${o.id}`} defaultValue={["unpaid", "paid", "packed"][i]} />
          </span>
        </div>
      ))}
    </Card>
  );
}

/* ------------------------------------------------------------ Approval flow */

function ApprovalScene({ className }: { className?: string }) {
  const [run, setRun] = React.useState(0);
  const [approved, setApproved] = React.useState(false);
  return (
    <div className={cn("grid w-full gap-3", className)}>
      <Card>
        <ApprovalFlow key={run} onApprovedChange={setApproved} />
      </Card>
      <Again show={approved} onClick={() => setRun((r) => r + 1)} />
    </div>
  );
}

/* ------------------------------------------------------------ Kanban */

const BOARD_COLUMNS = [
  { id: "new", title: "New" },
  { id: "packing", title: "Packing" },
  { id: "shipped", title: "Shipped" },
];
const boardCard = (i: number, column: string): KanbanBoardCard => ({
  id: ORDERS[i].id,
  column,
  title: ORDERS[i].name,
  media: <Thumb src={ORDERS[i].photo} alt="" size={32} />,
});
const BOARD_CARDS = [boardCard(0, "new"), boardCard(1, "new"), boardCard(2, "new"), boardCard(3, "packing"), boardCard(4, "packing"), boardCard(5, "shipped")];

function KanbanScene({ className }: { className?: string }) {
  const [run, setRun] = React.useState(0);
  const [moved, setMoved] = React.useState(false);
  return (
    <div className={cn("grid w-full gap-3", className)}>
      <KanbanBoard
        key={run}
        columns={BOARD_COLUMNS}
        defaultCards={BOARD_CARDS}
        height={286}
        onMove={() => setMoved(true)}
        moveMenu={(card, targets, move) => (
          <Menu
            align="end"
            className="min-w-36"
            trigger={
              <Button icon size="sm" variant="ghost" aria-label={`Move ${card.id}`} className="size-[24px] rounded-item">
                <MoreHorizontal />
              </Button>
            }
          >
            <MenuLabel>Move to</MenuLabel>
            {targets.map((t) => (
              <MenuItem key={t.id} onSelect={() => move(t.id)}>
                {t.title}
              </MenuItem>
            ))}
          </Menu>
        )}
      />
      <Again
        show={moved}
        onClick={() => {
          setRun((r) => r + 1);
          setMoved(false);
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------ Notification inbox */

const NOTICES: Notice[] = [
  { id: "n1", title: <>Payout of {formatRp(12840000)} sent</>, time: "Today, 10:12", unread: true },
  { id: "n2", title: "Keranjang pandan besar is out of stock", time: "Today, 09:40", unread: true },
  { id: "n3", title: "Sari adjusted stock for Vas keramik", time: "Today, 08:55", unread: true },
  { id: "n4", title: "Dewi approved PO-1042", time: "Today, 08:02", unread: true },
  { id: "n5", title: "2 shops haven’t synced since 07:30", time: "Yesterday, 19:45" },
  { id: "n6", title: "Rizky changed the courier for Kemang", time: "Yesterday, 15:20" },
];

function InboxScene({ className }: { className?: string }) {
  const [list, setList] = React.useState(NOTICES);
  const cleared = !list.some((n) => n.unread);
  return (
    <div className={cn("grid w-full gap-3", className)}>
      {/* Tall enough for the open panel, so opening it moves nothing below. */}
      <div className="h-[416px]">
        <Card className="relative flex h-[calc(var(--ad-control-h)+var(--ad-nest)*4)] items-center justify-between py-0 pl-pad pr-[calc(var(--ad-nest)*2)]">
          <span className="text-title font-semibold text-ink">Rimba Kemang</span>
          <NotificationBell
            inline
            defaultOpen
            unreadFill
            notices={list}
            listHeight={306}
            onMarkAllRead={() => setList((l) => l.map((n) => ({ ...n, unread: false })))}
            panelClassName="inset-x-0 w-auto"
          />
        </Card>
      </div>
      <Again show={cleared} onClick={() => setList(NOTICES)} />
    </div>
  );
}

/* ------------------------------------------------------------ Registry wiring */

export const DEMOS: Record<string, Demo> = {
  "bulk-action-bar": {
    stage: "page",
    render: () => <BulkOrders className="max-w-[600px]" />,
    usage: () =>
      `<div className="relative">\n  {/* your list */}\n  <BulkActionBar\n    count={ticked.size}\n    actions={<Button size="sm" variant="primary" onClick={ship}>Mark shipped</Button>}\n    onClear={clear}\n    done={shipped ? "3 orders shipped" : undefined}\n    onUndo={undo}\n    onExpire={settle}\n  />\n</div>`,
  },
  "status-select": {
    stage: "page",
    render: () => <StatusRows className="max-w-[460px]" />,
    usage: () => `<StatusSelect value={status} onValueChange={setStatus} />\n<StatusSelect readOnly value={status} /> {/* a table cell */}`,
  },
  "approval-flow": {
    stage: "page",
    render: () => <ApprovalScene className="max-w-[520px]" />,
    usage: () =>
      `<ApprovalFlow\n  title="Gelas kopi tanah liat, 200 pcs"\n  code="PO-1042"\n  amount={17800000}\n  people={[{ role: "Requested", name: "Rizky" }, { role: "Manager", name: "Sari" }, { role: "Finance", name: "Dewi" }]}\n  onDecision={save}\n/>`,
  },
};

export const TILES: TileDef[] = [
  {
    items: ["bulk-action-bar"],
    render: () => (
      <Mark name="bulk-action-bar" className={S[6]}>
        <Play>
          <BulkOrders />
        </Play>
      </Mark>
    ),
  },
  {
    items: ["status-select"],
    render: () => (
      <Mark name="status-select" className={S[4]}>
        <Play>
          <StatusRows />
        </Play>
      </Mark>
    ),
  },
  {
    items: ["approval-flow"],
    render: () => (
      <Mark name="approval-flow" className={S[6]}>
        <Play>
          <ApprovalScene />
        </Play>
      </Mark>
    ),
  },
];

export const MOMENTS: ShowpieceMoment[] = [
  { id: "bulk-action-bar", title: "Bulk action bar", to: "/components/bulk-action-bar", width: "max-w-[600px]", render: () => <BulkOrders /> },
  { id: "status-select", title: "Status changer", to: "/components/status-select", width: "max-w-[460px]", render: () => <StatusRows /> },
  { id: "approval-flow", title: "Approval flow", to: "/components/approval-flow", width: "max-w-[520px]", render: () => <ApprovalScene /> },
  { id: "kanban-board", title: "Kanban board", to: "/components/kanban-card", width: "max-w-[760px]", render: () => <KanbanScene /> },
  { id: "notification-inbox", title: "Notification inbox", to: "/components/notification-bell", width: "max-w-[420px]", render: () => <InboxScene /> },
];
