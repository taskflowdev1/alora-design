import * as React from "react";
import { Copy, Download, ExternalLink } from "react-feather";
import { serializeConfig, tokensCss, tokensJson } from "@/lib/config";
import { kitMarkdown, registryUrl, tailwindCss } from "@/lib/kit";
import { REGISTRY_ITEMS, SITE } from "@/lib/registry";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Status } from "@/components/ui/status";
import { toast } from "@/components/ui/toast";
import { PageHeader } from "@/components/ui/toolbar";
import themeCss from "@/styles/theme.css?raw";
import baseCss from "@/styles/base.css?raw";
import { useConfig } from "./config";
import { CodeBlock } from "./gallery";

function copy(text: string, what = "Copied") {
  void navigator.clipboard?.writeText(text);
  toast(what, "neutral");
}

function download(name: string, type: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function LinkRow({ label, value, open }: { label: string; value: string; open?: boolean }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-body text-ink-muted">{label}</span>
      <div className="flex gap-2">
        <Input aria-label={label} readOnly value={value} wrapperClassName="flex-1" className="truncate" onFocus={(e) => e.currentTarget.select()} />
        <Button icon aria-label={`Copy ${label.toLowerCase()}`} onClick={() => copy(value)}>
          <Copy />
        </Button>
        {open ? (
          <Button icon aria-label={`Open ${label.toLowerCase()}`} asChild>
            <a href={value} target="_blank" rel="noreferrer">
              <ExternalLink />
            </a>
          </Button>
        ) : null}
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

  return (
    <main className="mx-auto grid w-full max-w-[1080px] gap-6 px-4 pb-24 pt-2 sm:px-6">
      <PageHeader title="Export" />
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card inset="nest" className="self-start">
          <CardHeader title="Settings" className="px-2" />
          <div className="grid gap-px">
            {settings.map(([k, v]) => (
              <div key={k} className="flex h-row items-center justify-between gap-3 rounded-item px-2 text-body">
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
          </Card>
          <Card className="grid gap-3">
            <CardHeader title="Files" />
            <div className="flex flex-wrap gap-2">
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
              <Button variant="ghost" onClick={() => download("alora-design-kit.md", "text/markdown", kitMarkdown(config))}>
                <Download />
                Kit (markdown)
              </Button>
            </div>
          </Card>
          <Card className="grid gap-3">
            <CardHeader title="Install with shadcn" action={<Status>{REGISTRY_ITEMS.length} components</Status>} />
            <Combobox
              aria-label="Component"
              value={component}
              onValueChange={setComponent}
              options={[{ value: "theme", label: "Theme only" }, ...REGISTRY_ITEMS.map((i) => ({ value: i.name, label: i.title }))]}
              className="w-60"
            />
            <CodeBlock code={`npx shadcn@latest add "${registryUrl(component ?? "button", config)}"`} />
            <div className="flex">
              <Button variant="ghost" onClick={() => copy(all, "Command for every component copied")}>
                <Copy />
                Copy command for all components
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
