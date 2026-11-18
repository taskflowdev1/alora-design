import * as React from "react";
import { NavLink, useNavigate, useParams, useSearchParams } from "react-router";
import { Search as SearchIcon, Sliders } from "react-feather";
import { cn } from "@/lib/ad";
import { inlineTokens, serializeConfig, type Config } from "@/lib/config";
import { GROUPS, ITEMS, SITE, findItem, itemPath, type Group, type Item } from "@/lib/registry";
import { Card } from "@/components/ui/card";
import { Search } from "@/components/ui/search";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { CodeBlock as UICodeBlock } from "@/components/ui/code-block";
import { applyTokens, SLink, TokenScope, shapedSupported, useConfig, useHref } from "./config";
import { COMPONENT_FIELDS, ConfigPanel } from "./config-panel";
import { DEMOS, type Demo, type Props } from "./demos";
import { ComponentBento } from "./showcase";

const sources = import.meta.glob("../components/*/*.tsx", { query: "?raw", import: "default" }) as Record<string, () => Promise<string>>;
/** Lazy source text of an item's first file, for its Source tab. */
export function useSource(item?: Item) {
  const [source, setSource] = React.useState("");
  React.useEffect(() => {
    const file = item?.files[0];
    const load = file ? sources[`../components/${item.dir ?? "ui"}/${file}`] : undefined;
    if (load) void load().then(setSource);
    else setSource("");
  }, [item]);
  return source;
}

/** Detail pages: every item of these groups, the current one highlighted. */
function GallerySidebar({ groups }: { groups: Group[] }) {
  const [config] = useConfig();
  const q = serializeConfig(config);
  return (
    <aside className="sticky top-20 hidden max-h-[calc(100dvh-96px)] w-52 shrink-0 overflow-auto pb-8 lg:block">
      {groups.map((g) => (
        <div key={g} className="mb-4 grid gap-px">
          <div className="flex h-7 items-center px-2.5 text-small text-ink-muted">{g}</div>
          {ITEMS.filter((i) => i.group === g).map((i) => (
            <NavLink
              key={i.name}
              to={`${itemPath(i)}${q ? `?${q}` : ""}`}
              className={({ isActive }) =>
                cn(
                  "flex h-item items-center rounded-control px-2.5 text-body transition-colors duration-[160ms]",
                  isActive ? "bg-fill-strong text-ink" : "text-ink-muted hover:bg-fill hover:text-ink",
                )
              }
            >
              {i.title}
            </NavLink>
          ))}
        </div>
      ))}
    </aside>
  );
}

function PhonePicker({ current, groups }: { current?: string; groups: Group[] }) {
  const [config] = useConfig();
  const navigate = useNavigate();
  const items = ITEMS.filter((i) => groups.includes(i.group));
  const go = (name: string) => {
    const q = serializeConfig(config);
    const item = findItem(name);
    if (item) navigate(`${itemPath(item)}${q ? `?${q}` : ""}`);
  };
  return (
    <div className="mb-4 lg:hidden">
      <Select
        aria-label="Component"
        value={current ?? null}
        placeholder="Components"
        onValueChange={go}
        options={items.map((i) => ({ value: i.name, label: i.title }))}
        className="w-full"
      />
    </div>
  );
}

/** A detail page: the section's item list on the left (a picker on phones), the page on the right. */
export function GalleryLayout({ children, current, groups = GROUPS }: { children: React.ReactNode; current?: string; groups?: Group[] }) {
  return (
    <div className="mx-auto flex w-full max-w-[1280px] gap-8 px-4 pb-24 pt-2 sm:px-6">
      <GallerySidebar groups={groups} />
      <main className="min-w-0 flex-1">
        <PhonePicker current={current} groups={groups} />
        {children}
      </main>
    </div>
  );
}

function DemoRender({ demo, p, config }: { demo: Demo; p: Props; config: Config }) {
  return <>{demo.render(p, config)}</>;
}

/** Control defaults, overridden by matching URL params (?variant=scale), so any state has a link. */
function defaults(demo?: Demo, params?: URLSearchParams): Props {
  return Object.fromEntries(
    (demo?.controls ?? []).map((c) => {
      const v = params?.get(c.key);
      if (v == null) return [c.key, c.default];
      return [c.key, c.type === "toggle" ? v === "1" || v === "true" : c.options.includes(v) ? v : c.default];
    }),
  );
}

const INTERACTIVE = "a,button,input,textarea,select,label,[role=button],[role=combobox],[role=slider],[role=switch],[role=checkbox],[role=radio],[role=tab],[role=option],[role=menuitem],[contenteditable=true]";

/**
 * One live component on a section page, with no box around it. Hover (or focus inside) shows a soft fill and a chip
 * with its name that opens its page with the sliders; a click on its empty space does the same. The component itself
 * stays fully interactive. On touch screens the chip always shows.
 */
