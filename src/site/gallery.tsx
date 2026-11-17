import * as React from "react";
import { NavLink, useNavigate, useParams, useSearchParams } from "react-router";
import { Check, Copy, Search as SearchIcon } from "react-feather";
import { cn } from "@/lib/ad";
import { inlineTokens, serializeConfig, type Config } from "@/lib/config";
import { GROUPS, ITEMS, SITE, findItem, type Item } from "@/lib/registry";
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
import { THUMBS } from "./thumbs";

const sources = import.meta.glob("../components/ui/*.tsx", { query: "?raw", import: "default" }) as Record<string, () => Promise<string>>;

function GallerySidebar() {
  const [config] = useConfig();
  const q = serializeConfig(config);
  return (
    <aside className="sticky top-20 hidden max-h-[calc(100dvh-96px)] w-52 shrink-0 overflow-auto pb-8 lg:block">
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
  const navigate = useNavigate();
  const go = (name: string) => {
    const q = serializeConfig(config);
    navigate(`/gallery/${name}${q ? `?${q}` : ""}`);
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

const FIT_STEPS = [1, 0.85, 0.72, 0.6];

/**
 * A live preview as large as it can be: full size when the demo fits the tile, scaled down
 * step by step only as far as it needs (never below 60%; past that, safe centring shows the top of the demo).
 * Trigger-only demos (menus, overlays) show their open state from `THUMBS`.
 */
function FitPreview({ children }: { children: React.ReactNode }) {
  const box = React.useRef<HTMLDivElement>(null);
  const stage = React.useRef<HTMLDivElement>(null);
  const [step, setStep] = React.useState(0);
  const scale = FIT_STEPS[step];
  React.useLayoutEffect(() => {
    const b = box.current;
    const s = stage.current;
    if (!b || !s) return;
    // Fits when nothing spills out of the tile and no inner table or list has to scroll sideways.
    const inner = () =>
      [...s.querySelectorAll<HTMLElement>("*")].every((el) => {
        if (el.scrollWidth <= el.clientWidth + 1) return true;
        const o = getComputedStyle(el).overflowX;
        return o !== "auto" && o !== "scroll";
      });
    const fits = () => s.scrollWidth <= s.clientWidth + 1 && s.scrollHeight * scale <= b.clientHeight + 1 && inner();
    if (!fits() && step < FIT_STEPS.length - 1) setStep(step + 1);
  }, [step, scale]);
  React.useEffect(() => {
    const b = box.current;
    if (!b) return;
    let w = b.clientWidth;
    const ro = new ResizeObserver(() => {
      if (b.clientWidth !== w) {
        w = b.clientWidth;
        setStep(0);
      }
    });
    ro.observe(b);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} data-fit={scale} className="pointer-events-none relative h-44 overflow-hidden" inert>
      <div
        ref={stage}
        className="absolute left-0 top-0 flex min-h-full origin-top-left items-center-safe justify-center-safe overflow-hidden p-5"
        style={{ width: `${100 / scale}%`, minHeight: `${100 / scale}%`, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

/** The component grid: every tile is a live, scaled-down preview that opens its gallery page. */
export function GalleryGrid({ items, className }: { items: Item[]; className?: string }) {
  const [config] = useConfig();
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {items.map((i) => {
        const demo = DEMOS[i.name];
        return (
          <SLink key={i.name} to={`/gallery/${i.name}`} className="group block rounded-card">
            <Card inset="none" interactive className="flex h-full flex-col overflow-hidden">
              <FitPreview>{THUMBS[i.name] ? THUMBS[i.name]() : demo ? <DemoRender demo={demo} p={defaults(demo)} config={config} /> : null}</FitPreview>
              <div className="flex h-11 items-center px-pad text-body font-medium">{i.title}</div>
            </Card>
          </SLink>
        );
      })}
    </div>
  );
}

export function GalleryIndex() {
  const [q, setQ] = React.useState("");
  const list = ITEMS.filter((i) => i.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <GalleryLayout>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-heading font-semibold">Gallery</h1>
        <Search value={q} onValueChange={setQ} placeholder="Find a component" />
      </div>
      {list.length === 0 ? <EmptyState icon={SearchIcon} title="No component by that name" /> : null}
      <GalleryGrid items={list} />
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
  const [params] = useSearchParams();
  const [overrides, setOverrides] = React.useState<Partial<Config>>({});
  const [props, setProps] = React.useState<Props>(() => defaults(demo, params));
  const [source, setSource] = React.useState("");
  const merged = React.useMemo(() => ({ ...global, ...overrides, theme: global.theme }), [global, overrides]);

  React.useEffect(() => {
    setOverrides({});
    setProps(defaults(DEMOS[name], new URLSearchParams(window.location.search)));
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
