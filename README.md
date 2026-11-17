# Alora Design

React components in Joshua Dirga's ERP UI taste, shadcn style: you copy the source into your app, already themed with
your settings. Live gallery: **https://design.alorawork.com**

- **Components**: ERP components (inputs, tables, overlays, niche parts like fee rows, shop pickers, command palette).
- **AI**: loaders and agent chrome from the Alora Board assistant (thinking orbs, run status, composer glow).
- **Backgrounds**: interactive surfaces for agent screens (the Board's sand field).
- **Examples**: seven ERP pages built only from these components. **Export**: tokens, Tailwind block, agent kit.

The taste rules live in the [erp-ui skill](https://github.com/JoshD94/ai-skills/tree/main/erp-ui).

## Install

Pick your settings on the site (the Customize panel on the left edge, or the header button on a phone); every link
and command then carries them. Install one component, its dependencies and the theme in one go:

```sh
npx shadcn@latest add "https://design.alorawork.com/r/button.json?r=14&a=3c6fe0"
```

`/r/<name>.json?<settings>` is a shadcn registry item; it pulls in `/r/theme.json?<settings>` (CSS variables and base
rules) and `/r/ad.json` (the `cn()` helper). The theme alone: `npx shadcn@latest add "https://design.alorawork.com/r/theme.json?<settings>"`.
The full list is at `/r/registry.json`.

Other exports, all taking the same settings:

| What | URL |
| --- | --- |
| Agent kit (markdown for a coding agent: rules, tokens, every component's install URL) | `https://design.alorawork.com/api/kit?<settings>` |
| Tokens as CSS / JSON | `/tokens.css?<settings>`, `/tokens.json?<settings>` |
| Tailwind v4 `@theme` block | `/tailwind.css?<settings>` |

## Settings

One config drives every component through `--ad-*` CSS variables. In a URL it is a short query (defaults left out):
`?r=14&c=r&a=3c6fe0&t=l` is radius 14, round corners, a blue accent, light theme.

<!-- settings:start -->
| Setting | URL key | Default | Range or values | Notes |
| --- | --- | --- | --- | --- |
| Radius | `r` | `12 px` | 0–24 px | Control radius in px (buttons, inputs, dropdowns). Cards and menus derive from it. |
| Corner shape | `c` | `squircle` | `square` (s), `round` (r), `squircle` (q) | Square, round (circular arcs) or squircle (continuous curves, via corner-shape where supported). |
| Smoothing | `k` | `2` | 1–3 | superellipse(k): 1 = round, 2 = squircle, up to 3. Used when corner = squircle. |
| Padding | `p` | `16 px` | 8–24 px | Card padding in px. |
| Height | `h` | `36 px` | 32–44 px | Control height and table row height in px. |
| Accent | `a` | `#dc467d` | any hex, `a=` without `#` | Primary buttons, key actions and focus fills; chart shades derive from it. |
| Greys | `g` | `neutral` | `neutral` (n), `cool` (c), `warm` (w) | Tint of the greys: neutral, cool (blue hint) or warm. |
| Shadow | `sh` | `50%` | 0–100% | Card and menu shadow strength, 0 to 100. |
| Text size | `f` | `13 px` | 12–15 px | Base font size in px. |
| Theme | `t` | `dark` | `light` (l), `dark` (d) | Default theme; the other one is a class away (.light or .dark). |
<!-- settings:end -->

Radii nest: control radius R, nest gap G = round(R/3), card = R + G, item = R − G, sheet = R + padding. Square zeroes
every radius; circles (avatars, dots) always stay round.

## Components

Every component, its install name and its props (types and notes in [docs/components.md](docs/components.md)).
Generated from the source by `scripts/gen-docs.mjs`; `scripts/verify` fails when this table drifts.

<!-- components:start -->
### Foundations

| Component | Install name | Exports | Props (`=default`) |
| --- | --- | --- | --- |
| [Corner shape](https://design.alorawork.com/components/corner-shape) | in `theme` | — | Set by the theme (see Settings) |
| [Scrollbar](https://design.alorawork.com/components/scrollbar) | in `theme` | — | Set by the theme (see Settings) |

### Actions

| Component | Install name | Exports | Props (`=default`) |
| --- | --- | --- | --- |
| [Button](https://design.alorawork.com/components/button) | `button` | `Button` | `variant`, `size`, `icon`, `asChild` |
| [Menu](https://design.alorawork.com/components/menu) | `menu` | `Menu`, `MenuItem`, `MenuLabel`, `MenuGroup`, `MenuSub` | `trigger`, `children`, `align="start"`, `side="bottom"`, `tone="light"`, `showSafeArea`, `open`, `onOpenChange`, `className`, `icon`, `shortcut`, `onSelect`, `disabled`, `label` |
| [Toolbar](https://design.alorawork.com/components/toolbar) | `toolbar` | `Toolbar`, `ToolbarSpacer`, `PageHeader` | `className`, `children`, `title` |
| [Save bar](https://design.alorawork.com/components/save-bar) | `save-bar` | `SaveBar` | `open`, `onSave`, `onDiscard`, `saving`, `label="Unsaved changes"`, `inline`, `className` |

### Inputs

| Component | Install name | Exports | Props (`=default`) |
| --- | --- | --- | --- |
| [Input](https://design.alorawork.com/components/input) | `input` | `Input`, `Textarea` | `icon`, `end`, `invalid`, `wrapperClassName` |
| [Search](https://design.alorawork.com/components/search) | `search` | `Search` | `value`, `onValueChange`, `invalid`, `wrapperClassName` |
| [Field](https://design.alorawork.com/components/field) | `field` | `Field` | `label`, `error`, `layout="stack"`, `className`, `children`, `htmlFor` |
| [Select](https://design.alorawork.com/components/select) | `select` | `OptionList`, `Select` | `id`, `options`, `active`, `setActive`, `isSelected`, `onPick`, `multiple`, `empty`, `className`, `value`, `onValueChange`, `placeholder="Select"`, `prefix`, `disabled`, `contentClassName`, `align="start"`, `aria-label`, `renderValue` |
| [Multi-select](https://design.alorawork.com/components/multi-select) | `multi-select` | `MultiSelect` | `value`, `onValueChange`, `options`, `placeholder="Select"`, `maxChips=2`, `className`, `aria-label` |
| [Combobox](https://design.alorawork.com/components/combobox) | `combobox` | `Combobox` | `value`, `onValueChange`, `options`, `placeholder="Select"`, `searchPlaceholder="Search"`, `empty="No match"`, `className`, `aria-label` |
| [Date picker](https://design.alorawork.com/components/date-picker) | `date-picker` | `DatePicker` | `value`, `onValueChange`, `placeholder="Pick a date"`, `smart=true`, `today=new Date()`, `className` |
| [Period stepper](https://design.alorawork.com/components/period-stepper) | `period-stepper` | `PeriodStepper` | `value`, `period`, `onValueChange`, `max`, `className` |
| [Language picker](https://design.alorawork.com/components/language-picker) | `language-picker` | `LanguagePicker` | `value`, `onValueChange`, `languages=LANGUAGES`, `className` |
| [Segmented control](https://design.alorawork.com/components/segmented) | `segmented` | `Segmented` | `value`, `onValueChange`, `options`, `className`, `aria-label` |
| [Tabs](https://design.alorawork.com/components/tabs) | `tabs` | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | none |
| [Toggle](https://design.alorawork.com/components/switch) | `switch` | `Switch` | `size="default"` |
| [Checkbox](https://design.alorawork.com/components/checkbox) | `checkbox` | `Checkbox`, `CheckboxField` | `label` |
| [Radio](https://design.alorawork.com/components/radio) | `radio` | `RadioGroup`, `Radio` | `label` |
| [Slider](https://design.alorawork.com/components/slider) | `slider` | `Slider` | `value`, `onValueChange`, `min`, `max`, `step=1`, `label`, `display`, `className` |

### Display

| Component | Install name | Exports | Props (`=default`) |
| --- | --- | --- | --- |
| [Card](https://design.alorawork.com/components/card) | `card` | `Card`, `CardHeader` | `interactive`, `inset="pad"`, `title`, `action`, `className` |
| [Metric card](https://design.alorawork.com/components/metric-card) | `metric-card` | `MetricCard` | `label`, `value`, `unit`, `delta`, `primary`, `interactive`, `variant="tile"`, `short`, `loading` |
| [Table](https://design.alorawork.com/components/table) | `table` | `Table`, `THead`, `TBody`, `TRow`, `TH`, `TD`, `TableBar` | `children`, `selected`, `onActivate`, `align="left"`, `className`, `width`, `maxWidth`, `page`, `total`, `pageSize=50`, `onPageChange` |
| [Data grid](https://design.alorawork.com/components/data-grid) | `data-grid` | `GridLegend`, `DataGrid`, `GridDetail`, `GridFigureDialog` | `items`, `className`, `columns`, `rows`, `rowKey`, `visible`, `onRowActivate`, `onCellDetail`, `selectedKey`, `legend`, `totalLabel="Total"`, `maxHeight`, `empty="Nothing here yet"`, `figures`, `open`, `onOpenChange`, `figure` |
| [Attention list](https://design.alorawork.com/components/attention-list) | `attention-list` | `AttentionList`, `AttentionItem` | `children`, `className`, `media`, `title`, `meta`, `value`, `action`, `onClick` |
| [Bar chart](https://design.alorawork.com/components/bar-chart) | `bar-chart` | `BarChart`, `BarList` | `data`, `height=140`, `current`, `labelEvery=1`, `loading`, `className`, `aria-label`, `selected`, `onSelect` |
| [Status, pill, chip](https://design.alorawork.com/components/status) | `status` | `Status`, `Pill`, `Chip` | `tone="default"`, `children`, `className`, `tone="attention"`, `dot`, `selected`, `onClick`, `onRemove`, `size="default"` |
| [Badge](https://design.alorawork.com/components/badge) | `badge` | `Badge` | `children`, `className` |
| [Avatar](https://design.alorawork.com/components/avatar) | `avatar` | `Avatar` | `name`, `src`, `size="md"`, `className` |
| [Thumb](https://design.alorawork.com/components/thumb) | `thumb` | `Thumb` | `src`, `alt`, `size=32`, `className` |
| [Alert](https://design.alorawork.com/components/alert) | `alert` | `Alert` | `tone="neutral"`, `title`, `children`, `action`, `className` |
| [Progress](https://design.alorawork.com/components/progress) | `progress` | `Progress` | `value`, `max=100`, `className`, `aria-label` |
| [Empty state](https://design.alorawork.com/components/empty-state) | `empty-state` | `EmptyState` | `icon`, `title`, `className` |
| [Skeleton](https://design.alorawork.com/components/skeleton) | `skeleton` | `Skeleton`, `Loading`, `LoadingText` | `loading`, `children`, `className` |

### Overlays

| Component | Install name | Exports | Props (`=default`) |
| --- | --- | --- | --- |
| [Dialog](https://design.alorawork.com/components/dialog) | `dialog` | `Dialog` | `open`, `onOpenChange`, `trigger`, `title`, `children`, `footer`, `className` |
| [Side pane](https://design.alorawork.com/components/sheet) | `sheet` | `Sheet` | `open`, `onOpenChange`, `title`, `children`, `footer`, `modal=true`, `keepOpenOn`, `className` |
| [Popover](https://design.alorawork.com/components/popover) | `popover` | `PopoverGroup`, `Popover` | `children`, `trigger`, `align="start"`, `side="bottom"`, `open`, `onOpenChange`, `className`, `tone` |
| [Tooltip](https://design.alorawork.com/components/tooltip) | `tooltip` | `TooltipProvider`, `Tooltip` | `children`, `content`, `side="top"`, `open` |
| [Toast](https://design.alorawork.com/components/toast) | `toast` | `Toaster`, `ToastView` | `tone="success"`, `children`, `className` |

### Layout

| Component | Install name | Exports | Props (`=default`) |
| --- | --- | --- | --- |
| [Sidebar](https://design.alorawork.com/components/sidebar) | `sidebar` | `Sidebar`, `SidebarSection`, `SidebarItem` | `className`, `children`, `label`, `icon`, `active`, `count`, `asChild`, `onClick` |
| [Bottom nav](https://design.alorawork.com/components/bottom-nav) | `bottom-nav` | `BottomNav`, `BottomNavItem`, `Fab` | `children`, `className`, `icon`, `label`, `active`, `onClick` |

### Niche ERP parts

| Component | Install name | Exports | Props (`=default`) |
| --- | --- | --- | --- |
| [Command palette](https://design.alorawork.com/components/command-palette) | `command-palette` | `CommandPalette` | `open=false`, `onOpenChange`, `groups`, `placeholder`, `empty`, `inline`, `className` |
| [Date range picker](https://design.alorawork.com/components/date-range-picker) | `date-range-picker` | `DateRangePicker` | `value`, `onValueChange`, `presets=DEFAULT_PRESETS`, `today=new Date()`, `className` |
| [Time picker](https://design.alorawork.com/components/time-picker) | `time-picker` | `TimePicker` | `value`, `onValueChange`, `step=15`, `placeholder="Pick a time"`, `className` |
| [Quantity stepper](https://design.alorawork.com/components/quantity-stepper) | `quantity-stepper` | `QuantityStepper` | `value`, `onValueChange`, `min=0`, `max=Infinity`, `step=1`, `size="default"`, `className`, `aria-label` |
| [Currency input](https://design.alorawork.com/components/currency-input) | `currency-input` | `CurrencyInput` | `value`, `onValueChange`, `currency="Rp"`, `placeholder="0"`, `invalid`, `className`, `aria-label` |
| [Difference](https://design.alorawork.com/components/diff) | `diff` | `Diff` | `value`, `unit`, `format=(n) => Math.round(n).toLocaleString("id-ID")`, `tolerance=0`, `zero="—"`, `className` |
| [Fee row](https://design.alorawork.com/components/fee-row) | `fee-row` | `FeeRow`, `FeeTotal` | `payer`, `market="shopee"`, `label`, `amount`, `unit="Rp"`, `shipping`, `className` |
| [Marketplace mark](https://design.alorawork.com/components/marketplace-mark) | `marketplace-mark` | `MarketMark` | `market`, `size=16`, `className` |
| [Shop picker](https://design.alorawork.com/components/shop-picker) | `shop-picker` | `ShopPicker` | `shops`, `value`, `onValueChange`, `quick=["shopee", "tiktok"]`, `className` |
| [Split button](https://design.alorawork.com/components/split-button) | `split-button` | `SplitButton` | `children`, `onClick`, `menu`, `variant="primary"`, `disabled`, `className`, `aria-label` |
| [Toggle group](https://design.alorawork.com/components/toggle-group) | `toggle-group` | `ToggleGroup` | `value`, `onValueChange`, `options`, `className`, `aria-label` |
| [Context menu](https://design.alorawork.com/components/context-menu) | `context-menu` | `ContextMenu`, `ContextMenuItem`, `ContextMenuGroup`, `ContextMenuSub` | `children`, `menu`, `className`, `icon`, `shortcut`, `onSelect`, `disabled`, `label` |
| [Hover card](https://design.alorawork.com/components/hover-card) | `hover-card` | `HoverCard` | `trigger`, `children`, `side="bottom"`, `align="start"`, `className` |
| [Column menu](https://design.alorawork.com/components/column-menu) | `column-menu` | `ColumnMenu` | `columns`, `visible`, `onVisibleChange`, `defaults`, `className` |
| [Inline edit](https://design.alorawork.com/components/inline-edit) | `inline-edit` | `InlineEdit` | `value`, `onSave`, `display`, `validate`, `align="left"`, `inputMode`, `className`, `aria-label` |
| [Copy chip](https://design.alorawork.com/components/copy-chip) | `copy-chip` | `CopyChip` | `value`, `children`, `onCopied`, `className` |
| [Keyboard shortcut](https://design.alorawork.com/components/kbd) | `kbd` | `Kbd`, `Shortcut` | `children`, `className`, `keys` |
| [Sparkline](https://design.alorawork.com/components/sparkline) | `sparkline` | `Sparkline` | `data`, `kind="line"`, `width=96`, `height=28`, `dot=true`, `className`, `aria-label` |
| [Progress ring](https://design.alorawork.com/components/progress-ring) | `progress-ring` | `ProgressRing` | `value`, `max=100`, `size=48`, `thickness=5`, `label`, `className`, `aria-label` |
| [Step progress](https://design.alorawork.com/components/steps) | `steps` | `Steps` | `steps`, `current`, `className` |
| [Activity timeline](https://design.alorawork.com/components/timeline) | `timeline` | `Timeline` | `events`, `className` |
| [Comment thread](https://design.alorawork.com/components/comment-thread) | `comment-thread` | `CommentThread` | `comments`, `me`, `onReact`, `onReply`, `className` |
| [File dropzone](https://design.alorawork.com/components/dropzone) | `dropzone` | `Dropzone` | `onFiles`, `accept`, `multiple=true`, `files=[]`, `onRemove`, `title="Drop files here"`, `className` |
| [Tag input](https://design.alorawork.com/components/tag-input) | `tag-input` | `TagInput` | `value`, `onValueChange`, `placeholder="Add a tag"`, `suggestions=[]`, `className`, `aria-label` |
| [Avatar group](https://design.alorawork.com/components/avatar-group) | `avatar-group` | `AvatarGroup` | `people`, `max=4`, `size="md"`, `className` |
| [Notification bell](https://design.alorawork.com/components/notification-bell) | `notification-bell` | `NotificationBell` | `notices`, `onMarkAllRead`, `className` |
| [Kanban card](https://design.alorawork.com/components/kanban-card) | `kanban-card` | `KanbanCard`, `KanbanColumn` | `title`, `id`, `media`, `tags=[]`, `people=[]`, `due`, `attention`, `onClick`, `className`, `count`, `children` |
| [Calendar month](https://design.alorawork.com/components/calendar-month) | `calendar-month` | `CalendarMonth` | `month`, `onMonthChange`, `events`, `today=new Date()`, `max=2`, `onEventClick`, `className` |

### AI

| Component | Install name | Exports | Props (`=default`) |
| --- | --- | --- | --- |
| [Thinking orbs](https://design.alorawork.com/ai/thinking-orbs) | `thinking-orbs` | `ThinkingOrbs` | `active=true`, `size=22`, `count=3`, `speed=1`, `orb=0.154`, `ring=0.32`, `tone="ink"`, `className` |
| [Run status](https://design.alorawork.com/ai/run-status) | `run-status` | `RunStatus` | `text`, `active=true`, `size=22`, `shimmer=2.2`, `speed=1`, `tone="ink"`, `className` |
| [Composer glow](https://design.alorawork.com/ai/composer-glow) | `composer-glow` | `ComposerGlow` | `children`, `working=false`, `breathe=true`, `halo=20`, `strength=0.52`, `pulse=3.6`, `ring=0.48`, `radius="var(--ad-radius-sheet)"`, `className` |
| [Assistant launcher](https://design.alorawork.com/ai/assistant-launcher) | `assistant-launcher` | `AloraMark`, `AssistantLauncher` | `className`, `label="Alora"`, `open`, `onOpenChange`, `floating=false`, `onNewChat`, `onExpand`, `icon`, `children` |

### Backgrounds

| Component | Install name | Exports | Props (`=default`) |
| --- | --- | --- | --- |
| [Sand field](https://design.alorawork.com/backgrounds/sand-field) | `sand-field` | `SandField` | `brightness=0.21`, `size=89`, `trail=0.2`, `hold=1`, `refill=1.5`, `grain=0.11`, `lightStrength=0.39`, `className` |
<!-- components:end -->

## Adding an AI loader or a background

One file and one registry entry; the site builds its live spot, page and sliders from them.

1. Add `src/components/ai/<name>.tsx` (or `src/components/backgrounds/<name>.tsx`) exporting one component. Keep it
   self-contained: colours from the tokens (`var(--ad-brand)`, `text-ink`), animate only on screen
   (IntersectionObserver), honour `prefers-reduced-motion`, keyframes in a `<style href precedence>` tag inside the
   file. Backgrounds fill their parent (`absolute inset-0`) and listen to the pointer there.
2. Add an entry to `ITEMS` in `src/lib/registry.ts` with `group: "AI"` (or `"Backgrounds"`), `dir`, `files`,
   `export` (the component's name), `kind` (its small heading, shown once the section has more than four items), `stage` (`inline`, `composer` or `field`) and `params`
   (one slider, select, toggle or text field per prop: `{ key, label, type, min, max, step, default, unit }`).
   `preview` sets props for its spot on the section page.
3. Run `node scripts/gen-docs.mjs` to refresh the tables, then `scripts/verify`.

## Develop

```sh
npm ci
npm run dev          # http://localhost:5190
npx tsc -p tsconfig.json --noEmit && npx eslint . && npx vite build
node scripts/gen-docs.mjs   # after changing components, props, settings or the registry
```

`scripts/verify` runs typecheck, lint, the docs check, build and a headless smoke test. See [AGENTS.md](AGENTS.md)
for the job queue, review screenshots, deploy and the deliberate oddities.

| Path | What |
| --- | --- |
| `src/components/ui/` | the components, one copy-pasteable file each |
| `src/components/ai/`, `src/components/backgrounds/` | the AI and Backgrounds collections |
| `src/lib/` | `config.ts` (settings → tokens), `color.ts`, `registry.ts` (every item), `kit.ts` (exports), `ad.ts` (`cn()`) |
| `src/styles/` | `theme.css` (Tailwind mapping), `base.css` (corner shape, scrollbar, keyframes); both ship in the theme |
| `src/site/` | the gallery site: landing, Components, AI, Backgrounds, examples, export |
| `api/` | Vercel functions behind `/r/*.json`, `/api/kit`, `/tokens.*` |
| `scripts/` | verify, smoke test, docs generator, review screenshots |
| `docs/components.md` | generated props reference |
