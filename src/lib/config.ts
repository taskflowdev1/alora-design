// One config object drives every component through CSS variables.
// Pure module: used by the site, the gallery overrides and the API (kit, registry, tokens).

import { accentShades, contrast, hexToOklch, oklchToHex } from "./color.js";

export type Corner = "square" | "round" | "squircle";
export type Tone = "cool" | "neutral" | "warm";
export type Theme = "light" | "dark";

export interface Config {
  /** Control radius in px (buttons, inputs, dropdowns). Cards and menus derive from it. */
  radius: number;
  /** Square, round (circular arcs) or squircle (continuous curves, via corner-shape where supported). */
  corner: Corner;
  /** superellipse(k): 1 = round, 2 = squircle, up to 3. Used when corner = squircle. */
  smoothing: number;
  /** Card padding in px. */
  padding: number;
  /** Control height and table row height in px. */
  height: number;
  /** Primary buttons, key actions and focus fills; chart shades derive from it. */
  accent: string;
  /** Tint of the greys: neutral, cool (blue hint) or warm. */
  tone: Tone;
  /** Card and menu shadow strength, 0 to 100. */
  shadow: number;
  /** Base font size in px. */
  font: number;
  /** Default theme; the other one is a class away (.light or .dark). */
  theme: Theme;
}

export const DEFAULTS: Config = {
  radius: 12,
  corner: "squircle",
  smoothing: 2,
  padding: 16,
  height: 36,
  accent: "#dc467d",
  tone: "neutral",
  shadow: 50,
  font: 13,
  theme: "dark",
};

export const LIMITS = {
  radius: [0, 24],
  smoothing: [1, 3],
  padding: [8, 24],
  height: [32, 44],
  shadow: [0, 100],
  font: [12, 15],
} as const;

const clamp = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v));
const num = (v: string | null | undefined) => (v == null || v === "" ? NaN : Number(v));

const CORNER_KEYS: Record<string, Corner> = { s: "square", r: "round", q: "squircle" };
const TONE_KEYS: Record<string, Tone> = { c: "cool", n: "neutral", w: "warm" };

type Getter = { get(key: string): string | null };

/** Read a config from URL params. Unknown or out-of-range values fall back or clamp. */
export function parseConfig(params: Getter | string, base: Config = DEFAULTS): Config {
  const p: Getter = typeof params === "string" ? new URLSearchParams(params) : params;
  const pick = (key: string, lim: readonly [number, number], fallback: number) => {
    const v = num(p.get(key));
    return Number.isFinite(v) ? clamp(v, lim) : fallback;
  };
  const accent = p.get("a");
  return {
    radius: Math.round(pick("r", LIMITS.radius, base.radius)),
    corner: CORNER_KEYS[p.get("c") ?? ""] ?? base.corner,
    smoothing: Math.round(pick("k", LIMITS.smoothing, base.smoothing) * 10) / 10,
    padding: Math.round(pick("p", LIMITS.padding, base.padding)),
    height: Math.round(pick("h", LIMITS.height, base.height)),
    accent: accent && /^[0-9a-f]{6}$/i.test(accent) ? `#${accent.toLowerCase()}` : base.accent,
    tone: TONE_KEYS[p.get("g") ?? ""] ?? base.tone,
    shadow: Math.round(pick("sh", LIMITS.shadow, base.shadow)),
    font: Math.round(pick("f", LIMITS.font, base.font)),
    theme: p.get("t") === "d" ? "dark" : p.get("t") === "l" ? "light" : base.theme,
  };
}

