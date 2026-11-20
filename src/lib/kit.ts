// Export generators shared by the site (/export) and the API (/api/kit, /r/*.json, /tokens.*).
// Pure: callers pass the CSS files, component sources and rules in.

import { cornerValue, GREY_ROLES, radii, serializeConfig, tokens, tokensCss, typeScale, type Config } from "./config.js";
import { ITEMS, REGISTRY_ITEMS, SITE, itemPath, sourceKey, type Item } from "./registry.js";

export interface Assets {
  themeCss: string;
  baseCss: string;
  /**
   * source key -> source: src/components/ui/* by file name, ai/*, backgrounds/* and mobile/* with their folder,
   * src/lib/ad.ts as "ad.ts" and src/lib/ad-hooks.ts as "ad-hooks.ts".
   */
  sources: Record<string, string>;
}

type CssObject = { [key: string]: string | CssObject };

/** Tiny CSS parser for our own base.css: selectors, at-rules (@utility included) and declarations. */
function cssToObject(src: string): CssObject {
  const s = src.replace(/\/\*[\s\S]*?\*\//g, "");
  let i = 0;
  const block = (): CssObject => {
    const out: CssObject = {};
    while (i < s.length) {
      while (i < s.length && /\s/.test(s[i])) i++;
      if (i >= s.length) break;
      if (s[i] === "}") {
        i++;
        return out;
      }
      let j = i;
      while (j < s.length && !"{;}".includes(s[j])) j++;
      const head = s.slice(i, j).trim().replace(/\s+/g, " ");
      if (s[j] === "{") {
        i = j + 1;
        const inner = block();
        const prev = out[head];
        out[head] = typeof prev === "object" ? { ...prev, ...inner } : inner;
      } else {
        const k = head.indexOf(":");
        if (k > 0) out[head.slice(0, k).trim()] = head.slice(k + 1).trim();
        i = s[j] === ";" ? j + 1 : j;
      }
    }
    return out;
  };
  return block();
}

/** "@theme inline { --color-x: var(--ad-x); }" -> { "color-x": "var(--ad-x)" } */
function themeVars(themeCss: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of themeCss.matchAll(/--([\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

const strip = (m: Record<string, string>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k.replace(/^--/, ""), v]));

const query = (c: Config) => {
  const q = serializeConfig(c);
  return q ? `?${q}` : "";
};

/* ---------------------------------------------------------------- tailwind */

/** `dark:` matches the dark theme: inside .dark when light is the default, outside .light when dark is. */
const darkVariant = (c: Config) =>
  c.theme === "dark" ? `@custom-variant dark (&:not(:where(.light, .light *)));` : `@custom-variant dark (&:where(.dark, .dark *));`;

/** One file to paste into a Tailwind v4 project: tokens, theme mapping, base rules. */
export function tailwindCss(c: Config, a: Pick<Assets, "themeCss" | "baseCss">) {
  return [
    `/* Alora Design for Tailwind v4. ${SITE}/export${query(c)} */`,
    `@import "tailwindcss";`,
    darkVariant(c),
    "",
    a.themeCss.trim(),
    "",
    tokensCss(c),
    "",
    a.baseCss.trim(),
    "",
  ].join("\n");
}

/* ---------------------------------------------------------------- shadcn */

const SCHEMA = "https://ui.shadcn.com/schema/registry-item.json";

export function registryUrl(name: string, c: Config) {
  return `${SITE}/r/${name}.json${query(c)}`;
}

export function themeItem(c: Config, a: Pick<Assets, "themeCss" | "baseCss">) {
  const t = tokens(c);
  const dark = c.theme === "dark";
  const base = cssToObject(a.baseCss);
  const layered: CssObject = {};
  const outside: CssObject = {};
  const into = (o: CssObject, k: string, v: string | CssObject) => (o[k] = typeof v === "object" && typeof o[k] === "object" ? { ...o[k], ...v } : v);
  for (const [k, v] of Object.entries(base)) {
    // base.css's own "@layer base" block joins the rest: shadcn puts every base rule in that layer anyway.
    if (k === "@layer base" && typeof v === "object") for (const [k2, v2] of Object.entries(v)) into(layered, k2, v2);
    else into(k.startsWith("@") ? outside : layered, k, v);
  }
  // shadcn writes cssVars.light to :root and cssVars.dark to .dark. With dark as the default,
  // :root carries the dark colours and a .light class carries the light ones.
  if (dark) layered[".light"] = t.light;
  return {
    $schema: SCHEMA,
    name: "theme",
    type: "registry:style",
    title: "Alora Design theme",
    description: `Tokens and base rules. Settings: ${serializeConfig(c) || "defaults"}. Default theme: ${c.theme}.`,
    cssVars: {
      theme: themeVars(a.themeCss),
      light: strip({ ...t.common, ...t.radius, ...(dark ? t.dark : t.light) }),
      dark: strip(t.dark),
    },
    css: {
      "@layer base": layered,
      ...outside,
      "@supports (corner-shape: squircle)": { ":root": t.radiusShaped },
    },
  };
}

/** The shared helpers every component may import: lib/ad.ts (cn, formatters, dates) and lib/ad-hooks.ts (React hooks). */
export function libItem(a: Pick<Assets, "sources">) {
  return {
    $schema: SCHEMA,
    name: "ad",
    type: "registry:lib",
    title: "Alora Design utils",
    dependencies: ["clsx", "tailwind-merge"],
    files: ["ad.ts", "ad-hooks.ts"].map((f) => ({ path: `registry/alora/lib/${f}`, type: "registry:lib", content: a.sources[f] ?? "" })),
  };
}

export function componentItem(item: Item, c: Config, a: Pick<Assets, "sources">) {
  return {
    $schema: SCHEMA,
    name: item.name,
    type: "registry:ui",
    title: item.title,
    dependencies: ["react-feather", ...(item.deps ?? [])],
    // Companions (parts a usage example sits next to) install too, so a pasted example works as shown.
    registryDependencies: [registryUrl("theme", c), `${SITE}/r/ad.json`, ...[...(item.registryDeps ?? []), ...(item.companions ?? [])].map((n) => registryUrl(n, c))],
    // registry:ui files land in the app's ui folder, collections included, so their relative imports resolve.
    // Mobile files land there too, so imports between the two folders become same-folder imports.
    files: item.files.map((f) => ({
      path: `registry/alora/${item.dir ?? "ui"}/${f}`,
      type: "registry:ui",
      content: (a.sources[sourceKey(item, f)] ?? "").replaceAll('from "../mobile/', 'from "./').replaceAll('from "@/components/mobile/', 'from "@/components/ui/'),
    })),
  };
}

export function registryIndex(c: Config) {
  return {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "alora-design",
    homepage: SITE,
    items: [
      { name: "theme", type: "registry:style", title: "Alora Design theme", url: registryUrl("theme", c) },
      { name: "ad", type: "registry:lib", title: "Alora Design utils", url: `${SITE}/r/ad.json` },
      ...REGISTRY_ITEMS.map((i) => ({ name: i.name, type: "registry:ui", title: i.title, url: registryUrl(i.name, c) })),
    ],
  };
}

/* ---------------------------------------------------------------- agent kit */

/** The part of a rule the kit lists (encyclopedia.ts `Rule`; passed in so this module stays small for the site). */
export type KitRule = { id: string; level: string; rule: string };

/** Markdown an agent reads before building with the kit. `rules`: the encyclopedia's RULES; the must ones are listed. */
export function kitMarkdown(c: Config, rules: readonly KitRule[] = []) {
  const t = tokens(c);
  const r = radii(c, false);
  const rs = radii(c, true);
  const type = typeScale(c);
  const q = query(c);
  const light = c.theme === "dark" ? t.dark : t.light;
  const lines: string[] = [];
  const row = (...cells: (string | number)[]) => lines.push(`| ${cells.join(" | ")} |`);

  lines.push(`# Alora Design kit`, "");
  lines.push(`React components for dense business apps (ERP, admin, dashboards). Built on Tailwind v4 and Radix, installed with the shadcn CLI.`);
  lines.push(`Settings in this file: \`${serializeConfig(c) || "defaults"}\`. Components: ${SITE}/components${q}`, "");

  lines.push(`## Install`, "");
  lines.push("```sh");
  lines.push(`npx shadcn@latest add "${registryUrl("theme", c)}"`);
  lines.push(`npx shadcn@latest add "${registryUrl("button", c)}"   # any component below`);
  lines.push("```");
  lines.push(`Or paste one CSS file into a Tailwind v4 project: ${SITE}/tailwind.css${q}`);
  lines.push(`Tokens only: ${SITE}/tokens.css${q} and ${SITE}/tokens.json${q}`, "");

  lines.push(`## Settings`, "");
  row("Setting", "Value");
  row("---", "---");
  row("Corner shape", `${c.corner}${c.corner === "squircle" ? `, smoothing ${c.smoothing} (\`corner-shape: ${cornerValue(c)}\`)` : ""}`);
  row("Control radius", `${c.radius} px`);
  row("Card padding", `${c.padding} px`);
  row("Control and row height", `${c.height} px`);
  row("Accent", c.accent);
  row("Greys", c.tone);
  row("Shadow", `${c.shadow}%`);
  row("Base font size", `${c.font} px`);
  row("Theme", c.theme);
  lines.push("");

  lines.push(`## Radii (outer = inner + padding, everywhere things nest)`, "");
  row("Token", "Use", "Round fallback", "With corner-shape");
  row("---", "---", "---", "---");
  row("`--ad-radius-control`", "buttons, inputs, dropdown triggers, menu items", `${r.control}px`, `${rs.control}px`);
  row("`--ad-radius-item`", "segment pill, soft rows inside cards, chips", `${r.item}px`, `${rs.item}px`);
  row("`--ad-radius-card`", "cards, menus, popovers (= control + nest gap)", `${r.card}px`, `${rs.card}px`);
  row("`--ad-radius-sheet`", "dialogs, side panes (= control + padding)", `${r.sheet}px`, `${rs.sheet}px`);
  row("`--ad-radius-small`", "chart bars, checkboxes, thumbs", `${r.small}px`, `${rs.small}px`);
  lines.push("", `Nest gap \`--ad-nest\` = ${r.gap}px. A squircle at radius r looks tighter than a round arc at r, so radii are scaled when the browser supports \`corner-shape\`; without it they fall back to plain border-radius.`, "");

  lines.push(`## Type`, "");
  lines.push(`One system sans stack, tabular figures, a plain "1". Sizes: small ${type.small}, body ${type.body}, title ${type.title}, heading ${type.heading}, big number ${type.number} (px). Headings weight 600. Labels grey, regular weight.`, "");

  lines.push(`## Colour (${c.theme}, the default theme)`, "");
  row("Token", "Value", "Use");
  row("---", "---", "---");
  const use: Record<string, string> = {
    page: c.theme === "dark" ? "page background (neutral near-black)" : "page background (off-white)",
    surface: "cards, menus, popovers, dialogs",
    fill: "controls at rest, soft rows, segmented track, hover on a surface, skeletons",
    "fill-strong": "hover and focus on a fill, selected on a plain surface, pressed, switch off, scrollbar",
    "ink-muted": "labels, secondary text, placeholders, timestamps",
    ink: "text, ink surfaces (tooltips, toasts), switch on in light",
    brand: "primary or key action buttons only",
    "brand-soft": "the one attention pill",
    side: "dark sidebar, save bar, bottom nav (both themes)",
  };
  for (const [k, u] of Object.entries(use)) row(`\`--ad-${k}\``, light[`--ad-${k}`] ?? "", u);
  lines.push(
    "",
    "page to ink are the whole grey ramp for this theme: never add another grey, an alpha on a grey token or a raw hex. " +
      `Role tokens map to a step: ${Object.entries(GREY_ROLES).map(([k, r]) => `\`${k}\` = ${c.theme === "dark" ? r.dark : r.light}`).join(", ")}. ` +
      "The sidebar, save bar and bottom nav are a dark island in both themes (`side-*` = the dark ramp). Accent only on primary or key actions.",
  );
  lines.push("", `Chart shades: ${[1, 2, 3, 4, 5].map((i) => light[`--ad-chart-${i}`]).join(", ")}.`, "");
  lines.push(
    `${c.theme === "dark" ? "Dark" : "Light"} theme by default; the other theme is a class away (\`.${c.theme === "dark" ? "light" : "dark"}\`). Dark is a neutral near-black with no blue tint; light is an off-white page with white cards on a soft shadow.`,
    "",
  );

  lines.push(`## Rules`, "");
  const must = rules.filter((r) => r.level === "must");
  if (must.length) {
    lines.push(`Every **must** rule (${must.length}); the checklist adds the **should** rules and a check for each.`, "");
    for (const r of must) lines.push(`- \`${r.id}\` ${r.rule}`);
    lines.push("");
  }
  lines.push(`Before review, run every UI change through the UI checklist: ${SITE}/ui-checklist.md (every rule with its check; why, how and sources at ${SITE}/encyclopedia).`, "");

  lines.push(`## Components`, "");
  row("Component", "Install", "Page");
  row("---", "---", "---");
  for (const i of ITEMS) {
    row(i.title, i.files.length ? registryUrl(i.name, c) : `(in theme) ${registryUrl("theme", c)}`, `${SITE}${itemPath(i)}${q}`);
  }
  lines.push("", `Each registry URL returns shadcn JSON with the full source in \`files[].content\`.`, "");
  return lines.join("\n");
}
