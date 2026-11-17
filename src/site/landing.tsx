import * as React from "react";
import { ArrowRight, ArrowUpRight } from "react-feather";
import { cn, formatRp } from "@/lib/ad";
import { radii } from "@/lib/config";
import { ITEMS, findItem } from "@/lib/registry";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart } from "@/components/ui/bar-chart";
import { Status } from "@/components/ui/status";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "@/components/ui/toast";
import { SLink, shapedSupported, useConfig } from "./config";
import { CornerControl, RadiusControl, SmoothingControl } from "./config-panel";
import { Wordmark } from "./layout";
import { GalleryGrid } from "./gallery";
import { DEMOS } from "./demos";
import { HOURLY } from "./data";

/* The signature visual: card > panel > pill > button, every corner concentric. No halo around it. */
function ConcentricStack() {
  const [config] = useConfig();
  const r = radii(config, shapedSupported());
  const zero = config.corner === "square";
  const pad = { pill: 5, panel: 14, card: 16 };
  const r0 = r.control;
  const r1 = zero ? 0 : r0 + pad.pill;
  const r2 = zero ? 0 : r1 + pad.panel;
  const r3 = zero ? 0 : r2 + pad.card;
  const ease = "transition-[border-radius] duration-[220ms] ease-ad";
  return (
    <div className={cn("w-full max-w-[500px] bg-surface shadow-raised", ease)} style={{ borderRadius: r3, padding: pad.card }}>
      <div className={cn("bg-fill", ease)} style={{ borderRadius: r2, padding: pad.panel }}>
        <div className="flex items-start justify-between gap-3 px-1">
          <div className="grid gap-0.5">
            <span className="text-body text-ink-muted">Sales today</span>
            <span className="text-number font-semibold tabular-nums">{formatRp(48240000)}</span>
          </div>
          <Avatar name="Rizky Hartono" size="sm" className="mt-0.5 bg-surface" />
        </div>
        <BarChart data={HOURLY} height={92} current={6} labelEvery={3} className="mt-4 px-1" aria-label="Sales by hour" />
        <div className={cn("mt-4 flex items-center justify-between gap-3 bg-surface shadow-card", ease)} style={{ borderRadius: r1, padding: pad.pill, paddingLeft: 14 }}>
          <Status tone="attention">3 orders to pack</Status>
          <Button variant="primary" onClick={() => toast("3 orders packed")}>
            Pack orders
          </Button>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 pb-14 pt-14 sm:px-6 lg:pb-20 lg:pt-24">
      <h1 className="max-w-[13ch] text-[clamp(44px,7.2vw,88px)] font-semibold leading-[0.98] tracking-[-0.035em] text-ink">UI parts for shops that sell everywhere.</h1>
      <div className="mt-10">
        <Button variant="primary" asChild>
          <SLink to="/gallery">
            Explore gallery
            <ArrowRight />
          </SLink>
        </Button>
      </div>
    </section>
  );
}

