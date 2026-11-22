// Showpiece batch D: each component's page demo, its tile on the Components page (inside a Mark, exactly once)
// and its moment on the landing. Aggregated in ./index.ts.
import * as React from "react";
import { RotateCcw } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DustDelete } from "@/components/ui/dust-delete";
import { FlipCountdown, type FlipCountdownHandle } from "@/components/ui/flip-countdown";
import { SaveMorph } from "@/components/ui/save-morph";
import { SlaFuse } from "@/components/ui/sla-fuse";
import { StatusIsland } from "@/components/ui/status-island";
import { Thumb } from "@/components/ui/thumb";
import { UndoFuse } from "@/components/ui/undo-fuse";
import { itemPhoto } from "../data";
import type { Demo } from "../demos";
import { Mark, Tile, type TileDef } from "../mark";
import type { ShowpieceMoment } from "./types";

const CUP = itemPhoto("Gelas kopi");

/** True while the element is in the middle of the screen, so a timed piece doesn't run out before anyone reaches it. */
function useCentered<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([entry]) => setOn(entry.isIntersecting), { rootMargin: "-22% 0px -22% 0px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, on] as const;
}

/** A quiet control under a piece that starts it over. */
function Quiet({ label = "Reset", onClick }: { label?: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="text-ink-muted" onClick={onClick}>
      <RotateCcw strokeWidth={1.75} aria-hidden />
      {label}
    </Button>
  );
}

function SaveScene({ fail = false, className }: { fail?: boolean; className?: string }) {
  const [price, setPrice] = React.useState<number | null>(89000);
  const [saved, setSaved] = React.useState<number | null>(85000);
  const save = () =>
    new Promise<void>((resolve, reject) =>
      window.setTimeout(() => {
        if (fail) return reject(new Error("Save failed"));
        setSaved(price);
        resolve();
      }, 900),
    );
  return (
    <Card className={cn("grid w-full max-w-[440px] gap-4", className)}>
      <div className="flex items-center gap-4">
        <Thumb src={CUP} alt="" size={48} />
        <span className="min-w-0 flex-1 truncate text-title font-medium">Gelas kopi tanah liat</span>
      </div>
      <div className="flex items-center gap-gap">
        <CurrencyInput aria-label="Price" value={price} onValueChange={setPrice} className="min-w-0 flex-1" />
        <SaveMorph dirty={price !== saved} onSave={save} />
      </div>
    </Card>
  );
}

function UndoScene({ duration, className }: { duration?: number; className?: string }) {
  const [run, setRun] = React.useState(0);
  const [closed, setClosed] = React.useState(false);
  const [ref, centered] = useCentered<HTMLDivElement>();
  return (
    <div ref={ref} className={cn("grid w-full justify-items-center", className)}>
      <div className="col-start-1 row-start-1 grid w-full justify-items-center">
        <UndoFuse key={run} duration={duration} paused={!centered} onClosed={() => setClosed(true)} />
      </div>
      {closed && (
        <div className="col-start-1 row-start-1 grid h-12 place-items-center">
          <Quiet
            label="Archive again"
            onClick={() => {
              setClosed(false);
              setRun((n) => n + 1);
            }}
          />
        </div>
      )}
    </div>
  );
}

function FlipScene({ seconds = 24, className }: { seconds?: number; className?: string }) {
  const clock = React.useRef<FlipCountdownHandle>(null);
  return (
    <div className={cn("grid w-full justify-items-center gap-4", className)}>
      <FlipCountdown ref={clock} seconds={seconds} loop />
      <div className="flex items-center gap-gap">
        <Button variant="ghost" size="sm" className="text-ink-muted" onClick={() => clock.current?.setSeconds(10)}>
          Last 10 seconds
        </Button>
        <Quiet onClick={() => clock.current?.setSeconds(seconds)} />
      </div>
    </div>
  );
}

function FuseScene({ speed = 60, className }: { speed?: number; className?: string }) {
  const [run, setRun] = React.useState(0);
  const [ref, centered] = useCentered<HTMLDivElement>();
  return (
    <div ref={ref} className={cn("grid w-full justify-items-center gap-3", className)}>
      <SlaFuse key={run} speed={speed} paused={!centered} />
      <Quiet onClick={() => setRun((n) => n + 1)} />
    </div>
  );
}

function DustScene({ tone, title, className }: { tone?: "surface" | "fill"; title?: string; className?: string }) {
  return (
    <div className={cn("grid w-full justify-items-center py-6", className)}>
      <DustDelete image={CUP} title={title} tone={tone} />
    </div>
  );
}

