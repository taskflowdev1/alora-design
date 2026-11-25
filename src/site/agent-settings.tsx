import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import type { AgentReport } from "./agent-data";

const KEEP = [
  { value: "forever", label: "Forever" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "180", label: "180 days" },
  { value: "365", label: "1 year" },
];

export function DataControls({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [saved, setSaved] = React.useState("forever");
  const [value, setValue] = React.useState(saved);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setValue(saved);
        onOpenChange(o);
      }}
      title="Data controls"
      footer={
        <Button
          variant="primary"
          disabled={value === saved}
          onClick={() => {
            setSaved(value);
            onOpenChange(false);
            toast("Saved");
          }}
        >
          Save
        </Button>
      }
    >
      <div className="flex items-center justify-between gap-3 text-body">
        <span className="text-ink-muted">Keep archived chats</span>
        <Select aria-label="Keep archived chats" align="end" value={value} onValueChange={setValue} options={KEEP} />
      </div>
    </Dialog>
  );
}

export function WhatsAppLink({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [state, setState] = React.useState<"off" | "code" | "on">("off");
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="WhatsApp"
      footer={
        state === "off" ? (
          <Button variant="primary" onClick={() => setState("code")}>
            Get a code
          </Button>
        ) : state === "code" ? (
          <Button variant="primary" onClick={() => setState("on")}>
            I sent it
          </Button>
        ) : (
          <Button onClick={() => setState("off")}>Disconnect</Button>
        )
      }
    >
      {state === "off" ? (
        <p className="m-0 text-body text-ink-muted">Ask about the shop and approve changes from WhatsApp.</p>
      ) : state === "code" ? (
        <div className="grid justify-items-center gap-1.5 py-2">
          <output className="text-number font-semibold tabular-nums tracking-[0.08em] text-ink">4821 7730</output>
          <p className="m-0 text-body text-ink-muted">Send this to +62 811 0000 2026</p>
        </div>
      ) : (
        <p className="m-0 inline-flex items-center gap-2 text-body text-ink">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
          Connected to …5521
        </p>
      )}
    </Dialog>
  );
}

export function ReportPreview({ report, onClose }: { report: AgentReport | null; onClose: () => void }) {
  const [shown, setShown] = React.useState(report);
  if (report && report !== shown) setShown(report);
  const money = (v: string) => {
    const [, n] = /^Rp\s?(.+)$/.exec(v) ?? [];
    return n ? (
      <>
        <span className="text-small text-ink-muted">Rp</span>
        {" "}
        {n}
      </>
    ) : (
      v
    );
  };
  return (
    <Dialog open={!!report} onOpenChange={(o) => !o && onClose()} title={shown?.title ?? ""} className="w-[min(520px,calc(100vw-32px))]">
      <div className="grid gap-0.5 rounded-card bg-fill p-1.5 text-body tabular-nums">
        {shown?.rows.map(([k, v]) => (
          <div key={k} className="flex h-item items-center justify-between gap-4 px-2">
            <span className="truncate text-ink-muted">{k}</span>
            <span className="shrink-0 text-ink">{money(v)}</span>
          </div>
        ))}
        {shown ? (
          <div className="flex h-item items-center justify-between gap-4 px-2 font-semibold">
            <span className="truncate text-ink">{shown.total[0]}</span>
            <span className="shrink-0 text-ink">{money(shown.total[1])}</span>
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}
