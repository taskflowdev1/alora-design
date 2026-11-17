// Every item on the site: drives the Components, AI and Backgrounds pages, the shadcn registry (/r/<name>.json),
// /api/kit and the README tables (scripts/gen-docs.mjs). Pure data: the API imports it.

export type Group = "Actions" | "Inputs" | "Display" | "Overlays" | "Layout" | "Foundations" | "Niche" | "AI" | "Backgrounds";
/** The site section (nav tab) an item lives in. */
export type Section = "components" | "ai" | "backgrounds";

/** A control on a collection item's page; its value is passed to the component as the prop `key`. */
export type Param =
  | { key: string; label: string; type: "range"; min: number; max: number; step?: number; default: number; unit?: string }
  | { key: string; label: string; type: "select"; options: string[]; default: string }
  | { key: string; label: string; type: "toggle"; default: boolean }
  | { key: string; label: string; type: "text"; default: string };

export interface Item {
  name: string;
  title: string;
  group: Group;
  /** Files under src/components/<dir> (default "ui"). Empty for foundation pages. */
  files: string[];
  dir?: "ui" | "ai" | "backgrounds";
  deps?: string[];
  registryDeps?: string[];
  /** AI and Backgrounds only: the component the file exports, and the controls its page shows. */
  export?: string;
  params?: Param[];
  /** AI and Backgrounds only: the small heading it sits under on its section page ("Loaders", "Composer"…). */
  kind?: string;
  /** AI and Backgrounds only: props for its live spot on the section page, over the param defaults. */
  preview?: Record<string, number | string | boolean>;
  /** AI and Backgrounds only: how the site shows it ("inline" alone, "composer" around a message box, "field" behind a new-chat screen). */
  stage?: "inline" | "composer" | "field";
}

const RADIX = "radix-ui";

