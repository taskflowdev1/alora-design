import * as React from "react";
import { Navigate, NavLink, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { Monitor, Search as SearchIcon, Sliders, Smartphone } from "react-feather";
import { cn } from "@/lib/ad";
import { inlineTokens, serializeConfig, type Config } from "@/lib/config";
import { GROUPS, ITEMS, MOBILE_GROUPS, SITE, findItem, itemPath, sectionOf, type Group, type Item } from "@/lib/registry";
import { Card } from "@/components/ui/card";
import { Search } from "@/components/ui/search";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SlidingPill } from "@/components/ui/sliding-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { CodeBlock as UICodeBlock } from "@/components/ui/code-block";
import { applyTokens, SLink, TokenScope, shapedSupported, useConfig, useHref } from "./config";
import { COMPONENT_FIELDS, ConfigPanel } from "./config-panel";
import { DEMOS, type Demo, type Props } from "./demos";
import { ComponentBento } from "./showcase";
import { Segmented } from "@/components/ui/segmented";
import { PhoneFrame } from "./phone";
import { MobileOverview } from "./mobile-overview";
import { useEdgeFade } from "./layout";
import { useOpenOnEmptyClick } from "./mark";

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

type Platform = "desktop" | "mobile";
const platformOf = (pathname: string): Platform => (pathname.startsWith("/mobile") ? "mobile" : "desktop");

/**
 * Desktop | Mobile: the top-level split of the component library. One switch (not two sidebar groups) because the
 * mobile set would sink under 170 desktop items in one list, and you pick a platform before you pick a component.
 */
export function PlatformSwitch({ className, icons = true }: { className?: string; icons?: boolean }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [config] = useConfig();
  const q = serializeConfig(config);
  return (
    <Segmented<Platform>
      aria-label="Platform"
      value={platformOf(pathname)}
      onValueChange={(v) => navigate(`${v === "mobile" ? "/mobile" : "/components"}${q ? `?${q}` : ""}`)}
      className={className}
      options={[
        { value: "desktop", label: icons ? <><Monitor />Desktop</> : "Desktop" },
        { value: "mobile", label: icons ? <><Smartphone />Mobile</> : "Mobile" },
      ]}
    />
  );
}