export const DEMOS: Record<string, Demo> = {
  "status-island": {
    render: () => <StatusIsland />,
    usage: () => `// A press plays it: idle, syncing, progress, done.\n<StatusIsland idleLabel="Sync 7 shops" doneLabel="248 products synced" />\n\n// Or drive it yourself:\n<StatusIsland status={status} progress={uploaded / total} onStatusChange={setStatus} />`,
  },
  "save-morph": {
    controls: [{ key: "fail", type: "toggle", label: "Save fails", default: false }],
    render: (p) => <SaveScene key={String(p.fail)} fail={!!p.fail} />,
    usage: () => `<SaveMorph label="Save changes" doneLabel="Saved" dirty={draft !== saved} onSave={() => api.saveProduct(draft)} />`,
  },
  "dust-delete": {
    render: () => <DustScene />,
    usage: () => `<DustDelete title="Gelas kopi tanah liat" price="Rp 89.000" image={photo} onDelete={remove} onUndo={restore} />`,
  },
  "undo-fuse": {
    controls: [{ key: "duration", type: "select", label: "Time", options: ["4000", "6000", "10000"], labels: ["4 s", "6 s", "10 s"], default: "6000" }],
    render: (p) => <UndoScene key={String(p.duration)} duration={Number(p.duration)} />,
    usage: (p) => `<UndoFuse key={action.id} label="Order INV-20841 archived" duration={${p.duration}} onUndo={restore} onExpire={commit} />`,
  },
  "flip-countdown": {
    render: () => <FlipScene />,
    usage: () => `<FlipCountdown endsAt={promo.endsAt} onComplete={closePromo} />\n\n// Or a plain count:\n<FlipCountdown seconds={3600} />`,
  },
  "sla-fuse": {
    controls: [{ key: "speed", type: "select", label: "Speed", options: ["1", "60", "180"], labels: ["Real time", "60×", "180×"], default: "60" }],
    render: (p) => <FuseScene key={String(p.speed)} speed={Number(p.speed)} />,
    usage: (p) => `<SlaFuse order="INV-20841" item="Gelas kopi tanah liat × 2" total={2700} remaining={2340}${p.speed !== "1" ? ` speed={${p.speed}}` : ""} onShip={ship} />`,
  },
};

const stop = (e: React.MouseEvent) => e.stopPropagation();

export const TILES: TileDef[] = [
  {
    items: ["status-island"],
    render: (_, c) => (
      <Tile inset="pad" className={c}>
        <h3 className="text-title font-semibold">Sync status</h3>
        <Mark name="status-island" className="grid flex-1 place-items-center">
          <StatusIsland />
        </Mark>
      </Tile>
    ),
  },
  {
    items: ["save-morph"],
    render: (_, c) => (
      <Tile inset="pad" className={c}>
        <h3 className="text-title font-semibold">Save</h3>
        <Mark name="save-morph" className="grid flex-1 place-items-center py-6">
          <SaveMorph size="lg" />
        </Mark>
      </Tile>
    ),
  },
  {
    items: ["undo-fuse"],
    render: (_, c) => (
      <Tile inset="pad" className={c}>
        <h3 className="text-title font-semibold">Undo</h3>
        <Mark name="undo-fuse" className="grid flex-1 place-items-center py-6">
          <UndoScene />
        </Mark>
      </Tile>
    ),
  },
  {
    items: ["dust-delete"],
    render: (_, c) => (
      <Tile inset="pad" className={c}>
        <h3 className="text-title font-semibold">Delete</h3>
        <Mark name="dust-delete" className="grid flex-1 place-items-center">
          <div className="contents" onClick={stop}>
            <DustScene tone="fill" title="Gelas kopi" />
          </div>
        </Mark>
      </Tile>
    ),
  },
  {
    items: ["flip-countdown"],
    render: (_, c) => (
      <Tile inset="pad" className={c}>
        <h3 className="text-title font-semibold">Flash sale</h3>
        <Mark name="flip-countdown" className="grid flex-1 place-items-center">
          <FlipScene />
        </Mark>
      </Tile>
    ),
  },
  {
    items: ["sla-fuse"],
    render: (_, c) => (
      <div className={cn(c, "grid min-w-0")}>
        <Mark name="sla-fuse" className="grid">
          <div className="contents" onClick={stop}>
            <SlaFuse speed={60} className="max-w-none" />
          </div>
        </Mark>
      </div>
    ),
  },
];

export const MOMENTS: ShowpieceMoment[] = [
  { id: "status-island", title: "Morphing status island", to: "/components/status-island", width: "max-w-[420px] justify-items-center", render: () => <StatusIsland /> },
  { id: "save-morph", title: "Save button morph", to: "/components/save-morph", width: "max-w-[440px] justify-items-center", render: () => <SaveScene /> },
  { id: "dust-delete", title: "Dust dissolve delete", to: "/components/dust-delete", width: "max-w-[440px] justify-items-center", render: () => <DustScene /> },
  { id: "undo-fuse", title: "Undo fuse pill", to: "/components/undo-fuse", width: "max-w-[420px] justify-items-center", render: () => <UndoScene /> },
  { id: "flip-countdown", title: "Flip countdown", to: "/components/flip-countdown", width: "max-w-[640px] justify-items-center", render: () => <FlipScene /> },
  { id: "sla-fuse", title: "SLA burning fuse", to: "/components/sla-fuse", width: "max-w-[520px] justify-items-center", render: () => <FuseScene /> },
];
