import * as React from "react";
import { useParams, useSearchParams } from "react-router";
import { Search as SearchIcon } from "react-feather";
import { cn } from "@/lib/ad";
import type { Config } from "@/lib/config";
import { ITEMS, findItem, sectionOf, type Item, type Param, type Section } from "@/lib/registry";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { TokenScope, useConfig } from "./config";
import { ConfigPanel } from "./config-panel";
import { GalleryLayout, ItemTabs, SpotGroups, TileSpot, installCommand, useBodyTokens, useSource } from "./gallery";
import { Composer } from "@/components/ai/composer-glow";
import { AgentApp, NewChat } from "./agent";
import { AI_DEMOS } from "./agent-demos";

type Values = Record<string, number | string | boolean>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = React.ComponentType<any>;

const MODULES = import.meta.glob("../components/{ai,backgrounds}/*.tsx", { eager: true }) as Record<string, Record<string, unknown>>;

/** The component an item's registry entry names (`export`) in its file. */
const componentOf = (item: Item) => MODULES[`../components/${item.dir}/${item.files[0]}`]?.[item.export ?? ""] as AnyComponent | undefined;

export type CollectionSection = Exclude<Section, "components" | "mobile">;
const SECTION_TITLE: Record<CollectionSection, string> = { ai: "AI", backgrounds: "Backgrounds" };
const itemsOf = (section: Section) => ITEMS.filter((i) => sectionOf(i) === section);

/** Param defaults, overridden by matching URL params (?size=48), so any state has a link. */
function paramValues(item: Item, params?: URLSearchParams): Values {
  return Object.fromEntries(
    (item.params ?? []).map((p) => {
      const raw = params?.get(p.key);
      if (raw == null) return [p.key, p.default];
      if (p.type === "range") {
        const n = Number(raw);
        return [p.key, Number.isFinite(n) ? Math.min(p.max, Math.max(p.min, n)) : p.default];
      }
      if (p.type === "toggle") return [p.key, raw === "1" || raw === "true"];
      if (p.type === "select") return [p.key, p.options.includes(raw) ? raw : p.default];
      return [p.key, raw];
    }),
  );
}

/** The item live, in the setting it is made for: alone, around a message box, or behind a new-chat screen. */
function CollectionPreview({ item, values, tall }: { item: Item; values: Values; tall?: boolean }) {
  const C = componentOf(item);
  if (!C) return null;
  const Demo = AI_DEMOS[item.name];
  if (Demo) return <Demo {...values} />;
  if (item.stage === "composer")
    return (
      <div className="w-full max-w-[520px] px-2 py-4">
        <C {...values}>
          <Composer working={!!values.working} placeholder="Ask about orders, stock or payouts" />
        </C>
      </div>
    );
  if (item.stage === "field")
    return (
      <div
        data-field-stage
        className={cn("relative isolate grid w-full place-items-center overflow-hidden rounded-sheet bg-surface px-4 py-12 shadow-card", tall ? "min-h-[clamp(440px,62dvh,620px)]" : "min-h-[clamp(420px,56dvh,560px)]")}
      >
        <C {...values} className="rounded-[inherit] bg-surface" />
        <NewChat />
      </div>
    );
  return <C {...values} />;
}

function usageOf(item: Item, values: Values) {
  if (item.usage) return item.usage;
  const attrs = (item.params ?? [])
    .filter((p) => p.type === "text" || values[p.key] !== p.default)
    .map((p) => {
      const v = values[p.key];
      if (typeof v === "string") return `${p.key}="${v}"`;
      if (typeof v === "boolean") return v ? p.key : `${p.key}={false}`;
      return `${p.key}={${v}}`;
    });
  const tag = `${item.export}${attrs.length ? ` ${attrs.join(" ")}` : ""}`;
  const imp = `import { ${item.export} } from "@/components/ui/${item.files[0].replace(/\.tsx$/, "")}";\n\n`;
  if (item.stage === "composer") return `${imp.replace(`{ ${item.export} }`, `{ Composer, ${item.export} }`)}<${tag}>\n  <Composer working={working} onSend={send} onStop={stop} />\n</${item.export}>`;
  if (item.stage === "field") return `${imp}<div className="relative">\n  <${tag} />\n  {/* your screen */}\n</div>`;
  return `${imp}<${tag} />`;
}

const fmt = (p: Extract<Param, { type: "range" }>, v: number) => {
  const decimals = String(p.step ?? 1).split(".")[1]?.length ?? 0;
  return `${v.toFixed(decimals)}${p.unit ? (p.unit === "×" ? p.unit : ` ${p.unit}`) : ""}`;
};