/** Detail pages: every item of these groups, the current one highlighted. Components and Mobile pages start with the switch. */
function GallerySidebar({ groups, platform }: { groups: Group[]; platform?: boolean }) {
  const [config] = useConfig();
  const q = serializeConfig(config);
  const ref = React.useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  useEdgeFade(ref);
  // Keep the current page in view: deep items (Calendar month) sit far below the sidebar's first screen. Scrolls only
  // the sidebar, never the page, and only when the item is out of view.
  React.useLayoutEffect(() => {
    const aside = ref.current;
    const a = aside?.querySelector<HTMLElement>('a[aria-current="page"]');
    if (!aside || !a) return;
    const top = a.offsetTop - aside.offsetTop;
    if (top < aside.scrollTop || top + a.offsetHeight > aside.scrollTop + aside.clientHeight) aside.scrollTop = top - aside.clientHeight / 2 + a.offsetHeight / 2;
  }, [pathname]);
  return (
    // Sticky needs room in its row: the bottom padding sits on <main> (inside the row), and the list is short enough
    // (viewport minus header, row padding and the footer line) that at the page's end it still clears the header.
    <aside ref={ref} className="ad-fade-y sticky top-20 hidden max-h-[calc(100dvh-224px)] w-52 shrink-0 self-start overflow-auto overscroll-contain pb-4 lg:block">
      <SlidingPill selector='a[aria-current="page"]' className="rounded-control bg-fill-strong" />
      {platform ? <PlatformSwitch icons={false} className="mb-4 flex w-full [&>button]:flex-1" /> : null}
      {groups.map((g) => (
        <div key={g} className="mb-4 grid gap-px">
          <div className="flex h-7 items-center px-2.5 text-small text-ink-muted">{g}</div>
          {ITEMS.filter((i) => i.group === g && !i.alias).map((i) => (
            <NavLink
              key={i.name}
              to={`${itemPath(i)}${q ? `?${q}` : ""}`}
              className={({ isActive }) =>
                cn(
                  "relative flex h-item items-center rounded-control px-2.5 text-body transition-colors duration-[160ms]",
                  isActive ? "text-ink" : "text-ink-muted hover:bg-fill hover:text-ink focus-visible:bg-fill focus-visible:text-ink",
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

function PhonePicker({ current, groups, platform }: { current?: string; groups: Group[]; platform?: boolean }) {
  const [config] = useConfig();
  const navigate = useNavigate();
  const items = ITEMS.filter((i) => groups.includes(i.group) && !i.alias);
  const go = (name: string) => {
    const q = serializeConfig(config);
    const item = findItem(name);
    if (item) navigate(`${itemPath(item)}${q ? `?${q}` : ""}`);
  };
  return (
    <div className="mb-4 grid gap-gap lg:hidden">
      {platform ? <PlatformSwitch className="flex w-full [&>button]:flex-1" /> : null}
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
export function GalleryLayout({ children, current, groups = GROUPS, platform }: { children: React.ReactNode; current?: string; groups?: Group[]; platform?: boolean }) {
  return (
    <div className="mx-auto flex w-full max-w-[1280px] gap-8 px-4 pt-2 sm:px-6">
      <GallerySidebar groups={groups} platform={platform} />
      <main className="min-w-0 flex-1 pb-24">
        <PhonePicker current={current} groups={groups} platform={platform} />
        {children}
      </main>
    </div>
  );
}

function DemoRender({ demo, p, config }: { demo: Demo; p: Props; config: Config }) {
  return <>{demo.render(p, config)}</>;
}

/**
 * The demo sits centred in the stage when it loads, then stays put while it grows or shrinks (a search that filters
 * rows, an accordion that opens): the stage aligns it to the top, with a top margin measured once per demo and
 * control state. Centring live re-centred it on every height change, so the field you typed in moved under you.
 */
function SteadyCentre({ measureKey, children }: { measureKey: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    // The stage is the parent (a parent's ref isn't attached yet when a child's layout effect runs).
    const box = el?.parentElement;
    if (!el || !box) return;
    const place = () => {
      el.style.marginTop = "0px";
      // The stage's own height: at least its min-height, or the row's when the controls beside it are taller.
      const cs = getComputedStyle(box);
      const room = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      el.style.marginTop = `${Math.max(0, Math.round((room - el.offsetHeight) / 2))}px`;
    };
    place();
    // Fonts and lazy parts can settle after the first frame; place once more, then leave it alone.
    const id = requestAnimationFrame(place);
    return () => cancelAnimationFrame(id);
  }, [measureKey]);
  return (
    <div ref={ref} className="flex w-full min-w-0 justify-center-safe">
      {children}
    </div>
  );
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

/**
 * One live component on a section page, with no box around it. Hover (or focus inside) shows a soft fill and a chip
 * with its name that opens its page with the sliders; a click on its empty space does the same. The component itself
 * stays fully interactive. On touch screens the chip always shows.
 */
function Spot({ item, className, flush, children }: { item: Item; className?: string; flush?: boolean; children: React.ReactNode }) {
  // A table row inside a spot is not a control here: a click on it opens the page like any empty space.
  const open = useOpenOnEmptyClick(useHref(itemPath(item)), { rows: false });
  return (
    <div
      data-spot={item.name}
      onClick={open}
      className={cn(
        "group/spot relative flex min-w-0 cursor-pointer flex-col rounded-sheet",
        // A full-bleed stage (a background behind a screen) is its own card: it sits on the content edge, the chip on top of it.
        flush ? "" : "px-4 pb-5 pt-10 transition-colors duration-[220ms] ease-ad hover:bg-surface focus-within:bg-surface sm:px-6",
        className,
      )}
    >
      <SLink
        to={itemPath(item)}
        className={cn(
          "absolute left-3 top-3 z-10 inline-flex h-7 items-center gap-1.5 rounded-full px-bubble-sm text-small font-medium text-ink-muted opacity-0 transition-[opacity,background-color,color] duration-[160ms] ease-ad hover:bg-fill-strong hover:text-ink focus-visible:bg-fill-strong focus-visible:text-ink group-hover/spot:opacity-100 group-focus-within/spot:opacity-100 [@media(hover:none)]:opacity-100",
          flush ? "bg-fill sm:left-4 sm:top-4" : "sm:left-5",
        )}
      >
        <Sliders size={14} />
        {item.title}
      </SLink>
      <div className={cn("flex min-w-0 flex-1 items-center justify-center-safe", !flush && "min-h-16")}>{children}</div>
    </div>
  );
}

/**
 * A tile on a section page (the AI row): a soft surface with the item live in its middle and its name chip in the
 * corner, which opens the item's sliders; a click on the tile's empty space does the same.
 */
export function TileSpot({ item, className, children }: { item: Item; className?: string; children: React.ReactNode }) {
  const open = useOpenOnEmptyClick(useHref(itemPath(item)), { rows: false });
  return (
    <Card
      data-spot={item.name}
      inset="none"
      onClick={open}
      className={cn("group/tile relative flex min-h-[232px] min-w-0 cursor-pointer flex-col p-[calc(var(--ad-nest)*2)] transition-shadow duration-[220ms] ease-ad hover:shadow-raised", className)}
    >
      <SLink
        to={itemPath(item)}
        className="inline-flex h-7 w-fit items-center gap-1.5 rounded-full px-bubble-sm text-small font-medium text-ink-muted opacity-0 transition-[opacity,background-color,color] duration-[160ms] ease-ad hover:bg-fill-strong hover:text-ink focus-visible:bg-fill-strong focus-visible:text-ink group-hover/tile:opacity-100 group-focus-within/tile:opacity-100 [@media(hover:none)]:opacity-100"
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
export function SpotGroups({
  groups,
  render,
  span,
  flush,
}: {
  groups: { title: string; items: Item[] }[];
  render: (i: Item) => React.ReactNode;
  span: (i: Item) => 3 | 4 | 6 | 8 | 12;
  flush?: (i: Item) => boolean;
}) {
  return (
    <div className="grid gap-10">
      {groups.map((g) => (
        <section key={g.title} aria-label={g.title || undefined} data-group={g.title}>
          {g.title ? <h2 className="mb-2 px-1 text-title font-semibold text-ink">{g.title}</h2> : null}
          <div className="-mx-1 grid grid-flow-row-dense auto-rows-[4px] grid-cols-1 gap-x-2 md:grid-cols-2 lg:grid-cols-12">
            {g.items.map((i) => (
              <Cell key={i.name} className={cn(SPAN_CLASS[span(i)], flush?.(i) && "px-1")}>
                <Spot item={i} flush={flush?.(i)}>
                  {render(i)}
                </Spot>
              </Cell>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/**
 * The Components page, both halves: Desktop (every component live, composed into a bento by category, showcase/)
 * and Mobile (the example app and composed phone screens, mobile-overview.tsx). One element for both routes, so the
 * Desktop | Mobile switch slides between them.
 */
export function GalleryIndex() {
  const [q, setQ] = React.useState("");
  const { pathname } = useLocation();
  const mobile = platformOf(pathname) === "mobile";
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 pb-8 pt-2 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-heading font-semibold">Components</h1>
        <PlatformSwitch />
        <span className="flex-1" />
        {mobile ? null : <Search value={q} onValueChange={setQ} placeholder="Filter this page" aria-label="Filter this page" />}
      </div>
      {mobile ? <MobileOverview /> : <ComponentBento query={q} />}
    </main>
  );
}

/** The library's CodeBlock, with the site's "Copied" toast. */
export function CodeBlock({ code, className }: { code: string; className?: string }) {
  return <UICodeBlock code={code} className={className} onCopy={() => toast("Copied", "neutral")} />;
}

/** Usage, Source (once the file's text has loaded) and Install, under an item's stage. */
export function ItemTabs({ usage, source, install }: { usage: string; source?: string; install: string }) {
  return (
    <Tabs defaultValue="usage" className="mt-6">
      <TabsList>
        <TabsTrigger value="usage">Usage</TabsTrigger>
        {source ? <TabsTrigger value="source">Source</TabsTrigger> : null}
        <TabsTrigger value="install">Install</TabsTrigger>
      </TabsList>
      <TabsContent value="usage">
        <CodeBlock code={usage} />
      </TabsContent>
      {source ? (
        <TabsContent value="source">
          <CodeBlock code={source} />
        </TabsContent>
      ) : null}
      <TabsContent value="install">
        <CodeBlock code={install} />
      </TabsContent>
    </Tabs>
  );
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

function Stage({ config, className, measureKey, children }: { config: Config; className?: string; measureKey: string; children: React.ReactNode }) {
  return (
    <TokenScope data-stage config={config} className={cn("flex min-h-[380px] items-start overflow-auto rounded-sheet p-6 sm:p-10", className)}>
      <SteadyCentre measureKey={measureKey}>
        {children}
      </SteadyCentre>
    </TokenScope>
  );
}

export function GalleryItem() {
  const { name = "" } = useParams();
  const { pathname } = useLocation();
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

  const mobile = !!item && sectionOf(item) === "mobile";
  // A renamed item's old name opens its replacement; a page asked for under the wrong half moves to the right one.
  const target = item?.alias ? findItem(item.alias) : item;
  if (target && (target !== item || !pathname.startsWith(itemPath(target)))) return <Navigate to={`${itemPath(target)}${window.location.search}`} replace />;

  if (!item || !demo) {
    return (
      <GalleryLayout platform>
        <EmptyState icon={SearchIcon} title="No component by that name" />
      </GalleryLayout>
    );
  }

  const stage = demo.stage ?? "surface";
  return (
    <GalleryLayout current={name} platform groups={mobile ? MOBILE_GROUPS : GROUPS}>
      <div className="mb-5 flex min-h-control flex-wrap items-center gap-3">
        <h1 className="mr-auto text-heading font-semibold">{item.title}</h1>
      </div>
      {/* A phone stage needs ~454 px, which 1024 has beside the controls, so you can flip a control and watch the phone. */}
      <div className={cn("grid gap-4", stage === "phone" ? "lg:grid-cols-[1fr_288px]" : "xl:grid-cols-[1fr_288px]")}>
        {stage === "phone" ? (
          <TokenScope data-stage config={merged} className="flex min-h-[380px] items-center justify-center rounded-sheet bg-fill px-3 py-6 sm:p-8">
            <PhoneFrame keyboard={!!props.keyboard}>
              <DemoRender key={name} demo={demo} p={props} config={merged} />
            </PhoneFrame>
          </TokenScope>
        ) : (
          <Stage config={merged} className={stage === "page" ? "bg-page shadow-card" : stage === "surface" ? "bg-surface shadow-card" : undefined} measureKey={`${name} ${JSON.stringify(props)}`}>
            <DemoRender key={name} demo={demo} p={props} config={merged} />
          </Stage>
        )}
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
      <ItemTabs usage={demo.usage(props)} source={source} install={installCommand(item.files.length ? item.name : "theme", merged)} />
    </GalleryLayout>
  );
}