function SectionTitle({ children, to }: { children: React.ReactNode; to?: string }) {
  return (
    <div className="mb-5 flex min-h-control items-center justify-between gap-3">
      <h2 className="text-[clamp(24px,3vw,32px)] font-semibold tracking-[-0.02em] text-ink">{children}</h2>
      {to ? (
        <Button variant="ghost" asChild>
          <SLink to={to}>
            Open gallery
            <ArrowRight />
          </SLink>
        </Button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------ the gallery, right away */

function Components() {
  const items = ITEMS.filter((i) => i.group !== "Niche");
  return (
    <section aria-label="Components" className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">
      <SectionTitle to="/gallery">Components</SectionTitle>
      <GalleryGrid items={items} className="xl:grid-cols-4" />
    </section>
  );
}

/* ------------------------------------------------------------ spotlight: the niche ones, live */

const SPOT: [string, string][] = [
  ["command-palette", "lg:col-span-4"],
  ["date-range-picker", "lg:col-span-4"],
  ["shop-picker", "lg:col-span-4"],
  ["fee-row", "lg:col-span-6"],
  ["diff", "lg:col-span-6"],
  ["comment-thread", "lg:col-span-5"],
  ["kanban-card", "lg:col-span-7"],
  ["calendar-month", "lg:col-span-8"],
  ["timeline", "lg:col-span-4"],
  ["inline-edit", "lg:col-span-6"],
  ["context-menu", "lg:col-span-6"],
  ["split-button", "lg:col-span-4"],
  ["toggle-group", "lg:col-span-4"],
  ["notification-bell", "lg:col-span-4"],
  ["quantity-stepper", "lg:col-span-6"],
  ["currency-input", "lg:col-span-3"],
  ["time-picker", "lg:col-span-3"],
  ["sparkline", "lg:col-span-5"],
  ["progress-ring", "lg:col-span-4"],
  ["steps", "lg:col-span-3"],
  ["dropzone", "lg:col-span-5"],
  ["tag-input", "lg:col-span-4"],
  ["column-menu", "lg:col-span-3"],
  ["hover-card", "lg:col-span-4"],
  ["copy-chip", "lg:col-span-4"],
  ["avatar-group", "lg:col-span-4"],
  ["kbd", "lg:col-span-4"],
  ["marketplace-mark", "lg:col-span-4"],
];

function SpotTile({ name, className }: { name: string; className?: string }) {
  const item = findItem(name);
  const demo = DEMOS[name];
  const [config] = useConfig();
  if (!item || !demo) return null;
  const p = Object.fromEntries((demo.controls ?? []).map((c) => [c.key, c.default]));
  return (
    <Card inset="nest" className={cn("flex min-w-0 flex-col", className)}>
      <div className="flex h-control items-center justify-between gap-2 pl-2">
        <h3 className="truncate text-body font-medium text-ink">{item.title}</h3>
        <Button variant="ghost" icon asChild aria-label={`Open ${item.title}`}>
          <SLink to={`/gallery/${name}`}>
            <ArrowUpRight />
          </SLink>
        </Button>
      </div>
      <div
        className={cn(
          "mt-nest flex min-h-40 flex-1 items-center justify-center overflow-hidden rounded-item p-5",
          demo.stage === "page" ? "bg-page" : "bg-surface",
        )}
      >
        {demo.render(p, config)}
      </div>
    </Card>
  );
}

function Spotlight() {
  return (
    <section aria-label="Niche components" className="mx-auto mt-24 w-full max-w-[1280px] px-4 sm:px-6">
      <SectionTitle>The niche ones</SectionTitle>
      <div className="grid grid-flow-dense grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
        {SPOT.map(([n, c]) => (
          <SpotTile key={n} name={n} className={cn(c, ["calendar-month", "kanban-card", "fee-row", "diff", "inline-edit", "context-menu"].includes(n) && "md:col-span-2")} />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ the concentric demo, at the bottom */

function CornersDemo() {
  const [config, setConfig] = useConfig();
  return (
    <section className="mx-auto mt-24 grid w-full max-w-[1280px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_540px] lg:gap-16">
      <div className="grid max-w-[460px] gap-8">
        <h2 className="text-[clamp(36px,5vw,60px)] font-semibold leading-[1] tracking-[-0.03em] text-ink">Corners that agree.</h2>
        <div className="grid gap-4 sm:max-w-[380px]">
          <CornerControl value={config} onChange={setConfig} />
          <SmoothingControl value={config} onChange={setConfig} />
          <RadiusControl value={config} onChange={setConfig} />
        </div>
      </div>
      <div className="flex justify-center lg:justify-end">
        <ConcentricStack />
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto mt-24 w-full max-w-[1280px] px-4 pb-10 sm:px-6">
      <div className="flex flex-col gap-8 rounded-sheet bg-surface p-pad shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="grid gap-4">
          <Wordmark className="text-[20px]" />
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-body text-ink-muted">
            <SLink to="/gallery" className="hover:text-ink">
              Gallery
            </SLink>
            <SLink to="/examples/dashboard" className="hover:text-ink">
              Examples
            </SLink>
            <SLink to="/export" className="hover:text-ink">
              Export
            </SLink>
          </nav>
        </div>
        <div>
          <Button variant="primary" asChild>
            <SLink to="/gallery">
              Explore gallery
              <ArrowRight />
            </SLink>
          </Button>
        </div>
      </div>
      <p className="mt-6 px-1 text-small text-ink-muted">© 2026 Alora</p>
    </footer>
  );
}

export function Landing() {
  return (
    <main>
      <Hero />
      <Components />
      <Spotlight />
      <CornersDemo />
      <Footer />
    </main>
  );
}
