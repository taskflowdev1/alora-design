// Export generators shared by the site (/export) and the API (/api/kit, /r/*.json, /tokens.*).
// Pure: callers pass the CSS files and component sources in.

import { cornerValue, GREY_ROLES, radii, serializeConfig, tokens, tokensCss, typeScale, type Config } from "./config.js";
import { ITEMS, REGISTRY_ITEMS, SITE, itemPath, sourceKey, type Item } from "./registry.js";

export interface Assets {
  themeCss: string;
  baseCss: string;
  /** source key -> source: src/components/ui/* by file name, ai/* and backgrounds/* with their folder, src/lib/ad.ts as "ad.ts". */
  sources: Record<string, string>;
}

type CssObject = { [key: string]: string | CssObject };

/** Tiny CSS parser for our own base.css: selectors, at-rules and declarations. */
export function cssToObject(src: string): CssObject {
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
export function themeVars(themeCss: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of themeCss.matchAll(/--([\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

const strip = (m: Record<string, string>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k.replace(/^--/, ""), v]));

export const query = (c: Config) => {
  const q = serializeConfig(c);
  return q ? `?${q}` : "";
};

/* ---------------------------------------------------------------- tailwind */

/** `dark:` matches the dark theme: inside .dark when light is the default, outside .light when dark is. */
export const darkVariant = (c: Config) =>
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

export function libItem(a: Pick<Assets, "sources">) {
  return {
    $schema: SCHEMA,
    name: "ad",
    type: "registry:lib",
    title: "Alora Design utils",
    dependencies: ["clsx", "tailwind-merge"],
    files: [{ path: "registry/alora/lib/ad.ts", type: "registry:lib", content: a.sources["ad.ts"] ?? "" }],
  };
}

export function componentItem(item: Item, c: Config, a: Pick<Assets, "sources">) {
  return {
    $schema: SCHEMA,
    name: item.name,
    type: "registry:ui",
    title: item.title,
    dependencies: ["react-feather", ...(item.deps ?? [])],
    registryDependencies: [registryUrl("theme", c), `${SITE}/r/ad.json`, ...(item.registryDeps ?? []).map((n) => registryUrl(n, c))],
    // registry:ui files land in the app's ui folder, collections included, so their relative imports resolve.
    files: item.files.map((f) => ({ path: `registry/alora/${item.dir ?? "ui"}/${f}`, type: "registry:ui", content: a.sources[sourceKey(item, f)] ?? "" })),
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

export function kitMarkdown(c: Config) {
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

  lines.push(`## Rules`, "");
  [
    "Radii are concentric: an element's radius = its child's radius + the padding between them.",
    "Corner shape is one setting: square, round or squircle (`corner-shape: superellipse(k)`). People (avatars) and dots stay circles.",
    "Borders and outlines never shift layout. Controls have no borders; they are soft fills.",
    "Focus and selection show a soft fill only. No focus rings, outlines or border colour changes.",
    "Nothing changes colour on click. Press = a small shrink (scale 0.96); nothing else moves.",
    "Accent only on the primary or key action (Add, Save). Active nav, charts and numbers stay neutral.",
    "No dividing lines anywhere: not between rows, list items, stats, footer sections or columns. Separate with space or soft cards.",
    "No slop captions: no eyebrows, no subtitles that restate a title, no micro-copy under buttons, no meta lines, no grey corner text.",
    "Motion: about 220 ms, ease-out. Skeletons pulse and match the loaded layout exactly. No spinners.",
    "Status = small dot centred on the text. A soft pill only for the one status that needs attention.",
    "Tables: dense rows, no row lines, sticky header that never overlaps, columns sized to data, one-line cells, bottom bar with count + pager (50 per page). Whole-row click opens a side pane.",
    "Toolbars: every control one height, one centre line. Popovers from one toolbar never stack.",
    "Controls side by side, wrapped or stacked keep one gap, `--ad-gap` (half the card padding; `gap-gap`), in both axes. They never touch.",
    "Nothing sits under a scrollbar: a scroll area whose content runs edge to edge gives the bar its own lane (see MessageScroller).",
    "Dropdowns are always the custom Select; never the native select look. Language picker = flag + EN/ID/CN.",
    "Dates read \"7 Nov 2026\" or relative (\"Today, 14:05\"). Money reads \"Rp 12.400.000\".",
    "Empty state = one 40 px Feather icon (1.5 stroke) + a short title. Nothing else.",
    "Icons: Feather, 1.75 stroke, 16 px beside body text, same colour as the text, no containers.",
    "Toasts sit at the far right and never cover actions (they rise above save bars and move left of side panes).",
    `${c.theme === "dark" ? "Dark" : "Light"} theme by default. Dark is a neutral near-black with no blue tint; light is an off-white page with white cards on a soft shadow. The other theme is a class away (.${c.theme === "dark" ? "light" : "dark"}). The sidebar is dark in both.`,
    "Every pill, chip, filter bubble and segment shares one padding scale (`--ad-bubble-x`, `--ad-bubble-x-sm`).",
    "Triggers (date, select) size to their value; they are not stretched.",
    "A one-line alert centres icon, text and action on one line; a multi-line alert keeps the icon on the first line.",
    "Metric numbers: one or two digits sit in a soft tile beside the label; long values stay on one line with a muted unit.",
  ].forEach((rule) => lines.push(`- ${rule}`));
  lines.push("");

  lines.push(`## Components`, "");
  row("Component", "Install", "Page");
  row("---", "---", "---");
  for (const i of ITEMS) {
    row(i.title, i.files.length ? registryUrl(i.name, c) : `(in theme) ${registryUrl("theme", c)}`, `${SITE}${itemPath(i)}${q}`);
  }
  lines.push("", `Each registry URL returns shadcn JSON with the full source in \`files[].content\`.`, "");
  return lines.join("\n");
}
