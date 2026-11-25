import * as React from "react";
import { Check, Copy, Download, ExternalLink } from "react-feather";
import { cn } from "@/lib/ad";
import { serializeConfig, tokensCss, tokensJson } from "@/lib/config";
import { kitMarkdown, registryUrl, tailwindCss } from "@/lib/kit";
import { REGISTRY_ITEMS, SITE } from "@/lib/registry";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { PageHeader } from "@/components/ui/toolbar";
import { toast } from "@/components/ui/toast";
import themeCss from "@/styles/theme.css?raw";
import baseCss from "@/styles/base.css?raw";
import { useConfig } from "./config";
import { CodeBlock } from "./gallery";

/**
 * Copies and confirms on the button itself: the icon turns into a check for a moment (no far-away toast). Only a
 * write that worked shows the check; a refused one says so.
 */
function useCopy() {
  const [done, setDone] = React.useState(false);
  const t = React.useRef<number>(undefined);
  React.useEffect(() => () => window.clearTimeout(t.current), []);
  const copy = (text: string) => {
    const failed = () => toast("Couldn’t copy. Select the text and copy it.", "neutral");
    if (!navigator.clipboard) return failed();
    navigator.clipboard.writeText(text).then(() => {
      setDone(true);
      window.clearTimeout(t.current);
      t.current = window.setTimeout(() => setDone(false), 1500);
    }, failed);
  };
  return [done, copy] as const;
}

/** Copy turns into a check the way CopyChip's does: the outgoing icon shrinks and blurs as it fades. */
function CopyIcon({ done }: { done: boolean }) {
  const swap = "absolute transition-[opacity,scale,filter] duration-[160ms] ease-ad";
  return (
    <span className="relative grid size-4 shrink-0 place-items-center">
      <Copy className={cn(swap, done && "scale-[0.8] opacity-0 blur-[2px]")} />
      <Check className={cn(swap, !done && "scale-[0.8] opacity-0 blur-[2px]")} />
    </span>
  );
}

/** The kit lists every must rule; the encyclopedia loads only when you ask for the file, so it stays out of the page. */
async function downloadKit(config: Parameters<typeof kitMarkdown>[0]) {
  const { RULES } = await import("@/lib/encyclopedia");
  download("alora-design-kit.md", "text/markdown", kitMarkdown(config, RULES));
}

function download(name: string, type: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function LinkRow({ label, value, open }: { label: string; value: string; open?: boolean }) {
  const [done, copy] = useCopy();
  return (
    <div className="grid gap-1.5">
      <span className="text-body text-ink-muted">{label}</span>
      <div className="flex gap-gap">
        <Input aria-label={label} readOnly value={value} wrapperClassName="flex-1" className="truncate" onFocus={(e) => e.currentTarget.select()} />
        <Button icon aria-label={done ? "Copied" : `Copy ${label.toLowerCase()}`} onClick={() => copy(value)}>
          <CopyIcon done={done} />
        </Button>
        {open ? (
          <Button icon aria-label={`Open ${label.toLowerCase()}`} asChild>
            <a href={value} target="_blank" rel="noreferrer">
              <ExternalLink />
            </a>
          </Button>
        ) : (
          <span aria-hidden className="w-control shrink-0" />
        )}
      </div>
    </div>
  );
}

export function ExportPage() {
  const [config] = useConfig();
  const q = serializeConfig(config);
  const qs = q ? `?${q}` : "";
  const [component, setComponent] = React.useState<string | null>("button");
  const settings: [string, React.ReactNode][] = [
    ["Corner shape", config.corner === "squircle" ? `Squircle, smoothing ${config.smoothing.toFixed(1)}` : config.corner === "round" ? "Round" : "Square"],
    ["Radius", `${config.radius} px`],
    ["Padding", `${config.padding} px`],
    ["Height", `${config.height} px`],
    [
      "Accent",
      <span key="a" className="inline-flex items-center gap-2">
        <span data-shape="round" className="size-3.5 rounded-full" style={{ background: config.accent }} />
        {config.accent}
      </span>,
    ],
    ["Greys", config.tone[0].toUpperCase() + config.tone.slice(1)],
    ["Shadow", `${config.shadow}%`],
    ["Text size", `${config.font} px`],
    ["Theme", config.theme === "dark" ? "Dark" : "Light"],
  ];
  const all = `npx shadcn@latest add ${REGISTRY_ITEMS.map((i) => `"${registryUrl(i.name, config)}"`).join(" ")}`;
  const [copiedAll, copyAll] = useCopy();

  return (
    <main className="mx-auto grid w-full max-w-[1280px] gap-6 px-4 pb-24 pt-2 sm:px-6">
      <PageHeader title="Export" />
      <div className="grid max-w-[1080px] gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="grid gap-4 self-start">
          <CardHeader title="Settings" />
          <div className="grid gap-px">
            {settings.map(([k, v]) => (
              <div key={k} className="flex h-row items-center justify-between gap-3 text-body">
                <span className="text-ink-muted">{k}</span>
                <span className="tabular-nums">{v}</span>
              </div>
            ))}
          </div>
        </Card>
        <div className="grid content-start gap-4">
          <Card className="grid gap-4">
            <CardHeader title="Links" />
            <LinkRow label="Share link" value={`${SITE}/${qs}`} />
            <LinkRow label="Agent kit" value={`${SITE}/api/kit${qs}`} open />
            <LinkRow label="UI checklist" value={`${SITE}/ui-checklist.md`} open />
          </Card>
          <Card className="grid gap-3">
            <CardHeader title="Files" />
            <div className="flex flex-wrap gap-gap">
              <Button onClick={() => download("tokens.css", "text/css", tokensCss(config))}>
                <Download />
                tokens.css
              </Button>
              <Button onClick={() => download("tokens.json", "application/json", JSON.stringify(tokensJson(config), null, 2))}>
                <Download />
                tokens.json
              </Button>
              <Button onClick={() => download("alora-design.css", "text/css", tailwindCss(config, { themeCss, baseCss }))}>
                <Download />
                Tailwind v4 theme
              </Button>
              <Button onClick={() => void downloadKit(config)}>
                <Download />
                Kit (markdown)
              </Button>
            </div>
          </Card>
          <Card className="grid gap-3">
            <CardHeader
              title={
                <>
                  Install with shadcn <span className="font-normal tabular-nums text-ink-muted">{REGISTRY_ITEMS.length}</span>
                </>
              }
            />
            <Combobox
              aria-label="Component"
              value={component}
              onValueChange={setComponent}
              options={[{ value: "theme", label: "Theme only" }, ...REGISTRY_ITEMS.map((i) => ({ value: i.name, label: i.title }))]}
              className="w-60"
            />
            <CodeBlock code={`npx shadcn@latest add "${registryUrl(component ?? "button", config)}"`} />
            <div className="flex">
              <Button onClick={() => copyAll(all)}>
                <CopyIcon done={copiedAll} />
                Copy command for all components
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
