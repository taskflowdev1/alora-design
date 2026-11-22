// Every item on the site: drives the Components, AI and Backgrounds pages, the shadcn registry (/r/<name>.json),
// /api/kit and the README tables (scripts/gen-docs.mjs). Pure data: the API imports it.

import { ITEMS as SHOWPIECES_A } from "./showpieces/a.js";
import { ITEMS as SHOWPIECES_B } from "./showpieces/b.js";
import { ITEMS as SHOWPIECES_C } from "./showpieces/c.js";
import { ITEMS as SHOWPIECES_D } from "./showpieces/d.js";
import { ITEMS as SHOWPIECES_E } from "./showpieces/e.js";
import { ITEMS as SHOWPIECES_F } from "./showpieces/f.js";
import { ITEMS as SHOWPIECES_G } from "./showpieces/g.js";
import { ITEMS as SHOWPIECES_H } from "./showpieces/h.js";
import { ITEMS as SHOWPIECES_I } from "./showpieces/i.js";
import { ITEMS as SHOWPIECES_J } from "./showpieces/j.js";

export type Group =
  | "Actions"
  | "Inputs"
  | "Display"
  | "Charts"
  | "Navigation"
  | "Overlays"
  | "Layout"
  | "Chat"
  | "Foundations"
  | "Niche"
  | "AI"
  | "Backgrounds"
  | MobileGroup;
/** The Mobile half of the library (src/components/mobile and touch sizes of shared parts). */
export type MobileGroup = "Installed app" | "Bars" | "Lists" | "Sheets" | "Touch inputs" | "Data" | "Feedback" | "Flows";
/** The site section an item lives in. Each has its own header tab. */
export type Section = "components" | "mobile" | "ai" | "backgrounds";

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
  dir?: "ui" | "ai" | "backgrounds" | "mobile";
  /** For a renamed item: the current name. Its install is a re-export of that item, and its page redirects there. */
  alias?: string;
  deps?: string[];
  /** Registry items this one's files import. */
  registryDeps?: string[];
  /** Items installed alongside that the files don't import: the parts a usage example puts next to this one. */
  companions?: string[];
  /** AI and Backgrounds only: the component the file exports, and the controls its page shows. */
  export?: string;
  params?: Param[];
  /** AI and Backgrounds only: the small heading it sits under on its section page ("Loaders", "Composer"…). */
  kind?: string;
  /** AI and Backgrounds only: props for its live spot on the section page, over the param defaults. */
  preview?: Record<string, number | string | boolean>;
  /** AI and Backgrounds only: how the site shows it ("inline" alone, "composer" around a message box, "field" behind a new-chat screen). */
  stage?: "inline" | "composer" | "field";
  /** false: kept off the landing and the Components overview (no tile shows it in real use); its page and install stay. */
  showcase?: false;
  /** AI only: the usage snippet, for pieces whose props are data rather than sliders. */
  usage?: string;
}

const RADIX = "radix-ui";