export function Spot({ item, className, children }: { item: Item; className?: string; children: React.ReactNode }) {
  const navigate = useNavigate();
  const href = useHref(itemPath(item));
  return (
    <div
      data-spot={item.name}
      onClick={(e) => {
        const t = e.target as Element;
        if (!e.currentTarget.contains(t) || t.closest(INTERACTIVE) || t.closest("[data-radix-popper-content-wrapper],[role=dialog]")) return;
        navigate(href);
      }}
      className={cn(
        "group/spot relative flex min-w-0 cursor-pointer flex-col rounded-sheet px-4 pb-5 pt-10 transition-colors duration-[220ms] ease-ad hover:bg-fill/40 focus-within:bg-fill/40 sm:px-6",
        className,
      )}
    >
      <SLink
        to={itemPath(item)}
        className="absolute left-3 top-3 inline-flex h-7 items-center gap-1.5 rounded-full px-bubble-sm text-small font-medium text-ink-muted opacity-0 transition-[opacity,background-color,color] duration-[160ms] ease-ad hover:bg-fill-hover hover:text-ink group-hover/spot:opacity-100 group-focus-within/spot:opacity-100 [@media(hover:none)]:opacity-100 sm:left-5"
      >
        <Sliders size={14} />
        {item.title}
      </SLink>
      <div className="flex min-h-16 min-w-0 flex-1 items-center justify-center-safe">{children}</div>
    </div>
  );
}

/**
 * A tile on a section page (the AI row): a soft surface with the item live in its middle and its name chip in the
 * corner, which opens the item's sliders; a click on the tile's empty space does the same.
 */
export function TileSpot({ item, className, children }: { item: Item; className?: string; children: React.ReactNode }) {
  const navigate = useNavigate();
  const href = useHref(itemPath(item));
  return (
    <Card
      data-spot={item.name}
      inset="none"
      onClick={(e) => {
        const t = e.target as Element;
        if (t.closest(INTERACTIVE) || t.closest("[data-radix-popper-content-wrapper],[role=dialog]")) return;
        navigate(href);
      }}
      className={cn("relative flex min-h-[232px] min-w-0 cursor-pointer flex-col p-[calc(var(--ad-nest)*2)] transition-shadow duration-[220ms] ease-ad hover:shadow-raised", className)}
    >
      <SLink
        to={itemPath(item)}
        className="inline-flex h-7 w-fit items-center gap-1.5 rounded-full px-bubble-sm text-small font-medium text-ink-muted transition-colors duration-[160ms] ease-ad hover:bg-fill-hover hover:text-ink"
      >
        <Sliders size={14} />
        {item.title}
      </SLink>
      <div className="flex min-w-0 flex-1 items-center justify-center-safe px-2 py-4">{children}</div>
      {/* As tall as the name link, so the piece sits centred in the whole tile, not just under the link. */}
      <span aria-hidden="true" className="h-7 shrink-0" />
    </Card>
  );
}

const SPAN_CLASS = { 3: "lg:col-span-3", 4: "lg:col-span-4", 6: "md:col-span-2 lg:col-span-6", 8: "md:col-span-2 lg:col-span-8", 12: "md:col-span-2 lg:col-span-12" } as const;

/**
 * One cell of the packed grid: it spans as many 4 px rows as its spot is tall (measured), so spots of different
 * heights pack tightly like a bento instead of leaving empty rows.
 */
