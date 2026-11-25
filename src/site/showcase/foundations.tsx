import * as React from "react";
import { formatRp } from "@/lib/ad";
import { radii, squircleCompensation, type Config } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { shapedSupported } from "../config";
import { useEdgeFadeX } from "../layout";
import { ORDERS, smartTime } from "../data";
import { Mark, Tile } from "../mark";

export function CornerTile({ config, className }: { config: Config; className?: string }) {
  const r = Math.max(config.radius, 1) * 2;
  const comp = shapedSupported() ? squircleCompensation(config.smoothing) : 1;
  const shapes: { key: Config["corner"]; label: string; css: string; radius: number }[] = [
    { key: "square", label: "Square", css: "square", radius: 0 },
    { key: "round", label: "Round", css: "round", radius: r },
    { key: "squircle", label: "Squircle", css: config.smoothing === 2 ? "squircle" : `superellipse(${config.smoothing})`, radius: Math.min(64, Math.round(r * comp)) },
  ];
  const rr = radii(config, shapedSupported());
  return (
    <Tile inset="pad" className={className}>
      <Mark name="corner-shape" className="flex flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-6">
          {shapes.map((s) => (
            <div key={s.key} className="grid justify-items-start gap-1.5">
              <div className="size-20 bg-brand sm:size-24" style={{ borderRadius: s.radius, cornerShape: s.css } as React.CSSProperties} />
              <span className="text-body font-medium">{s.label}</span>
              <span className="text-small tabular-nums text-ink-muted">{s.radius} px</span>
            </div>
          ))}
        <div className="grid justify-items-start gap-1.5">
          <div className="rounded-card bg-fill p-nest">
            <Button variant="primary">Save changes</Button>
          </div>
          <span className="text-body font-medium">Concentric</span>
          <span className="text-small tabular-nums text-ink-muted">
            {rr.control} + {rr.gap} = {rr.card} px
          </span>
        </div>
      </Mark>
    </Tile>
  );
}

/** Whole rows only: the scroll area is as many rows tall as fit the tile, and sits centred in it. */
export function ScrollTile({ className }: { className?: string }) {
  const box = React.useRef<HTMLDivElement>(null);
  const scroller = React.useRef<HTMLDivElement>(null);
  useEdgeFadeX(scroller);
  const [fit, setFit] = React.useState<{ h: number; top: number } | null>(null);
  React.useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const row = (el.querySelector("[data-row]") as HTMLElement | null)?.offsetHeight ?? 36;
      const H = el.clientHeight;
      const n = Math.max(3, Math.floor((H + 1) / (row + 1)));
      const h = n * row + (n - 1);
      setFit({ h, top: Math.max(0, Math.floor((H - h) / 2)) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <Tile className={className}>
      <Mark name="scrollbar" className="flex flex-1 flex-col">
        <div ref={box} className="relative min-h-[calc(var(--spacing-row)*3+2px)] flex-1">
          <div ref={scroller} className="absolute inset-x-0 overflow-auto rounded-item" style={{ top: fit?.top ?? 0, height: fit?.h ?? "100%" }}>
            <div className="grid w-[560px] gap-px">
              {ORDERS.slice(0, 14).map((o) => (
                <div key={o.id} data-row className="flex h-row shrink-0 items-center gap-5 rounded-item px-2 text-body hover:bg-fill">
                  <span className="w-24 shrink-0">{o.id}</span>
                  <span className="w-28 shrink-0 text-ink-muted">{smartTime(o.at)}</span>
                  <span className="w-48 truncate">{o.items}</span>
                  <span className="ml-auto tabular-nums">{formatRp(o.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Mark>
    </Tile>
  );
}