export const ITEMS: Item[] = [
  { name: "corner-shape", title: "Corner shape", group: "Foundations", files: [] },
  { name: "scrollbar", title: "Scrollbar", group: "Foundations", files: [] },

  { name: "button", title: "Button", group: "Actions", files: ["button.tsx"], deps: [RADIX] },
  { name: "menu", title: "Menu", group: "Actions", files: ["menu.tsx"], deps: [RADIX, "@floating-ui/react-dom"] },
  { name: "toolbar", title: "Toolbar", group: "Actions", files: ["toolbar.tsx"], registryDeps: ["popover"] },
  { name: "save-bar", title: "Save bar", group: "Actions", files: ["save-bar.tsx"], registryDeps: ["button"] },
  { name: "button-group", title: "Button group", group: "Actions", files: ["button-group.tsx"], companions: ["button"] },

  { name: "input", title: "Input", group: "Inputs", files: ["input.tsx"] },
  { name: "textarea", title: "Textarea", group: "Inputs", files: ["input.tsx"] },
  { name: "input-group", title: "Input group", group: "Inputs", files: ["input-group.tsx"], registryDeps: ["input"] },
  { name: "input-otp", title: "One-time code", group: "Inputs", files: ["input-otp.tsx"] },
  { name: "label", title: "Label", group: "Inputs", files: ["label.tsx"], deps: [RADIX] },
  { name: "search", title: "Search", group: "Inputs", files: ["search.tsx"], registryDeps: ["input"] },
  { name: "field", title: "Field", group: "Inputs", files: ["field.tsx"], registryDeps: ["input"] },
  { name: "select", title: "Select", group: "Inputs", files: ["select.tsx"], deps: [RADIX] },
  { name: "multi-select", title: "Multi-select", group: "Inputs", files: ["multi-select.tsx"], deps: [RADIX], registryDeps: ["select"] },
  { name: "combobox", title: "Combobox", group: "Inputs", files: ["combobox.tsx"], deps: [RADIX], registryDeps: ["select"] },
  { name: "calendar", title: "Calendar", group: "Inputs", files: ["calendar.tsx"], registryDeps: ["button", "tooltip"] },
  { name: "date-picker", title: "Date picker", group: "Inputs", files: ["date-picker.tsx"], deps: [RADIX], registryDeps: ["calendar", "select"] },
  { name: "period-stepper", title: "Period stepper", group: "Inputs", files: ["period-stepper.tsx"], registryDeps: ["button", "tooltip"] },
  { name: "language-picker", title: "Language picker", group: "Inputs", files: ["language-picker.tsx"], registryDeps: ["select"] },
  { name: "segmented", title: "Segmented control", group: "Inputs", files: ["segmented.tsx"], registryDeps: ["sliding-pill"] },
  { name: "sliding-pill", title: "Sliding pill", group: "Inputs", files: ["sliding-pill.tsx"], showcase: false },
  { name: "tabs", title: "Tabs", group: "Inputs", files: ["tabs.tsx"], deps: [RADIX], registryDeps: ["sliding-pill"] },
  { name: "switch", title: "Toggle", group: "Inputs", files: ["switch.tsx"], deps: [RADIX] },
  { name: "toggle", title: "Toggle button", group: "Inputs", files: ["toggle.tsx"], deps: [RADIX] },
  { name: "checkbox", title: "Checkbox", group: "Inputs", files: ["checkbox.tsx"], deps: [RADIX] },
  { name: "radio", title: "Radio", group: "Inputs", files: ["radio.tsx"], deps: [RADIX] },
  { name: "slider", title: "Slider", group: "Inputs", files: ["slider.tsx"], deps: [RADIX] },
  { name: "number-dial", title: "Number dial", group: "Inputs", files: ["number-dial.tsx"] },
  { name: "password-input", title: "Password", group: "Inputs", files: ["password-input.tsx"], registryDeps: ["input"] },
  { name: "theme-switch", title: "Theme switch", group: "Inputs", files: ["theme-switch.tsx"], registryDeps: ["segmented"] },
  { name: "step-form", title: "Step form", group: "Inputs", files: ["step-form.tsx"], registryDeps: ["button", "steps"] },

  { name: "card", title: "Card", group: "Display", files: ["card.tsx"], registryDeps: ["tooltip"] },
  { name: "metric-card", title: "Metric card", group: "Display", files: ["card.tsx"], registryDeps: ["tooltip"] },
  { name: "table", title: "Table", group: "Display", files: ["table.tsx"], registryDeps: ["pagination"] },
  { name: "attention-list", title: "Attention list", group: "Display", files: ["attention-list.tsx"], companions: ["thumb"] },
  { name: "bar-chart", title: "Bar chart", group: "Display", files: ["bar-chart.tsx"] },
  { name: "status", title: "Status, pill, chip", group: "Display", files: ["status.tsx"], registryDeps: ["sliding-pill"] },
  { name: "badge", title: "Badge", group: "Display", files: ["badge.tsx"] },
  { name: "avatar", title: "Avatar", group: "Display", files: ["avatar.tsx"] },
  { name: "thumb", title: "Thumb", group: "Display", files: ["thumb.tsx"] },
  { name: "alert", title: "Alert", group: "Display", files: ["alert.tsx"] },
  { name: "progress", title: "Progress", group: "Display", files: ["progress.tsx"] },
  { name: "empty-state", title: "Empty state", group: "Display", files: ["empty-state.tsx"] },
  { name: "skeleton", title: "Skeleton", group: "Display", files: ["skeleton.tsx"] },
  { name: "data-table", title: "Data table", group: "Display", files: ["data-table.tsx"], registryDeps: ["checkbox", "column-menu", "empty-state", "input", "pagination", "table"] },
  { name: "item", title: "Item", group: "Display", files: ["item.tsx"], deps: [RADIX] },
  { name: "accordion", title: "Accordion", group: "Display", files: ["accordion.tsx"], deps: [RADIX], registryDeps: ["collapsible"] },
  { name: "collapsible", title: "Collapsible", group: "Display", files: ["collapsible.tsx"], deps: [RADIX] },
  { name: "carousel", title: "Carousel", group: "Display", files: ["carousel.tsx"], registryDeps: ["button", "tooltip"] },
  { name: "aspect-ratio", title: "Aspect ratio", group: "Display", files: ["aspect-ratio.tsx"], deps: [RADIX] },
  { name: "typography", title: "Typography", group: "Display", files: ["typography.tsx"], showcase: false },

  // Charts: one system (series colours, ticks, tooltip, legend in chart.tsx). The bar chart is in Display.
  { name: "chart", title: "Chart parts", group: "Charts", files: ["chart.tsx"] },
  { name: "line-chart", title: "Line chart", group: "Charts", files: ["line-chart.tsx"], registryDeps: ["chart"] },
  { name: "area-chart", title: "Area chart", group: "Charts", files: ["area-chart.tsx"], registryDeps: ["chart"] },
  { name: "pie-chart", title: "Pie and donut", group: "Charts", files: ["pie-chart.tsx"], registryDeps: ["chart"] },
  { name: "radar-chart", title: "Radar chart", group: "Charts", files: ["radar-chart.tsx"], registryDeps: ["chart"] },
  { name: "radial-chart", title: "Radial chart", group: "Charts", files: ["radial-chart.tsx"], registryDeps: ["chart"] },
  { name: "brush", title: "Linked highlight", group: "Charts", files: ["brush.tsx"], companions: ["line-chart", "table"] },

  { name: "breadcrumb", title: "Breadcrumb", group: "Navigation", files: ["breadcrumb.tsx"], registryDeps: ["menu"] },
  { name: "navigation-menu", title: "Navigation menu", group: "Navigation", files: ["navigation-menu.tsx"], deps: [RADIX], registryDeps: ["button", "sliding-pill"] },
  { name: "menubar", title: "Menubar", group: "Navigation", files: ["menubar.tsx"], registryDeps: ["button", "menu"] },
  { name: "pagination", title: "Pagination", group: "Navigation", files: ["pagination.tsx"], registryDeps: ["button", "sliding-pill", "tooltip"] },

  { name: "dialog", title: "Dialog", group: "Overlays", files: ["dialog.tsx"], deps: [RADIX], registryDeps: ["button", "tooltip"] },
  { name: "sheet", title: "Side pane", group: "Overlays", files: ["sheet.tsx"], deps: [RADIX], registryDeps: ["button", "dialog", "tooltip"] },
  { name: "popover", title: "Popover", group: "Overlays", files: ["popover.tsx"], deps: [RADIX] },
  { name: "tooltip", title: "Tooltip", group: "Overlays", files: ["tooltip.tsx"], deps: [RADIX] },
  { name: "toast", title: "Toast", group: "Overlays", files: ["toast.tsx"] },
  { name: "alert-dialog", title: "Alert dialog", group: "Overlays", files: ["alert-dialog.tsx"], deps: [RADIX], registryDeps: ["button", "dialog"] },

  { name: "sidebar", title: "Sidebar", group: "Layout", files: ["sidebar.tsx"], deps: [RADIX], registryDeps: ["sliding-pill"] },

  { name: "resizable", title: "Resizable panes", group: "Layout", files: ["resizable.tsx"], showcase: false },
  { name: "scroll-area", title: "Scroll area", group: "Layout", files: ["scroll-area.tsx"], deps: [RADIX], showcase: false },

  // Chat: the parts of a conversation UI (the AI section holds the loaders and the composer).
  { name: "message", title: "Message and bubble", group: "Chat", files: ["message.tsx"], registryDeps: ["avatar"] },
  { name: "message-scroller", title: "Message scroller", group: "Chat", files: ["message-scroller.tsx"], registryDeps: ["button"] },
  { name: "marker", title: "Marker", group: "Chat", files: ["marker.tsx"] },
  { name: "trace", title: "Trace", group: "Chat", files: ["trace.tsx"], deps: [RADIX] },
  { name: "attachment", title: "Attachment", group: "Chat", files: ["attachment.tsx"], registryDeps: ["button", "progress", "tooltip"] },
  { name: "questionnaire", title: "Questionnaire", group: "Chat", files: ["questionnaire.tsx"], registryDeps: ["button", "input"] },
  { name: "code-block", title: "Code block", group: "Chat", files: ["code-block.tsx"], registryDeps: ["button", "tooltip"] },
  { name: "prompt-suggestions", title: "Prompt suggestions", group: "Chat", files: ["prompt-suggestions.tsx"] },
  { name: "streaming-text", title: "Streaming text", group: "Chat", files: ["streaming-text.tsx"] },
  { name: "citation", title: "Citation", group: "Chat", files: ["citation.tsx"], deps: [RADIX] },
  { name: "proposed-change", title: "Proposed change", group: "Chat", files: ["proposed-change.tsx"], registryDeps: ["button"] },
  { name: "reactions", title: "Reactions", group: "Chat", files: ["reactions.tsx"], registryDeps: ["number-dial"] },

  // Niche ERP parts: the spotlight on the landing page.
  { name: "command-palette", title: "Command palette", group: "Niche", files: ["command-palette.tsx"], deps: [RADIX], registryDeps: ["dialog", "kbd"] },
  { name: "date-range-picker", title: "Date range picker", group: "Niche", files: ["date-range-picker.tsx"], deps: [RADIX], registryDeps: ["button", "select", "sliding-pill", "tooltip"] },
  { name: "time-picker", title: "Time picker", group: "Niche", files: ["time-picker.tsx"], deps: [RADIX], registryDeps: ["select"] },
  { name: "quantity-stepper", title: "Quantity stepper", group: "Niche", files: ["quantity-stepper.tsx"] },
  { name: "currency-input", title: "Currency input", group: "Niche", files: ["currency-input.tsx"], registryDeps: ["input"] },
  { name: "diff", title: "Difference", group: "Niche", files: ["diff.tsx"] },
  { name: "fee-row", title: "Fee row", group: "Niche", files: ["fee-row.tsx"], registryDeps: ["marketplace-mark"] },
  { name: "marketplace-mark", title: "Marketplace mark", group: "Niche", files: ["marketplace-mark.tsx"] },
  { name: "shop-picker", title: "Shop picker", group: "Niche", files: ["shop-picker.tsx"], deps: [RADIX], registryDeps: ["checkbox", "select", "marketplace-mark", "sliding-pill"] },
  { name: "split-button", title: "Split button", group: "Niche", files: ["split-button.tsx"], registryDeps: ["menu"] },
  { name: "toggle-group", title: "Toggle group", group: "Niche", files: ["toggle-group.tsx"], deps: [RADIX], registryDeps: ["sliding-pill"] },
  { name: "context-menu", title: "Context menu", group: "Niche", files: ["context-menu.tsx"], deps: [RADIX], registryDeps: ["kbd", "menu"] },
  { name: "hover-card", title: "Hover card", group: "Niche", files: ["hover-card.tsx"], deps: [RADIX] },
  { name: "column-menu", title: "Column menu", group: "Niche", files: ["column-menu.tsx"], registryDeps: ["button", "checkbox", "popover"] },
  { name: "inline-edit", title: "Inline edit", group: "Niche", files: ["inline-edit.tsx"], registryDeps: ["tooltip"] },
  { name: "copy-chip", title: "Copy chip", group: "Niche", files: ["copy-chip.tsx"] },
  { name: "kbd", title: "Keyboard shortcut", group: "Niche", files: ["kbd.tsx"] },
  { name: "sparkline", title: "Sparkline", group: "Niche", files: ["sparkline.tsx"] },
  { name: "progress-ring", title: "Progress ring", group: "Niche", files: ["progress-ring.tsx"] },
  { name: "steps", title: "Step progress", group: "Niche", files: ["steps.tsx"] },
  { name: "timeline", title: "Activity timeline", group: "Niche", files: ["timeline.tsx"] },
  { name: "comment-thread", title: "Comment thread", group: "Niche", files: ["comment-thread.tsx"], registryDeps: ["avatar", "button", "popover", "tooltip"] },
  { name: "dropzone", title: "File dropzone", group: "Niche", files: ["dropzone.tsx"], registryDeps: ["button", "progress", "tooltip"] },
  { name: "tag-input", title: "Tag input", group: "Niche", files: ["tag-input.tsx"], registryDeps: ["input"] },
  { name: "avatar-group", title: "Avatar group", group: "Niche", files: ["avatar-group.tsx"], registryDeps: ["avatar", "tooltip"] },
  { name: "notification-bell", title: "Notification bell", group: "Niche", files: ["notification-bell.tsx"], registryDeps: ["button", "popover", "tooltip"] },
  { name: "kanban-card", title: "Kanban card", group: "Niche", files: ["kanban-card.tsx"], registryDeps: ["avatar-group", "badge"] },
  { name: "calendar-month", title: "Calendar month", group: "Niche", files: ["calendar-month.tsx"], registryDeps: ["button", "popover", "tooltip"] },
  { name: "holo-card", title: "Holo card", group: "Niche", files: ["holo-card.tsx"] },

  // Mobile: phone components. Own files in src/components/mobile (they import each other relatively, so they install
  // next to each other); shared parts appear here with their touch size. Shown at /mobile in a 390 × 844 phone frame.
  { name: "mobile-tab-bar", title: "Tab bar", group: "Bars", dir: "mobile", files: ["mobile-tab-bar.tsx"], registryDeps: ["sliding-pill", "mobile-badge", "mobile-action-bar"] },
  { name: "mobile-nav-bar", title: "Large-title nav bar", group: "Bars", dir: "mobile", files: ["mobile-nav-bar.tsx"] },
  { name: "mobile-action-bar", title: "Action bar", group: "Bars", dir: "mobile", files: ["mobile-action-bar.tsx"], companions: ["button"] },
  { name: "mobile-list", title: "Grouped list", group: "Lists", dir: "mobile", files: ["mobile-list.tsx"] },
  { name: "mobile-swipe-row", title: "Swipe actions", group: "Lists", dir: "mobile", files: ["mobile-swipe-row.tsx"], companions: ["mobile-list"] },
  { name: "mobile-pull-refresh", title: "Pull to refresh", group: "Lists", dir: "mobile", files: ["mobile-pull-refresh.tsx"], companions: ["mobile-nav-bar"] },
  { name: "mobile-list-skeleton", title: "Skeleton list", group: "Lists", dir: "mobile", files: ["mobile-list.tsx"] },
  { name: "mobile-empty-state", title: "Empty state", group: "Lists", files: ["empty-state.tsx"] },
  { name: "mobile-sheet", title: "Bottom sheet", group: "Sheets", dir: "mobile", files: ["mobile-sheet.tsx"], deps: [RADIX] },
  { name: "mobile-action-sheet", title: "Action sheet", group: "Sheets", dir: "mobile", files: ["mobile-action-sheet.tsx"], registryDeps: ["mobile-sheet"] },
  { name: "mobile-date-picker", title: "Wheel date picker", group: "Sheets", dir: "mobile", files: ["mobile-wheel-picker.tsx"], registryDeps: ["button", "mobile-sheet"] },
  { name: "mobile-segmented", title: "Segmented control", group: "Touch inputs", files: ["segmented.tsx"], registryDeps: ["sliding-pill"] },
  { name: "mobile-search-bar", title: "Search bar", group: "Touch inputs", dir: "mobile", files: ["mobile-search-bar.tsx"] },
  { name: "mobile-stepper", title: "Stepper", group: "Touch inputs", files: ["quantity-stepper.tsx"] },
  { name: "mobile-snackbar", title: "Snackbar", group: "Feedback", dir: "mobile", files: ["mobile-snackbar.tsx"], registryDeps: ["mobile-sheet"] },
    // Inputs, data, sheets and flows the example app's screens use.
  { name: "mobile-filter-chips", title: "Filter chips", group: "Bars", dir: "mobile", files: ["mobile-chip-row.tsx"], registryDeps: ["sliding-pill"] },
  { name: "mobile-top-tabs", title: "Top tabs", group: "Bars", dir: "mobile", files: ["mobile-top-tabs.tsx"] },
  { name: "mobile-choice-rows", title: "Switch, check and radio rows", group: "Lists", dir: "mobile", files: ["mobile-choice-rows.tsx"], registryDeps: ["switch", "sliding-pill"] },
  { name: "mobile-person-row", title: "Avatar rows", group: "Lists", dir: "mobile", files: ["mobile-person-row.tsx"], registryDeps: ["avatar", "mobile-badge"] },
  { name: "mobile-index-list", title: "A–Z index", group: "Lists", dir: "mobile", files: ["mobile-index-scrubber.tsx"] },
  { name: "mobile-picker-sheet", title: "Picker sheet", group: "Sheets", dir: "mobile", files: ["mobile-picker-sheet.tsx"], registryDeps: ["button", "sliding-pill", "mobile-sheet", "mobile-search-bar", "mobile-choice-rows"] },
  { name: "mobile-multi-select", title: "Multi-select sheet", group: "Sheets", dir: "mobile", files: ["mobile-picker-sheet.tsx"], registryDeps: ["button", "sliding-pill", "mobile-sheet", "mobile-search-bar", "mobile-choice-rows"] },
  { name: "mobile-date-range", title: "Date range sheet", group: "Sheets", dir: "mobile", files: ["mobile-date-range.tsx"], registryDeps: ["button", "mobile-sheet", "mobile-filter-chips"] },
  { name: "mobile-context-menu", title: "Long-press menu", group: "Sheets", dir: "mobile", files: ["mobile-context-menu.tsx"], registryDeps: ["mobile-sheet"] },
  { name: "mobile-modal", title: "Full-screen modal", group: "Sheets", dir: "mobile", files: ["mobile-modal.tsx"], deps: [RADIX], registryDeps: ["mobile-sheet", "mobile-alert", "mobile-action-bar"] },
  { name: "mobile-alert", title: "Alert dialog", group: "Sheets", dir: "mobile", files: ["mobile-alert.tsx"], deps: [RADIX], registryDeps: ["mobile-sheet"] },
  { name: "mobile-text-field", title: "Text field", group: "Touch inputs", dir: "mobile", files: ["mobile-text-field.tsx"] },
  { name: "mobile-keypad", title: "Amount keypad", group: "Touch inputs", dir: "mobile", files: ["mobile-keypad.tsx"], registryDeps: ["button", "mobile-sheet"] },
  { name: "mobile-slider", title: "Slider", group: "Touch inputs", dir: "mobile", files: ["mobile-slider.tsx"] },
  { name: "mobile-photo-picker", title: "Photo picker", group: "Touch inputs", dir: "mobile", files: ["mobile-photo-picker.tsx"], registryDeps: ["button", "mobile-sheet"] },
  { name: "mobile-scanner", title: "Barcode scanner", group: "Touch inputs", dir: "mobile", files: ["mobile-scanner.tsx"], registryDeps: ["button", "mobile-text-field"] },
  { name: "mobile-signature", title: "Signature pad", group: "Touch inputs", dir: "mobile", files: ["mobile-signature.tsx"] },
  { name: "mobile-otp", title: "One-time code", group: "Touch inputs", files: ["input-otp.tsx"] },
  { name: "mobile-stat-tiles", title: "Stat tiles", group: "Data", dir: "mobile", files: ["mobile-stats.tsx"], registryDeps: ["mobile-scrub-chart"] },
  { name: "mobile-kpi-carousel", title: "KPI carousel", group: "Data", dir: "mobile", files: ["mobile-stats.tsx"], registryDeps: ["mobile-scrub-chart"] },
  { name: "mobile-scrub-chart", title: "Scrub charts", group: "Data", dir: "mobile", files: ["mobile-scrub-chart.tsx"] },
  { name: "mobile-timeline", title: "Order timeline", group: "Data", dir: "mobile", files: ["mobile-timeline.tsx"] },
  { name: "mobile-steps", title: "Progress steps", group: "Data", files: ["steps.tsx"] },
  { name: "mobile-receipt", title: "Receipt", group: "Data", dir: "mobile", files: ["mobile-receipt.tsx"] },
  { name: "mobile-badge", title: "Badge counts", group: "Data", dir: "mobile", files: ["mobile-badge.tsx"] },
  { name: "mobile-banner", title: "Offline banner", group: "Feedback", dir: "mobile", files: ["mobile-banner.tsx"] },
  { name: "mobile-upload-row", title: "Upload progress", group: "Feedback", dir: "mobile", files: ["mobile-upload-row.tsx"] },
  { name: "mobile-onboarding", title: "Onboarding pager", group: "Flows", dir: "mobile", files: ["mobile-pager.tsx"], registryDeps: ["button"] },
  { name: "mobile-chat", title: "Chat and composer", group: "Flows", dir: "mobile", files: ["mobile-chat.tsx"] },
  // Installed app (PWA): what a web app needs once it lives on the home screen.
  { name: "mobile-install-prompt", title: "Install prompt", group: "Installed app", dir: "mobile", files: ["mobile-install-prompt.tsx"], registryDeps: ["mobile-sheet", "mobile-state-button"] },
  { name: "mobile-passkey", title: "Passkey sign-in", group: "Installed app", dir: "mobile", files: ["mobile-passkey.tsx"], registryDeps: ["avatar", "button", "mobile-sheet", "mobile-state-button"] },
  { name: "mobile-push-ask", title: "Notification ask", group: "Installed app", dir: "mobile", files: ["mobile-push-ask.tsx"], registryDeps: ["button"] },
  { name: "mobile-app-header", title: "App header", group: "Installed app", dir: "mobile", files: ["mobile-app-header.tsx"] },
  { name: "mobile-app-badge", title: "App badge", group: "Installed app", dir: "mobile", files: ["mobile-app-badge.tsx"], registryDeps: ["mobile-badge"] },
  { name: "mobile-sync-status", title: "Offline queue", group: "Installed app", dir: "mobile", files: ["mobile-sync-status.tsx"], registryDeps: ["button", "mobile-list", "mobile-sheet"] },
  { name: "mobile-update-toast", title: "Update toast", group: "Installed app", dir: "mobile", files: ["mobile-update-toast.tsx"], registryDeps: ["mobile-state-button"] },
  { name: "mobile-page-stack", title: "Swipe-back stack", group: "Installed app", dir: "mobile", files: ["mobile-page-stack.tsx"] },
  { name: "mobile-share", title: "Share sheet", group: "Installed app", dir: "mobile", files: ["mobile-share.tsx"], registryDeps: ["mobile-list", "mobile-sheet", "mobile-state-button"] },
  { name: "mobile-camera", title: "Camera scan", group: "Installed app", dir: "mobile", files: ["mobile-camera.tsx"], companions: ["mobile-scanner"] },
  { name: "mobile-wake-lock", title: "Keep screen on", group: "Installed app", dir: "mobile", files: ["mobile-wake-lock.tsx"], registryDeps: ["mobile-choice-rows"] },
  { name: "mobile-state-button", title: "State button", group: "Installed app", dir: "mobile", files: ["mobile-state-button.tsx"], registryDeps: ["button"] },

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
    preview: { size: 52 },
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
    registryDeps: ["button", "tooltip"],
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
  {
    name: "chat-list",
    title: "Chat list",
    group: "AI",
    dir: "ai",
    files: ["chat-list.tsx"],
    registryDeps: ["button", "menu", "sliding-pill", "thinking-orbs", "tooltip"],
    export: "ChatList",
    kind: "Assistant",
    stage: "inline",
    params: [{ key: "collapsed", label: "Collapsed", type: "toggle", default: false }],
    usage: `import { ChatList } from "@/components/ui/chat-list";

<ChatList
  chats={[{ id: "late", title: "Late orders this week", when: "14:12", group: "Today" }]}
  selectedId={id}
  onSelect={setId}
  onNewChat={startChat}
  onPin={pin}
  onRename={rename}
  onArchive={archive}
  onDelete={remove}
/>`,
  },
  {
    name: "empty-chat",
    title: "New chat screen",
    group: "AI",
    dir: "ai",
    files: ["empty-chat.tsx"],
    export: "EmptyChat",
    kind: "Assistant",
    stage: "inline",
    companions: ["composer-glow"],
    usage: `import { EmptyChat } from "@/components/ui/empty-chat";
import { Composer, ComposerGlow } from "@/components/ui/composer-glow";

<EmptyChat suggestions={[{ text: "Which orders are late this week?" }]} onPick={send}>
  <ComposerGlow className="w-full">
    <Composer onSend={send} />
  </ComposerGlow>
</EmptyChat>`,
  },
  {
    name: "assistant-markdown",
    title: "Assistant reply",
    group: "AI",
    dir: "ai",
    files: ["assistant-markdown.tsx"],
    registryDeps: ["tooltip"],
    export: "AssistantMarkdown",
    kind: "Assistant",
    stage: "inline",
    params: [{ key: "stream", label: "Streaming", type: "toggle", default: false }],
    usage: `import { AssistantMarkdown } from "@/components/ui/assistant-markdown";

<AssistantMarkdown
  text="**7 orders** are late [1]."
  reveal={streaming ? wordsSoFar : undefined}
  citeTitle={(n) => sources[n - 1]?.title}
  onCite={(n) => openSource(sources[n - 1]?.id)}
/>`,
  },
  {
    name: "message-sources",
    title: "Message sources",
    group: "AI",
    dir: "ai",
    files: ["message-sources.tsx"],
    registryDeps: ["button", "tooltip"],
    export: "MessageSources",
    kind: "Assistant",
    stage: "inline",
    usage: `import { MessageSources } from "@/components/ui/message-sources";

<MessageSources
  sources={[
    { id: "orders", title: "7 late orders", kind: "order", fields: [{ label: "Kemang", value: "5 orders" }] },
  ]}
/>`,
  },
  {
    name: "proposal-card",
    title: "Proposal card",
    group: "AI",
    dir: "ai",
    files: ["proposal-card.tsx"],
    registryDeps: ["button"],
    export: "ProposalCard",
    kind: "Assistant",
    stage: "inline",
    params: [{ key: "status", label: "State", type: "select", options: ["live", "pending", "applying", "applied", "declined"], default: "live" }],
    usage: `import { ProposalCard } from "@/components/ui/proposal-card";

<ProposalCard
  title="Move 6 Gelas kopi tanah liat from Dago to Kemang"
  changes={[{ label: "Kemang stock", before: "2", after: "8" }]}
  onApprove={() => applyTransfer()}
  onDecline={dismiss}
/>`,
  },
  {
    name: "report-row",
    title: "Report row",
    group: "AI",
    dir: "ai",
    files: ["report-row.tsx"],
    registryDeps: ["button", "tooltip"],
    export: "ReportRow",
    kind: "Assistant",
    stage: "inline",
    params: [{ key: "making", label: "Making", type: "toggle", default: false }],
    usage: `import { ReportRow } from "@/components/ui/report-row";

<ReportRow name="Payout, November.pdf" meta="2 pages · 84 KB" making={making} onPreview={open} onDownload={save} />`,
  },
  {
    name: "turn-rail",
    title: "Turn rail",
    group: "AI",
    dir: "ai",
    files: ["turn-rail.tsx"],
    export: "TurnRail",
    kind: "Assistant",
    stage: "inline",
    usage: `import { TurnRail } from "@/components/ui/turn-rail";

// Each question in the thread carries data-turn={id}; the parent is position: relative.
<TurnRail turns={[{ id: "t1", question: "Which orders are late?" }, { id: "t2", question: "Why?" }]} scrollRef={threadRef} />`,
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
  ...SHOWPIECES_A,
  ...SHOWPIECES_B,
  ...SHOWPIECES_C,
  ...SHOWPIECES_D,
  ...SHOWPIECES_E,
  ...SHOWPIECES_F,
  ...SHOWPIECES_G,
  ...SHOWPIECES_H,
  ...SHOWPIECES_I,
  ...SHOWPIECES_J,
];

export const GROUPS: Group[] = ["Foundations", "Actions", "Inputs", "Display", "Charts", "Navigation", "Overlays", "Layout", "Chat", "Niche"];

export const MOBILE_GROUPS: MobileGroup[] = ["Installed app", "Bars", "Lists", "Sheets", "Touch inputs", "Data", "Feedback", "Flows"];

const SECTIONS: { id: Section; title: string; path: string; groups: Group[] }[] = [
  { id: "components", title: "Components", path: "/components", groups: GROUPS },
  { id: "mobile", title: "Mobile", path: "/mobile", groups: MOBILE_GROUPS },
  { id: "ai", title: "AI", path: "/ai", groups: ["AI"] },
  { id: "backgrounds", title: "Backgrounds", path: "/backgrounds", groups: ["Backgrounds"] },
];

export const sectionOf = (i: Item): Section =>
  i.group === "AI" ? "ai" : i.group === "Backgrounds" ? "backgrounds" : (MOBILE_GROUPS as Group[]).includes(i.group) ? "mobile" : "components";
/** The item's page on the site, e.g. /components/button, /ai/thinking-orbs. */
export const itemPath = (i: Item) => `${SECTIONS.find((s) => s.id === sectionOf(i))!.path}/${i.name}`;
/** Source key for a file: "button.tsx" for ui, "ai/thinking-orbs.tsx" for the collections. */
export const sourceKey = (i: Item, file: string) => (!i.dir || i.dir === "ui" ? file : `${i.dir}/${file}`);

export const SITE = "https://design.alorawork.com";

/** Items that ship as a shadcn registry item (have source files). */
export const REGISTRY_ITEMS = ITEMS.filter((i) => i.files.length);

export const findItem = (name: string) => ITEMS.find((i) => i.name === name);
/** Items in the Components section (desktop: everything but Mobile, AI and Backgrounds). */
export const COMPONENT_ITEMS = ITEMS.filter((i) => sectionOf(i) === "components");