/** Short query string, defaults left out, so any link carries its settings. */
export function serializeConfig(c: Config): string {
  const out: [string, string][] = [];
  const d = DEFAULTS;
  if (c.radius !== d.radius) out.push(["r", String(c.radius)]);
  if (c.corner !== d.corner) out.push(["c", c.corner === "square" ? "s" : c.corner === "round" ? "r" : "q"]);
  if (c.corner === "squircle" && c.smoothing !== d.smoothing) out.push(["k", String(c.smoothing)]);
  if (c.padding !== d.padding) out.push(["p", String(c.padding)]);
  if (c.height !== d.height) out.push(["h", String(c.height)]);
  if (c.accent.toLowerCase() !== d.accent) out.push(["a", c.accent.replace("#", "").toLowerCase()]);
  if (c.tone !== d.tone) out.push(["g", c.tone[0]]);
  if (c.shadow !== d.shadow) out.push(["sh", String(c.shadow)]);
  if (c.font !== d.font) out.push(["f", String(c.font)]);
  if (c.theme !== d.theme) out.push(["t", c.theme[0]]);
  return out.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
}

export const withQuery = (path: string, c: Config) => {
  const q = serializeConfig(c);
  return q ? `${path}${path.includes("?") ? "&" : "?"}${q}` : path;
};

/* ---------------------------------------------------------------- radius */

/**
 * A squircle at radius r looks tighter than a circular arc at r, because the
 * curve hugs the corner. Scale the radius so the corner's 45-degree point sits
 * about where it would on the round version (perceptual blend, capped).
 */
export function squircleCompensation(k: number): number {
  if (k <= 1) return 1;
  const n = Math.pow(2, k); // superellipse exponent: k=1 circle (n=2), k=2 squircle (n=4)
  const round45 = 1 - Math.SQRT1_2;
  const shape45 = 1 - Math.pow(2, -1 / n);
  return Math.min(2.4, Math.pow(round45 / shape45, 0.66));
}

export function cornerValue(c: Config): string {
  if (c.corner === "square") return "square";
  if (c.corner === "round") return "round";
  return c.smoothing === 2 ? "squircle" : `superellipse(${c.smoothing})`;
}

/** Radii in px. `shaped` = the browser supports corner-shape. Every nest is outer = inner + padding. */
export function radii(c: Config, shaped: boolean) {
  if (c.corner === "square") return { control: 0, item: 0, card: 0, sheet: 0, small: 0, gap: nestGap(c) };
  const comp = shaped && c.corner === "squircle" ? squircleCompensation(c.smoothing) : 1;
  const g = nestGap(c);
  const control = round1(c.radius * comp);
  return {
    control,
    item: round1(Math.max(control - g, control * 0.4)),
    card: round1(control + g),
    sheet: round1(control + c.padding),
    small: round1(Math.max(2, Math.round(c.radius / 3)) * comp),
    gap: g,
  };
}

export const nestGap = (c: Config) => Math.max(2, Math.round(c.radius / 3));
const round1 = (v: number) => Math.round(v * 10) / 10;

/* ---------------------------------------------------------------- colour */

const TONES: Record<Tone, { h: number; c: number }> = {
  cool: { h: 255, c: 0.012 },
  neutral: { h: 0, c: 0 },
  warm: { h: 70, c: 0.011 },
};

function grey(tone: Tone, l: number, scale = 1) {
  const t = TONES[tone];
  return oklchToHex({ l, c: t.c * scale, h: t.h });
}