function ParamControl({ p, value, onChange }: { p: Param; value: number | string | boolean; onChange: (v: number | string | boolean) => void }) {
  if (p.type === "range") return <Slider label={p.label} value={Number(value)} min={p.min} max={p.max} step={p.step ?? 1} onValueChange={onChange} display={fmt(p, Number(value))} />;
  if (p.type === "toggle")
    return (
      <label className="flex cursor-pointer items-center justify-between gap-3 text-body">
        <span className="text-ink-muted">{p.label}</span>
        <Switch checked={!!value} onCheckedChange={onChange} />
      </label>
    );
  if (p.type === "select")
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="text-body text-ink-muted">{p.label}</span>
        <Select aria-label={p.label} align="end" value={String(value)} onValueChange={onChange} options={p.options.map((o) => ({ value: o, label: o[0].toUpperCase() + o.slice(1) }))} />
      </div>
    );
  return (
    <div className="grid gap-1.5">
      <span className="text-body text-ink-muted">{p.label}</span>
      <Input aria-label={p.label} value={String(value)} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** AI page tiles, packed to twelve columns: loaders small, the wide pieces half a row. */
const AI_SPAN: Record<string, string> = {
  "thinking-orbs": "lg:col-span-3",
  "run-status": "lg:col-span-3",
  "composer-glow": "sm:col-span-2 lg:col-span-6",
  "chat-list": "lg:col-span-4 lg:row-span-2",
  "proposal-card": "lg:col-span-4",
  "assistant-markdown": "lg:col-span-4",
  "message-sources": "lg:col-span-4",
  "report-row": "lg:col-span-4",
  "turn-rail": "lg:col-span-4",
  "empty-chat": "sm:col-span-2 lg:col-span-8",
};

/** The AI page: the whole assistant first, then each of its pieces live; each opens its own page. */
function AiIndex({ items }: { items: Item[] }) {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 pb-8 sm:px-6">
      <h1 className="sr-only">{SECTION_TITLE.ai}</h1>
      <AgentApp />
      <section aria-labelledby="ai-pieces" className="mt-10 grid gap-3">
        <h2 id="ai-pieces" className="text-title font-semibold text-ink">
          Pieces
        </h2>
        <div data-group="AI" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
          {items.map((i) => (
            <TileSpot key={i.name} item={i} className={cn("min-h-[144px] sm:min-h-[168px] lg:min-h-[188px]", AI_SPAN[i.name] ?? "lg:col-span-4")}>
              <CollectionPreview item={i} values={{ ...paramValues(i), ...i.preview }} />
            </TileSpot>
          ))}
        </div>
      </section>
    </main>
  );
}

/** The AI or Backgrounds page: every item live, under its small kind heading; each opens its sliders. */
export function CollectionIndex({ section }: { section: CollectionSection }) {
  const items = itemsOf(section);
  if (section === "ai") return <AiIndex items={items} />;
  const kinds = [...new Set(items.map((i) => i.kind ?? SECTION_TITLE[section]))];
  const groups = items.length <= 4 ? [{ title: "", items }] : kinds.map((k) => ({ title: k, items: items.filter((i) => (i.kind ?? SECTION_TITLE[section]) === k) }));
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 pb-8 pt-2 sm:px-6">
      <div className="mb-6 flex min-h-control items-center">
        <h1 className="text-heading font-semibold">{SECTION_TITLE[section]}</h1>
      </div>
      <SpotGroups
        groups={groups}
        span={(i) => (i.stage === "field" ? 12 : 4)}
        flush={(i) => i.stage === "field"}
        render={(i) => <CollectionPreview item={i} values={{ ...paramValues(i), ...i.preview }} />}
      />
    </main>
  );
}

/** One AI or Backgrounds item: live on a stage, its sliders beside it, then usage, source and install. */
export function CollectionItem({ section }: { section: CollectionSection }) {
  const { name = "" } = useParams();
  const item = findItem(name);
  const ok = !!item && sectionOf(item) === section && !!componentOf(item);
  const [global] = useConfig();
  const [params] = useSearchParams();
  const [values, setValues] = React.useState<Values>(() => (item ? paramValues(item, params) : {}));
  const [overrides, setOverrides] = React.useState<Partial<Config>>({});
  const merged = React.useMemo(() => ({ ...global, ...overrides, theme: global.theme }), [global, overrides]);
  const source = useSource(ok ? item : undefined);
  useBodyTokens(merged, global);
  React.useEffect(() => {
    const it = findItem(name);
    setOverrides({});
    setValues(it ? paramValues(it, new URLSearchParams(window.location.search)) : {});
  }, [name]);
  const groups = [section === "ai" ? "AI" : "Backgrounds"] as const;

  if (!ok || !item) {
    return (
      <GalleryLayout groups={[...groups]}>
        <EmptyState icon={SearchIcon} title="Nothing by that name" />
      </GalleryLayout>
    );
  }
  return (
    <GalleryLayout current={name} groups={[...groups]}>
      <div className="mb-5 flex min-h-control items-center">
        <h1 className="text-heading font-semibold">{item.title}</h1>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_288px]">
        <TokenScope
          data-stage
          config={merged}
          className={cn("flex min-h-[380px] items-center justify-center overflow-hidden rounded-sheet", item.stage === "field" ? "" : "bg-surface p-6 shadow-card sm:p-10")}
        >
          <CollectionPreview item={item} values={values} tall />
        </TokenScope>
        <Card className="grid content-start gap-4 self-start">
          {(item.params ?? []).map((p) => (
            <ParamControl key={p.key} p={p} value={values[p.key]} onChange={(v) => setValues((o) => ({ ...o, [p.key]: v }))} />
          ))}
          <ConfigPanel value={merged} onChange={(p) => setOverrides((o) => ({ ...o, ...p }))} fields={["accent"]} onReset={Object.keys(overrides).length ? () => setOverrides({}) : undefined} />
        </Card>
      </div>
      <ItemTabs usage={usageOf(item, values)} source={source} install={installCommand(item.name, merged)} />
    </GalleryLayout>
  );
}