export const ITEMS: Item[] = [
  { name: "corner-shape", title: "Corner shape", group: "Foundations", files: [] },
  { name: "scrollbar", title: "Scrollbar", group: "Foundations", files: [] },

  { name: "button", title: "Button", group: "Actions", files: ["button.tsx"], deps: [RADIX] },
  { name: "menu", title: "Menu", group: "Actions", files: ["menu.tsx"], deps: [RADIX, "@floating-ui/react-dom"] },
  { name: "toolbar", title: "Toolbar", group: "Actions", files: ["toolbar.tsx"], registryDeps: ["popover"] },
  { name: "save-bar", title: "Save bar", group: "Actions", files: ["save-bar.tsx"], registryDeps: ["button"] },

  { name: "input", title: "Input", group: "Inputs", files: ["input.tsx"] },
  { name: "search", title: "Search", group: "Inputs", files: ["search.tsx"], registryDeps: ["input"] },
  { name: "field", title: "Field", group: "Inputs", files: ["field.tsx"] },
  { name: "select", title: "Select", group: "Inputs", files: ["select.tsx"], deps: [RADIX] },
  { name: "multi-select", title: "Multi-select", group: "Inputs", files: ["multi-select.tsx"], deps: [RADIX], registryDeps: ["select"] },
  { name: "combobox", title: "Combobox", group: "Inputs", files: ["combobox.tsx"], deps: [RADIX], registryDeps: ["select"] },
  { name: "date-picker", title: "Date picker", group: "Inputs", files: ["date-picker.tsx"], deps: [RADIX], registryDeps: ["button", "select"] },
  { name: "period-stepper", title: "Period stepper", group: "Inputs", files: ["period-stepper.tsx"], registryDeps: ["button", "tooltip"] },
  { name: "language-picker", title: "Language picker", group: "Inputs", files: ["language-picker.tsx"], registryDeps: ["select"] },
  { name: "segmented", title: "Segmented control", group: "Inputs", files: ["segmented.tsx"] },
  { name: "tabs", title: "Tabs", group: "Inputs", files: ["tabs.tsx"], deps: [RADIX] },
  { name: "switch", title: "Toggle", group: "Inputs", files: ["switch.tsx"], deps: [RADIX] },
  { name: "checkbox", title: "Checkbox", group: "Inputs", files: ["checkbox.tsx"], deps: [RADIX] },
  { name: "radio", title: "Radio", group: "Inputs", files: ["radio.tsx"], deps: [RADIX] },
  { name: "slider", title: "Slider", group: "Inputs", files: ["slider.tsx"], deps: [RADIX] },

  { name: "card", title: "Card", group: "Display", files: ["card.tsx"] },
  { name: "metric-card", title: "Metric card", group: "Display", files: ["card.tsx"] },
  { name: "table", title: "Table", group: "Display", files: ["table.tsx"], registryDeps: ["button", "tooltip"] },
  { name: "attention-list", title: "Attention list", group: "Display", files: ["attention-list.tsx"], registryDeps: ["thumb"] },
  { name: "bar-chart", title: "Bar chart", group: "Display", files: ["bar-chart.tsx"] },
  { name: "status", title: "Status, pill, chip", group: "Display", files: ["status.tsx"] },
  { name: "badge", title: "Badge", group: "Display", files: ["badge.tsx"] },
  { name: "avatar", title: "Avatar", group: "Display", files: ["avatar.tsx"] },
  { name: "thumb", title: "Thumb", group: "Display", files: ["thumb.tsx"] },
  { name: "alert", title: "Alert", group: "Display", files: ["alert.tsx"] },
  { name: "progress", title: "Progress", group: "Display", files: ["progress.tsx"] },
  { name: "empty-state", title: "Empty state", group: "Display", files: ["empty-state.tsx"] },
  { name: "skeleton", title: "Skeleton", group: "Display", files: ["skeleton.tsx"] },

  { name: "dialog", title: "Dialog", group: "Overlays", files: ["dialog.tsx"], deps: [RADIX], registryDeps: ["button"] },
  { name: "sheet", title: "Side pane", group: "Overlays", files: ["sheet.tsx"], deps: [RADIX], registryDeps: ["button", "dialog"] },
  { name: "popover", title: "Popover", group: "Overlays", files: ["popover.tsx"], deps: [RADIX] },
  { name: "tooltip", title: "Tooltip", group: "Overlays", files: ["tooltip.tsx"], deps: [RADIX] },
  { name: "toast", title: "Toast", group: "Overlays", files: ["toast.tsx"] },

  { name: "sidebar", title: "Sidebar", group: "Layout", files: ["sidebar.tsx"], deps: [RADIX] },
  { name: "bottom-nav", title: "Bottom nav", group: "Layout", files: ["bottom-nav.tsx"] },

  // Niche ERP parts: the spotlight on the landing page.
  { name: "command-palette", title: "Command palette", group: "Niche", files: ["command-palette.tsx"], deps: [RADIX], registryDeps: ["dialog", "kbd"] },
  { name: "date-range-picker", title: "Date range picker", group: "Niche", files: ["date-range-picker.tsx"], deps: [RADIX], registryDeps: ["button", "select"] },
  { name: "time-picker", title: "Time picker", group: "Niche", files: ["time-picker.tsx"], deps: [RADIX], registryDeps: ["select"] },
  { name: "quantity-stepper", title: "Quantity stepper", group: "Niche", files: ["quantity-stepper.tsx"] },
  { name: "currency-input", title: "Currency input", group: "Niche", files: ["currency-input.tsx"], registryDeps: ["input"] },
  { name: "diff", title: "Difference", group: "Niche", files: ["diff.tsx"] },
  { name: "fee-row", title: "Fee row", group: "Niche", files: ["fee-row.tsx"], registryDeps: ["marketplace-mark"] },
  { name: "marketplace-mark", title: "Marketplace mark", group: "Niche", files: ["marketplace-mark.tsx"] },
  { name: "shop-picker", title: "Shop picker", group: "Niche", files: ["shop-picker.tsx"], deps: [RADIX], registryDeps: ["checkbox", "select", "marketplace-mark"] },
  { name: "split-button", title: "Split button", group: "Niche", files: ["split-button.tsx"], registryDeps: ["menu"] },
  { name: "toggle-group", title: "Toggle group", group: "Niche", files: ["toggle-group.tsx"], deps: [RADIX] },
  { name: "context-menu", title: "Context menu", group: "Niche", files: ["context-menu.tsx"], deps: [RADIX], registryDeps: ["menu"] },
  { name: "hover-card", title: "Hover card", group: "Niche", files: ["hover-card.tsx"], deps: [RADIX] },
  { name: "column-menu", title: "Column menu", group: "Niche", files: ["column-menu.tsx"], registryDeps: ["button", "checkbox", "popover"] },
  { name: "inline-edit", title: "Inline edit", group: "Niche", files: ["inline-edit.tsx"] },
  { name: "copy-chip", title: "Copy chip", group: "Niche", files: ["copy-chip.tsx"] },
  { name: "kbd", title: "Keyboard shortcut", group: "Niche", files: ["kbd.tsx"] },
  { name: "sparkline", title: "Sparkline", group: "Niche", files: ["sparkline.tsx"] },
  { name: "progress-ring", title: "Progress ring", group: "Niche", files: ["progress-ring.tsx"] },
  { name: "steps", title: "Step progress", group: "Niche", files: ["steps.tsx"] },
  { name: "timeline", title: "Activity timeline", group: "Niche", files: ["timeline.tsx"] },
  { name: "comment-thread", title: "Comment thread", group: "Niche", files: ["comment-thread.tsx"], registryDeps: ["avatar", "button", "popover"] },
  { name: "dropzone", title: "File dropzone", group: "Niche", files: ["dropzone.tsx"], registryDeps: ["button", "progress"] },
  { name: "tag-input", title: "Tag input", group: "Niche", files: ["tag-input.tsx"], registryDeps: ["input"] },
  { name: "avatar-group", title: "Avatar group", group: "Niche", files: ["avatar-group.tsx"], deps: [RADIX], registryDeps: ["avatar", "tooltip"] },
  { name: "notification-bell", title: "Notification bell", group: "Niche", files: ["notification-bell.tsx"], registryDeps: ["button", "popover"] },
  { name: "kanban-card", title: "Kanban card", group: "Niche", files: ["kanban-card.tsx"], registryDeps: ["avatar-group", "badge"] },
  { name: "calendar-month", title: "Calendar month", group: "Niche", files: ["calendar-month.tsx"], registryDeps: ["button"] },

  // AI: loaders and agent chrome. Add one = a file in src/components/ai + an entry here (see README).
  {
    name: "thinking-orbs",
    title: "Thinking orbs",
    group: "AI",
    dir: "ai",
    files: ["thinking-orbs.tsx"],
    export: "ThinkingOrbs",
    kind: "Loaders",
    stage: "inline",
    preview: { size: 72 },
    params: [
      { key: "size", label: "Size", type: "range", min: 14, max: 120, default: 22, unit: "px" },
      { key: "count", label: "Orbs", type: "range", min: 2, max: 8, default: 3 },
      { key: "speed", label: "Speed", type: "range", min: 0.2, max: 3, step: 0.1, default: 1, unit: "×" },
      { key: "orb", label: "Orb size", type: "range", min: 0.08, max: 0.24, step: 0.01, default: 0.154 },
      { key: "ring", label: "Ring", type: "range", min: 0.18, max: 0.42, step: 0.01, default: 0.32 },
      { key: "tone", label: "Colour", type: "select", options: ["ink", "accent", "muted"], default: "ink" },
      { key: "active", label: "Running", type: "toggle", default: true },
    ],
  },
  {
    name: "run-status",
    title: "Run status",
    group: "AI",
    dir: "ai",
    files: ["run-status.tsx"],
    registryDeps: ["thinking-orbs"],
    export: "RunStatus",
    kind: "Loaders",
    stage: "inline",
    params: [
      { key: "text", label: "Text", type: "text", default: "Reading the Board…" },
      { key: "size", label: "Orb size", type: "range", min: 14, max: 40, default: 22, unit: "px" },
      { key: "shimmer", label: "Shimmer", type: "range", min: 0.8, max: 5, step: 0.1, default: 2.2, unit: "s" },
      { key: "speed", label: "Orb speed", type: "range", min: 0.2, max: 3, step: 0.1, default: 1, unit: "×" },
      { key: "tone", label: "Orb colour", type: "select", options: ["ink", "accent", "muted"], default: "ink" },
      { key: "active", label: "Running", type: "toggle", default: true },
    ],
  },
  {
    name: "composer-glow",
    title: "Composer glow",
    group: "AI",
    dir: "ai",
    files: ["composer-glow.tsx"],
    export: "ComposerGlow",
    kind: "Composer",
    stage: "composer",
    params: [
      { key: "halo", label: "Halo", type: "range", min: 8, max: 40, default: 20, unit: "px" },
      { key: "strength", label: "Strength", type: "range", min: 0.1, max: 1, step: 0.05, default: 0.52 },
      { key: "pulse", label: "Pulse", type: "range", min: 1, max: 6, step: 0.1, default: 3.6, unit: "s" },
      { key: "ring", label: "Ring", type: "range", min: 0, max: 1, step: 0.05, default: 0.48 },
      { key: "working", label: "Working", type: "toggle", default: false },
    ],
  },

  // Backgrounds: interactive surfaces behind agent screens. Add one = a file in src/components/backgrounds + an entry here.
  {
    name: "sand-field",
    title: "Sand field",
    group: "Backgrounds",
    dir: "backgrounds",
    files: ["sand-field.tsx"],
    export: "SandField",
    kind: "Interactive",
    stage: "field",
    params: [
      { key: "brightness", label: "Brightness", type: "range", min: 0.05, max: 0.6, step: 0.01, default: 0.21 },
      { key: "size", label: "Reveal size", type: "range", min: 30, max: 180, default: 89, unit: "px" },
      { key: "trail", label: "Trail", type: "range", min: 0, max: 1, step: 0.05, default: 0.2, unit: "s" },
      { key: "hold", label: "Hold", type: "range", min: 0, max: 4, step: 0.1, default: 1, unit: "s" },
      { key: "refill", label: "Refill", type: "range", min: 0.3, max: 5, step: 0.1, default: 1.5, unit: "s" },
      { key: "grain", label: "Grain", type: "range", min: 0, max: 0.6, step: 0.01, default: 0.11 },
      { key: "lightStrength", label: "Light theme depth", type: "range", min: 0.1, max: 0.8, step: 0.01, default: 0.39 },
    ],
  },
];