/** Dark greys keep only a hint of a cool or warm tone, so dark stays near-black; neutral is exactly grey. */
const DARK_TINT = 0.35;

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.round(a * 1000) / 1000})`;
};

function shadows(strength: number, dark: boolean, ink: string) {
  const m = strength / 50;
  const base = dark ? "#000000" : ink;
  const k = dark ? 2.2 : 1;
  const s = (a: number) => rgba(base, Math.min(0.6, a * m * k));
  if (strength === 0) return { card: "none", raised: `0 0 0 0 transparent`, dialog: "none" };
  return {
    card: `0 1px 2px ${s(0.04)}, 0 2px 10px ${s(0.035)}`,
    raised: `0 2px 6px ${s(0.06)}, 0 10px 28px ${s(0.1)}`,
    dialog: `0 6px 14px ${s(0.08)}, 0 28px 60px ${s(0.18)}`,
  };
}

function themeColors(c: Config, dark: boolean) {
  const t = c.tone;
  const acc = hexToOklch(c.accent);
  const shades = accentShades(c.accent);
  const g = (l: number, s = 1) => grey(t, l, dark ? s * DARK_TINT : s);
  const ink = dark ? g(0.95, 0.4) : g(0.21, 1.4);
  const brand = dark ? oklchToHex({ l: Math.max(acc.l, 0.64), c: acc.c * 0.9, h: acc.h }) : c.accent;
  const brandHover = dark
    ? oklchToHex({ l: Math.max(acc.l, 0.64) + 0.05, c: acc.c * 0.9, h: acc.h })
    : oklchToHex({ l: acc.l - 0.05, c: acc.c, h: acc.h });
  const brandInk = contrast(brand, "#ffffff") >= 3.4 ? "#ffffff" : g(0.18, 1.4);
  const sh = shadows(c.shadow, dark, ink);
  const chart = dark ? [shades[5], shades[4], shades[3], shades[2], shades[6]] : [shades[5], shades[4], shades[3], shades[6], shades[2]];
  // The sidebar follows the theme: a white panel in light mode (greys as in the rest of the light UI);
  // in dark mode it sits a step above the page (like a card) so it still stands out.
  const sideL = 0.2;
  return {
    page: dark ? g(0.155, 0.8) : g(0.985, 0.35),
    surface: dark ? g(0.2, 0.8) : "#ffffff",
    raised: dark ? g(0.23, 0.8) : "#ffffff",
    fill: dark ? g(0.25, 0.8) : g(0.958, 0.6),
    "fill-hover": dark ? g(0.295, 0.8) : g(0.928, 0.7),
    "fill-strong": dark ? g(0.355, 0.8) : g(0.885, 0.8),
    ink,
    "ink-muted": dark ? g(0.72, 0.6) : g(0.5, 1.2),
    "ink-faint": dark ? g(0.56, 0.6) : g(0.66, 1),
    on: dark ? g(0.93, 0.4) : g(0.25, 1.4),
    "on-ink": dark ? g(0.18, 1) : "#ffffff",
    thumb: "#ffffff",
    brand,
    "brand-hover": brandHover,
    "brand-ink": brandInk,
    "brand-soft": dark ? oklchToHex({ l: 0.27, c: acc.c * 0.2, h: acc.h }) : shades[0],
    "brand-soft-ink": dark ? oklchToHex({ l: 0.85, c: acc.c * 0.55, h: acc.h }) : shades[6],
    danger: dark ? "#e8867c" : "#c2493d",
    "danger-soft": dark ? "#33201e" : "#fbeeec",
    success: dark ? "#7cc59a" : "#2f8a57",
    "success-soft": dark ? "#1c2a21" : "#eaf5ee",
    scroll: dark ? rgba("#ffffff", 0.16) : rgba(ink, 0.18),
    overlay: dark ? rgba("#000000", 0.5) : rgba(g(0.2, 1), 0.28),
    "chart-1": chart[0],
    "chart-2": chart[1],
    "chart-3": chart[2],
    "chart-4": chart[3],
    "chart-5": chart[4],
    side: dark ? g(sideL, 1.2) : "#ffffff",
    "side-raised": dark ? g(sideL + 0.06, 1.2) : g(0.97, 0.5),
    "side-fill": dark ? g(sideL + 0.06, 1.2) : g(0.958, 0.6),
    "side-fill-hover": dark ? g(sideL + 0.1, 1.2) : g(0.928, 0.7),
    "side-ink": dark ? g(0.93, 0.4) : ink,
    "side-muted": dark ? g(0.68, 0.6) : g(0.5, 1.2),
    "shadow-card": sh.card,
    "shadow-raised": sh.raised,
    "shadow-dialog": sh.dialog,
  };
}

/* ---------------------------------------------------------------- tokens */

export const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", Ubuntu, "Helvetica Neue", Arial, sans-serif';

export function typeScale(c: Config) {
  const f = c.font;
  return { small: f - 1, body: f, title: f + 2, heading: Math.round(f * 1.46), number: Math.round(f * 1.85) };
}

export type TokenMap = Record<string, string>;

/** Every CSS variable, split into what is shared and what differs per theme. */
export function tokens(c: Config) {
  const type = typeScale(c);
  const shades = accentShades(c.accent);
  const r = radii(c, false);
  const rs = radii(c, true);
  const px = (v: number) => `${v}px`;
  const common: TokenMap = {
    "--ad-font": FONT_STACK,
    "--ad-text-small": px(type.small),
    "--ad-text-body": px(type.body),
    "--ad-text-title": px(type.title),
    "--ad-text-heading": px(type.heading),
    "--ad-text-number": px(type.number),
    "--ad-control-h": px(c.height),
    "--ad-item-h": px(c.height - 4),
    "--ad-row-h": px(c.height),
    "--ad-pad": px(c.padding),
    "--ad-bubble-x": px(Math.round(c.padding * 0.75)),
    "--ad-bubble-x-sm": px(Math.round(c.padding / 2)),
    "--ad-nest": px(r.gap),
    "--ad-corner": cornerValue(c),
    "--ad-ease": "cubic-bezier(0.22, 1, 0.36, 1)",
    "--ad-dur": "220ms",
  };
  shades.forEach((s, i) => (common[`--ad-brand-${i + 1}`] = s));
  const radius = (x: ReturnType<typeof radii>): TokenMap => ({
    "--ad-radius-control": px(x.control),
    "--ad-radius-item": px(x.item),
    "--ad-radius-card": px(x.card),
    "--ad-radius-sheet": px(x.sheet),
    "--ad-radius-small": px(x.small),
  });
  const pre = (o: Record<string, string>) =>
    Object.fromEntries(Object.entries(o).map(([k, v]) => [`--ad-${k}`, v])) as TokenMap;
  return {
    common,
    radius: radius(r),
    radiusShaped: radius(rs),
    light: pre(themeColors(c, false)),
    dark: pre(themeColors(c, true)),
  };
}

/** The flat map to set as inline style on an element (one theme, known support). */
export function inlineTokens(c: Config, shaped: boolean): TokenMap {
  const t = tokens(c);
  return { ...t.common, ...(shaped ? t.radiusShaped : t.radius), ...(c.theme === "dark" ? t.dark : t.light) };
}

const block = (sel: string, map: TokenMap, indent = "") =>
  `${indent}${sel} {\n${Object.entries(map)
    .map(([k, v]) => `${indent}  ${k}: ${v};`)
    .join("\n")}\n${indent}}`;

/** The default theme's colours sit on :root; the other theme on a class (.dark or .light). */
export function tokensCss(c: Config): string {
  const t = tokens(c);
  const dark = c.theme === "dark";
  return [
    `/* Alora Design tokens. Settings: ${serializeConfig(c) || "defaults"}. Default theme: ${c.theme}; add class "${dark ? "light" : "dark"}" for the other. */`,
    block(":root", { ...t.common, ...t.radius, ...(dark ? t.dark : t.light) }),
    block(dark ? ".light" : ".dark", dark ? t.light : t.dark),
    `@supports (corner-shape: squircle) {\n${block(":root", t.radiusShaped, "  ")}\n}`,
  ].join("\n\n");
}

export function tokensJson(c: Config) {
  const t = tokens(c);
  const strip = (m: TokenMap) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k.replace(/^--ad-/, ""), v]));
  return {
    settings: c,
    query: serializeConfig(c),
    defaultTheme: c.theme,
    common: strip(t.common),
    radius: { fallback: strip(t.radius), cornerShape: strip(t.radiusShaped) },
    light: strip(t.light),
    dark: strip(t.dark),
  };
}