function Cell({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [rows, setRows] = React.useState(40);
  React.useLayoutEffect(() => {
    const el = ref.current?.firstElementChild as HTMLElement | null;
    if (!el) return;
    const set = () => setRows(Math.ceil((el.getBoundingClientRect().height + 8) / 4));
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("min-w-0 self-start", className)} style={{ gridRowEnd: `span ${rows}` }}>
      {children}
    </div>
  );
}

/** A section's groups: a small heading each, then its components live, packed in a 12-column grid. */
export function SpotGroups({ groups, render, span }: { groups: { title: string; items: Item[] }[]; render: (i: Item) => React.ReactNode; span: (i: Item) => 3 | 4 | 6 | 8 | 12 }) {
  return (
    <div className="grid gap-10">
      {groups.map((g) => (
        <section key={g.title} aria-label={g.title || undefined} data-group={g.title}>
          {g.title ? <h2 className="mb-2 px-1 text-title font-semibold text-ink">{g.title}</h2> : null}
          <div className="-mx-1 grid grid-flow-row-dense auto-rows-[4px] grid-cols-1 gap-x-2 md:grid-cols-2 lg:grid-cols-12">
            {g.items.map((i) => (
              <Cell key={i.name} className={SPAN_CLASS[span(i)]}>
                <Spot item={i}>{render(i)}</Spot>
              </Cell>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** The Components page: every component live, composed into a bento by category (showcase.tsx). */
export function GalleryIndex() {
  const [q, setQ] = React.useState("");
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 pb-8 pt-2 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-heading font-semibold">Components</h1>
        <Search value={q} onValueChange={setQ} placeholder="Find a component" />
      </div>
      <ComponentBento query={q} />
    </main>
  );
}

/** The library's CodeBlock, with the site's "Copied" toast. */
export function CodeBlock({ code, className }: { code: string; className?: string }) {
  return <UICodeBlock code={code} className={className} onCopy={() => toast("Copied", "neutral")} />;
}

export function installCommand(name: string, c: Config) {
  const q = serializeConfig(c);
  return `npx shadcn@latest add "${SITE}/r/${name}.json${q ? `?${q}` : ""}"`;
}

/**
 * Per-page overrides: portalled overlays (menus, popovers, dialogs) render in <body>, so the overrides go on <body>
 * and the site chrome in #root keeps the global tokens. Cleanup removes both.
 */
export function useBodyTokens(merged: Config, global: Config) {
  React.useLayoutEffect(() => {
    const root = document.getElementById("root")!;
    applyTokens(document.body, merged);
    applyTokens(root, global);
    return () => {
      for (const k of Object.keys(inlineTokens(merged, shapedSupported()))) {
        document.body.style.removeProperty(k);
        root.style.removeProperty(k);
      }
    };
  }, [merged, global]);
}

export function GalleryItem() {
  const { name = "" } = useParams();
  const item = findItem(name);
  const demo = DEMOS[name];
  const [global] = useConfig();
  const [params] = useSearchParams();
  const [overrides, setOverrides] = React.useState<Partial<Config>>({});
  const [props, setProps] = React.useState<Props>(() => defaults(demo, params));
  const source = useSource(item);
  const merged = React.useMemo(() => ({ ...global, ...overrides, theme: global.theme }), [global, overrides]);

  React.useEffect(() => {
    setOverrides({});
    setProps(defaults(DEMOS[name], new URLSearchParams(window.location.search)));
  }, [name]);

  useBodyTokens(merged, global);

  if (!item || !demo) {
    return (
      <GalleryLayout>
        <EmptyState icon={SearchIcon} title="No component by that name" />
      </GalleryLayout>
    );
  }

  const stage = demo.stage ?? "surface";
  return (
    <GalleryLayout current={name}>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-heading font-semibold">{item.title}</h1>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_288px]">
        <TokenScope
          data-stage
          config={merged}
          className={cn(
            "flex min-h-[380px] items-center justify-center overflow-auto rounded-sheet p-6 sm:p-10",
            stage === "page" ? "bg-page shadow-card" : "bg-surface shadow-card",
          )}
        >
          <DemoRender key={name} demo={demo} p={props} config={merged} />
        </TokenScope>
        <Card className="grid content-start gap-4 self-start">
          {(demo.controls ?? []).map((c) =>
            c.type === "select" ? (
              <div key={c.key} className="flex items-center justify-between gap-3">
                <span className="text-body text-ink-muted">{c.label}</span>
                <Select
                  aria-label={c.label}
                  align="end"
                  value={String(props[c.key])}
                  onValueChange={(v) => setProps({ ...props, [c.key]: v })}
                  options={c.options.map((o, i) => ({ value: o, label: c.labels?.[i] ?? o[0].toUpperCase() + o.slice(1) }))}
                />
              </div>
            ) : (
              <label key={c.key} className="flex cursor-pointer items-center justify-between gap-3 text-body">
                <span className="text-ink-muted">{c.label}</span>
                <Switch checked={!!props[c.key]} onCheckedChange={(v) => setProps({ ...props, [c.key]: v })} />
              </label>
            ),
          )}
          <ConfigPanel
            value={merged}
            onChange={(p) => setOverrides((o) => ({ ...o, ...p }))}
            fields={COMPONENT_FIELDS}
            onReset={Object.keys(overrides).length ? () => setOverrides({}) : undefined}
          />
        </Card>
      </div>
      <Tabs defaultValue="usage" className="mt-6">
        <TabsList>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          {source ? <TabsTrigger value="source">Source</TabsTrigger> : null}
          <TabsTrigger value="install">Install</TabsTrigger>
        </TabsList>
        <TabsContent value="usage">
          <CodeBlock code={demo.usage(props)} />
        </TabsContent>
        {source ? (
          <TabsContent value="source">
            <CodeBlock code={source} />
          </TabsContent>
        ) : null}
        <TabsContent value="install">
          <CodeBlock code={installCommand(item.files.length ? item.name : "theme", merged)} />
        </TabsContent>
      </Tabs>
    </GalleryLayout>
  );
}
