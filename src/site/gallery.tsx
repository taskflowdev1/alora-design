import * as React from "react";
import { NavLink, useParams } from "react-router";
import { Check, Copy, Search as SearchIcon } from "react-feather";
import { cn } from "@/lib/ad";
import { inlineTokens, serializeConfig, type Config } from "@/lib/config";
import { GROUPS, ITEMS, SITE, findItem } from "@/lib/registry";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search } from "@/components/ui/search";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { applyTokens, SLink, TokenScope, shapedSupported, useConfig } from "./config";
import { COMPONENT_FIELDS, ConfigPanel } from "./config-panel";
import { DEMOS, type Demo, type Props } from "./demos";

const sources = import.meta.glob("../components/ui/*.tsx", { query: "?raw", import: "default" }) as Record<string, () => Promise<string>>;

function GallerySidebar() {
  const [config] = useConfig();
  const q = serializeConfig(config);
  return (
    <aside className="sticky top-4 hidden max-h-[calc(100dvh-96px)] w-52 shrink-0 overflow-auto pb-8 lg:block">
      {GROUPS.map((g) => (
        <div key={g} className="mb-4 grid gap-px">
          <div className="flex h-7 items-center px-2.5 text-small text-ink-muted">{g}</div>
          {ITEMS.filter((i) => i.group === g).map((i) => (
            <NavLink
              key={i.name}
              to={`/gallery/${i.name}${q ? `?${q}` : ""}`}
              className={({ isActive }) =>
                cn(
                  "flex h-item items-center rounded-control px-2.5 text-body transition-colors duration-[160ms]",
                  isActive ? "bg-fill-hover text-ink" : "text-ink-muted hover:bg-fill hover:text-ink",
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

function PhonePicker({ current }: { current?: string }) {
  const [config] = useConfig();
  const go = (name: string) => {
    const q = serializeConfig(config);
    window.location.assign(`/gallery/${name}${q ? `?${q}` : ""}`);
  };
  return (
    <div className="mb-4 lg:hidden">
      <Select
        aria-label="Component"
        value={current ?? null}
        placeholder="Components"
        onValueChange={go}
        options={ITEMS.map((i) => ({ value: i.name, label: i.title }))}
        className="w-full"
      />
    </div>
  );
}

export function GalleryLayout({ children, current }: { children: React.ReactNode; current?: string }) {
  return (
    <div className="mx-auto flex w-full max-w-[1280px] gap-8 px-4 pb-24 pt-2 sm:px-6">
      <GallerySidebar />
      <main className="min-w-0 flex-1">
        <PhonePicker current={current} />
        {children}
      </main>
    </div>
  );
}

function DemoRender({ demo, p, config }: { demo: Demo; p: Props; config: Config }) {
  return <>{demo.render(p, config)}</>;
}

function defaults(demo?: Demo): Props {
  return Object.fromEntries((demo?.controls ?? []).map((c) => [c.key, c.default]));
}

export function GalleryIndex() {
  const [q, setQ] = React.useState("");
  const [config] = useConfig();
  const list = ITEMS.filter((i) => i.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <GalleryLayout>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-heading font-semibold">Gallery</h1>
        <Search value={q} onValueChange={setQ} placeholder="Find a component" />
      </div>
      {list.length === 0 ? <EmptyState icon={SearchIcon} title="No component by that name" /> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((i) => {
          const demo = DEMOS[i.name];
          return (
            <SLink key={i.name} to={`/gallery/${i.name}`} className="group block rounded-card">
              <Card inset="none" interactive className="flex h-full flex-col overflow-hidden">
                <div className="pointer-events-none relative h-44 overflow-hidden" inert>
                  <div className="absolute left-0 top-0 flex h-[166.6%] w-[166.6%] origin-top-left scale-[0.6] items-center justify-center p-6">
                    {demo ? <DemoRender demo={demo} p={defaults(demo)} config={config} /> : null}
                  </div>
                </div>
                <div className="flex h-11 items-center px-pad text-body font-medium">{i.title}</div>
              </Card>
            </SLink>
          );
        })}
      </div>
    </GalleryLayout>
  );
}

export function CodeBlock({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <div className={cn("relative rounded-card bg-fill", className)}>
      <pre className="max-h-[420px] overflow-auto p-pad pr-14 font-mono text-[12.5px] leading-relaxed text-ink">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        icon
        size="sm"
        aria-label="Copy code"
        className="absolute right-nest top-nest"
        onClick={() => {
          void navigator.clipboard?.writeText(code);
          setCopied(true);
          toast("Copied", "neutral");
          window.setTimeout(() => setCopied(false), 1400);
        }}
      >
        {copied ? <Check /> : <Copy />}
      </Button>
    </div>
  );
}

export function installCommand(name: string, c: Config) {
  const q = serializeConfig(c);
  return `npx shadcn@latest add "${SITE}/r/${name}.json${q ? `?${q}` : ""}"`;
}

export function GalleryItem() {
  const { name = "" } = useParams();
  const item = findItem(name);
  const demo = DEMOS[name];
  const [global] = useConfig();
  const [overrides, setOverrides] = React.useState<Partial<Config>>({});
  const [props, setProps] = React.useState<Props>(() => defaults(demo));
  const [source, setSource] = React.useState("");
  const merged = React.useMemo(() => ({ ...global, ...overrides, theme: global.theme }), [global, overrides]);

  React.useEffect(() => {
    setOverrides({});
    setProps(defaults(DEMOS[name]));
  }, [name]);

  // Portalled overlays (menus, popovers, dialogs) render in <body>, so the overrides
  // go on <body> and the site chrome in #root keeps the global tokens.
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

  React.useEffect(() => {
    const file = item?.files[0];
    const load = file ? sources[`../components/ui/${file}`] : undefined;
    if (load) void load().then(setSource);
    else setSource("");
  }, [item]);

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
          config={merged}
          className={cn(
            "flex min-h-[380px] items-center justify-center overflow-auto rounded-sheet p-6 sm:p-10",
            stage === "page" ? "bg-fill" : "bg-surface shadow-card",
          )}
        >
          <DemoRender key={name} demo={demo} p={props} config={merged} />
        </TokenScope>
        <Card className="grid content-start gap-4 self-start">
          {(demo.controls ?? []).map((c) =>
            c.type === "select" ? (
              <div key={c.key} className="grid gap-1.5">
                <span className="text-body text-ink-muted">{c.label}</span>
                <Select
                  aria-label={c.label}
                  value={String(props[c.key])}
                  onValueChange={(v) => setProps({ ...props, [c.key]: v })}
                  options={c.options.map((o) => ({ value: o, label: o[0].toUpperCase() + o.slice(1) }))}
                  className="w-full"
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
