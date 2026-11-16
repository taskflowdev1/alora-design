// Component list: drives the gallery sidebar, the shadcn registry (/r/<name>.json) and /api/kit.

export type Group = "Actions" | "Inputs" | "Display" | "Overlays" | "Layout" | "Foundations";

export interface Item {
  name: string;
  title: string;
  group: Group;
  /** Files under src/components/ui. Empty for foundation pages. */
  files: string[];
  deps?: string[];
  registryDeps?: string[];
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
];

export const GROUPS: Group[] = ["Foundations", "Actions", "Inputs", "Display", "Overlays", "Layout"];

export const SITE = "https://design.alorawork.com";

/** Items that ship as a shadcn registry item (have source files). */
export const REGISTRY_ITEMS = ITEMS.filter((i) => i.files.length);

export const findItem = (name: string) => ITEMS.find((i) => i.name === name);