export const GROUPS: Group[] = ["Foundations", "Actions", "Inputs", "Display", "Overlays", "Layout", "Niche"];

export const SECTIONS: { id: Section; title: string; path: string; groups: Group[] }[] = [
  { id: "components", title: "Components", path: "/components", groups: GROUPS },
  { id: "ai", title: "AI", path: "/ai", groups: ["AI"] },
  { id: "backgrounds", title: "Backgrounds", path: "/backgrounds", groups: ["Backgrounds"] },
];

export const sectionOf = (i: Item): Section => (i.group === "AI" ? "ai" : i.group === "Backgrounds" ? "backgrounds" : "components");
/** The item's page on the site, e.g. /components/button, /ai/thinking-orbs. */
export const itemPath = (i: Item) => `${SECTIONS.find((s) => s.id === sectionOf(i))!.path}/${i.name}`;
/** Source key for a file: "button.tsx" for ui, "ai/thinking-orbs.tsx" for the collections. */
export const sourceKey = (i: Item, file: string) => (!i.dir || i.dir === "ui" ? file : `${i.dir}/${file}`);

export const SITE = "https://design.alorawork.com";

/** Items that ship as a shadcn registry item (have source files). */
export const REGISTRY_ITEMS = ITEMS.filter((i) => i.files.length);

export const findItem = (name: string) => ITEMS.find((i) => i.name === name);
/** Items in the Components section (everything but AI and Backgrounds). */
export const COMPONENT_ITEMS = ITEMS.filter((i) => sectionOf(i) === "components");
