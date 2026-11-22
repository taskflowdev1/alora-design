# Alora Design

React components in Joshua Dirga's ERP UI taste, shadcn style: you copy the source into your app, already themed with
your settings. Live gallery: **https://design.alorawork.com**

- **Components**: ERP components (inputs, tables, overlays, niche parts like fee rows, shop pickers, command palette).
- **AI**: loaders and chrome for an agent assistant (thinking orbs, run status, composer glow).
- **Backgrounds**: interactive surfaces for agent screens (a sand field that follows the pointer).
- **Examples**: seven ERP pages built only from these components. **Export**: tokens, Tailwind block, agent kit.

The taste rules live in the [erp-ui skill](https://github.com/JoshD94/ai-skills/tree/main/erp-ui).

## Requirements

React 19 and Tailwind CSS v4. Components use `radix-ui` for overlays and form parts, `react-feather` for icons, and
`clsx` + `tailwind-merge` inside `cn()`; the shadcn CLI installs whichever a component needs. Developing this repo
takes Node 24 (`.nvmrc`).

## Install

Pick your settings on the site (the Customize panel on the left edge, or the header button on a phone); every link
and command then carries them. Install one component, its dependencies and the theme in one go:

```sh
npx shadcn@latest add "https://design.alorawork.com/r/button.json?r=14&a=3c6fe0"
```

`/r/<name>.json?<settings>` is a shadcn registry item; it pulls in `/r/theme.json?<settings>` (CSS variables and base
rules) and `/r/ad.json` (the `cn()` helper). The theme alone: `npx shadcn@latest add "https://design.alorawork.com/r/theme.json?<settings>"`.
The full list is at `/r/registry.json`.

### Without the shadcn CLI

Every registry item is plain JSON with the full source in `files[].content`, so you can copy by hand:

1. Paste `https://design.alorawork.com/tailwind.css?<settings>` into your Tailwind v4 CSS (tokens, `@theme` mapping and
   base rules in one block).
2. Copy `src/lib/ad.ts` and `src/lib/ad-hooks.ts` to `lib/` in your app (`cn()`, formatters, date helpers and shared
   hooks), and point the `@/` alias at your source root.
3. Copy the component file to `components/ui/`, plus any files listed in its `registryDependencies`, and install the
   npm packages in its `dependencies`.

Other exports, all taking the same settings:

| What | URL |
| --- | --- |
| Agent kit (markdown for a coding agent: rules, tokens, every component's install URL) | `https://design.alorawork.com/api/kit?<settings>` |
| Tokens as CSS / JSON | `/tokens.css?<settings>`, `/tokens.json?<settings>` |
| Tailwind v4 `@theme` block | `/tailwind.css?<settings>` |
| UI checklist (every rule agents check before review; browse them at `/encyclopedia`) | `/ui-checklist.md` |

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
| Accent | `a` | `#3c6fe0` | any hex, `a=` without `#` | Primary buttons, key actions and focus fills; chart shades derive from it. |
| Greys | `g` | `neutral` | `neutral` (n), `cool` (c), `warm` (w) | Tint of the greys: neutral, cool (blue hint) or warm. |
| Shadow | `sh` | `50%` | 0–100% | Card and menu shadow strength, 0 to 100. |
| Text size | `f` | `13 px` | 12–15 px | Base font size in px. |
| Theme | `t` | `dark` | `light` (l), `dark` (d) | Default theme; the other one is a class away (.light or .dark). |
<!-- settings:end -->

Radii nest: control radius R, nest gap G = round(R/3), card = R + G, item = R − G, sheet = R + padding. Square zeroes
every radius; circles (avatars, dots) always stay round.

### Greys

One ramp of six greys per theme, and every neutral in the library is one of them: page and surface, two fills (`fill`
at rest and for hover on a surface; `fill-strong` for hover on a fill, selected, pressed and the off switch), and two
text greys (`ink-muted` for secondary text and placeholders, `ink`). Role tokens (`track`, `sel`, `raised`, `on`,
`switch-on`…) are names for a step, never a new grey. The greys setting (`g`) tints the whole ramp. The sidebar, save
bar and bottom nav are a dark island in both themes and take the dark ramp exactly (`side-*`), so both themes together
use 12 greys. Shadows and the dialog scrim are
black or ink at an alpha, so they darken what is under them rather than add a grey. The only other neutral is the white
thumb of the switch and slider. `node scripts/greys.mjs --check` (in `scripts/verify`) fails on a raw grey, a palette
grey (`bg-black/5`, `text-white`…), an alpha or `color-mix` on a grey token, or a token that is off the ramp.

<!-- greys:start -->
| Step | Light | Dark |
| --- | --- | --- |
| `page` | `#fafafa` | `#0c0c0c` |
| `surface` | `#ffffff` | `#161616` |
| `fill` | `#f1f1f1` | `#222222` |
| `fill-strong` | `#d9d9d9` | `#444444` |
| `ink-muted` | `#5d5d5d` | `#b1b1b1` |
| `ink` | `#181818` | `#eeeeee` |

| Role token | Light | Dark | Use |
| --- | --- | --- | --- |
| `raised` | surface | page | menus, selects, popovers, hover cards: white in light, the darkest step in dark |
| `track` | fill | fill | segmented and toggle-group track, chips in a field |
| `sel` | surface | fill-strong | the raised pill in a track |
| `on` | ink | ink | ink surfaces: checked boxes, radios, progress, sliders, the today mark |
| `on-ink` | surface | surface | text and marks on ink surfaces |
| `tip` | ink | page | tooltips and chart tooltips: ink in light, the darkest step in dark |
| `tip-ink` | surface | ink | text on tooltips |
| `pop` | surface | page | previews that float over content (citation): white in light, the darkest step in dark |
| `scroll` | fill-strong | fill-strong | scrollbar thumb |
| `switch-on` | ink | ink-muted | switch on: neutral, never the accent (off is fill-strong) |
| `thumb` | white | white | switch and slider thumb |
| `switch-thumb` | white | white | switch thumb |
<!-- greys:end -->

## Components

Every component, its install name and its props (types and notes in [docs/components.md](docs/components.md)).
Generated from the source by `scripts/gen-docs.mjs`; `scripts/verify` fails when this table drifts.

<!-- components:start -->
### Foundations

| Component | Install name | Exports | Props (`=default`) |
| --- | --- | --- | --- |
| [Corner shape](https://design.alorawork.com/components/corner-shape) | in `theme` | — | Set by the theme (see Settings) |
| [Scrollbar](https://design.alorawork.com/components/scrollbar) | in `theme` | — | Set by the theme (see Settings) |

### Showpieces

| Component | Install name | Exports | Props (`=default`) |
| --- | --- | --- | --- |
| [Slide to pay](https://design.alorawork.com/components/slide-to-pay) | `slide-to-pay` | `SlideToPay` | `amount=1250000`, `onConfirm`, `resetAfter=2600`, `disabled` |
| [Balance privacy](https://design.alorawork.com/components/balance-privacy-wave) | `balance-privacy-wave` | `BalancePrivacyWave` | `label="Balance"`, `amount=48240000`, `details=DEFAULT_DETAILS`, `hidden`, `defaultHidden=false`, `onHiddenChange` |
| [Rolling odometer total](https://design.alorawork.com/components/odometer-total) | `odometer-total` | `OdometerTotal` | `label="Sales today"`, `unit="Rp"`, `value`, `defaultValue=48240000`, `fitTo`, `steps=[89000, 1250000, 12500000, -245000]`, `onValueChange` |
| [Target gauge needle](https://design.alorawork.com/components/target-gauge) | `target-gauge` | `TargetGauge` | `label="Today’s target"`, `value`, `defaultValue=31400000`, `target=48000000`, `sales=[1250000, 420000, 2750000, 890000, 3100000]`, `format=formatRp`, `onValueChange` |
| [Ghost period compare](https://design.alorawork.com/components/ghost-compare) | `ghost-compare` | `GhostCompare` | `label="Sales this week"`, `current=[38200000, 41600000, 35900000, 47100000, 52300000, 61800000, 48240000]`, `previous=[34100000, 39800000, 37600000, 41200000, 46900000, 55400000, 44100000]`, `labels=WEEKDAYS_3`, `today=6`, `hint="Hold for last week"`, `unit="Rp"`, `onCompareChange` |
| [Split-flap KPI board](https://design.alorawork.com/components/split-flap-board) | `split-flap-board` | `SplitFlapBoard` | `rows=DEFAULT_ROWS`, `cells=5`, `actionLabel="Next hour"`, `onValuesChange` |
| [Goal rings](https://design.alorawork.com/components/goal-rings) | `goal-rings` | `GoalRings` | `rings=DEFAULT_RINGS`, `actionLabel="Close the day"`, `onRingChange` |
| [Dot matrix number](https://design.alorawork.com/components/dot-matrix-number) | `dot-matrix-number` | `DotMatrixNumber` | `label="Orders today"`, `value`, `defaultValue=1284`, `places=4`, `step=1`, `actionLabel="New order"`, `onValueChange` |
| [Stock battery](https://design.alorawork.com/components/stock-battery) | `stock-battery` | `StockBattery` | `product="Gelas kopi tanah liat"`, `value`, `defaultValue=46`, `capacity=120`, `reorderAt=24`, `cells=10`, `sellStep=6`, `onValueChange`, `onRestock` |
| [Detent rotary knob](https://design.alorawork.com/components/detent-knob) | `detent-knob` | `DetentKnob` | `value`, `defaultValue=20`, `onValueChange`, `min=0`, `max=60`, `step=5`, `format=(v) => `${v}%``, `label="Discount"`, `product="Gelas kopi tanah liat"`, `price=85000` |
| [Hold to confirm](https://design.alorawork.com/components/hold-to-confirm) | `hold-to-confirm` | `HoldToConfirm` | `label="Hold to pay"`, `doneLabel="Paid"`, `detail="Rp 1.250.000"`, `duration=1200`, `resetAfter=2800`, `onConfirm` |
| [Rubber band stepper](https://design.alorawork.com/components/rubber-band-stepper) | `rubber-band-stepper` | `RubberBandStepper` | `value`, `defaultValue=12`, `onValueChange`, `min=0`, `max=999`, `step=1`, `label="Quantity"` |
| [Shift ring clock](https://design.alorawork.com/components/shift-ring-clock) | `shift-ring-clock` | `ShiftRingClock` | `value`, `defaultValue={ start: 22 * 60, end: 6 * 60 }`, `onValueChange`, `step=15`, `minLength=60`, `maxLength=23 * 60` |
| [Morphing status island](https://design.alorawork.com/components/status-island) | `status-island` | `StatusIsland` | `status`, `progress=0`, `onStatusChange`, `idleLabel="Sync 7 shops"`, `syncLabel="Syncing"`, `channels=["Shopee", "Tokopedia", "TikTok Shop", "Rimba Kemang"]`, `progressLabel="248 products"`, `doneLabel="248 products synced"` |
| [Save button morph](https://design.alorawork.com/components/save-morph) | `save-morph` | `SaveMorph` | `label="Save changes"`, `doneLabel="Saved"`, `failLabel="Try again"`, `onSave`, `dirty`, `size="default"` |
| [Dust dissolve delete](https://design.alorawork.com/components/dust-delete) | `dust-delete` | `DustDelete` | `title="Gelas kopi tanah liat"`, `price="Rp 89.000"`, `image`, `deleteLabel="Delete"`, `undoLabel="Undo"`, `tone="surface"`, `onDelete`, `onUndo` |
| [Undo fuse pill](https://design.alorawork.com/components/undo-fuse) | `undo-fuse` | `UndoFuse` | `label="Order INV-20841 archived"`, `undoneLabel="Order restored"`, `actionLabel="Undo"`, `duration=6000`, `paused=false`, `onUndo`, `onExpire`, `onClosed` |
| [Flip countdown](https://design.alorawork.com/components/flip-countdown) | `flip-countdown` | `FlipCountdown` | `seconds=24`, `endsAt`, `loop=false`, `onComplete`, `ref` |
| [SLA burning fuse](https://design.alorawork.com/components/sla-fuse) | `sla-fuse` | `SlaFuse` | `order="INV-20841"`, `item="Gelas kopi tanah liat × 2"`, `total=2700`, `remaining=2340`, `speed=1`, `paused=false`, `actionLabel="Ship order"`, `shippedLabel="Shipped"`, `reopenLabel="Reopen"`, `lateLabel="Late"`, `onShip`, `onReopen`, `onLate` |
| [Peel shipping label](https://design.alorawork.com/components/peel-label) | `peel-label` | `PeelLabel` | `from="Rimba Kemang, Jakarta"`, `to="Sari Wulandari"`, `address="Jl. Kaliurang Km 5 No. 14, Sleman, Yogyakarta 55281"`, `tracking="RK-2041-8836"`, `weight="1,2 kg"`, `onStick` |
| [Before after wipe](https://design.alorawork.com/components/before-after) | `before-after` | `BeforeAfter` | `before`, `after`, `alt`, `beforeFilter`, `beforeLabel="Raw"`, `afterLabel="Edited"`, `defaultValue=0.5`, `onValueChange` |
| [Product hotspots](https://design.alorawork.com/components/product-hotspots) | `product-hotspots` | `ProductHotspots` | `src`, `alt`, `spots`, `ratio=1`, `onOpenChange` |
| [Photo stack shuffle](https://design.alorawork.com/components/photo-stack) | `photo-stack` | `PhotoStack` | `photos`, `onChange` |
| [Scratch voucher](https://design.alorawork.com/components/scratch-voucher) | `scratch-voucher` | `ScratchVoucher` | `shop="Rimba Kemang"`, `validity="Until 31 Dec"`, `offer="25% off"`, `code="RIMBA-7K2Q"`, `label="Scratch here"`, `onReveal` |
| [Foil achievement badge](https://design.alorawork.com/components/foil-badge) | `foil-badge` | `FoilBadge` | `value="Rp 100 jt"`, `label="Sales in November"`, `claimLabel="Claim badge"`, `defaultUnlocked=false`, `onUnlockedChange` |
| [Filter search](https://design.alorawork.com/components/filter-search) | `filter-search` | `FilterSearch` | `fields`, `tokens`, `onTokensChange`, `query`, `onQueryChange`, `placeholder="Search or filter"`, `listHeight=240`, `children`, `className`, `aria-label` |
| [Bulk action bar](https://design.alorawork.com/components/bulk-action-bar) | `bulk-action-bar` | `BulkActionBar` | `count`, `label="selected"`, `actions`, `onClear`, `done`, `onUndo`, `undoFor=6000`, `onExpire`, `className` |
| [Status changer](https://design.alorawork.com/components/status-select) | `status-select` | `StatusSelect` | `options=ORDER_STATUSES`, `value`, `defaultValue`, `onValueChange`, `readOnly`, `disabled`, `aria-label`, `className` |
| [Approval flow](https://design.alorawork.com/components/approval-flow) | `approval-flow` | `ApprovalFlow` | `title="Gelas kopi tanah liat, 200 pcs"`, `code="PO-1042"`, `amount=17800000`, `people=PEOPLE`, `onDecision`, `onApprovedChange`, `className` |
| [Invoice line items](https://design.alorawork.com/components/line-items) | `line-items` | `LineItems` | `defaultItems=[]`, `catalog=[]`, `taxRate=0.11`, `taxLabel="PPN 11%"`, `rows=4`, `onItemsChange`, `className` |
| [Year heatmap](https://design.alorawork.com/components/year-heatmap) | `year-heatmap` | `YearHeatmap` | `days`, `label="Sales this year"`, `unit="Rp"`, `className`, `aria-label` |
| [Margin waterfall](https://design.alorawork.com/components/margin-waterfall) | `margin-waterfall` | `MarginWaterfall` | `periods`, `defaultPeriod`, `revenueLabel="Revenue"`, `profitLabel="Profit"`, `unit="Rp"`, `onPeriodChange`, `className` |

### Actions

| Component | Install name | Exports | Props (`=default`) |
| --- | --- | --- | --- |
| [Button](https://design.alorawork.com/components/button) | `button` | `Button` | `variant`, `size`, `icon`, `asChild` |
| [Menu](https://design.alorawork.com/components/menu) | `menu` | `Menu`, `MenuItem`, `MenuLabel`, `MenuGroup`, `MenuSub` | `trigger`, `children`, `align="start"`, `side="bottom"`, `tone="light"`, `showSafeArea`, `open`, `onOpenChange`, `className`, `icon`, `shortcut`, `onSelect`, `disabled`, `label` |
| [Toolbar](https://design.alorawork.com/components/toolbar) | `toolbar` | `Toolbar`, `ToolbarSpacer`, `PageHeader` | `className`, `children`, `title` |
| [Save bar](https://design.alorawork.com/components/save-bar) | `save-bar` | `SaveBar` | `open`, `onSave`, `onDiscard`, `saving`, `label="Unsaved changes"`, `inline`, `className` |
| [Button group](https://design.alorawork.com/components/button-group) | `button-group` | `ButtonGroup` | none |

### Inputs

| Component | Install name | Exports | Props (`=default`) |
| --- | --- | --- | --- |
| [Input](https://design.alorawork.com/components/input) | `input` | `Input`, `useFieldControl` | `icon`, `end`, `invalid`, `wrapperClassName` |
| [Textarea](https://design.alorawork.com/components/textarea) | `textarea` | `Textarea` | `invalid` |
| [Input group](https://design.alorawork.com/components/input-group) | `input-group` | `InputGroup` | `start`, `end`, `invalid`, `className`, `children` |
| [One-time code](https://design.alorawork.com/components/input-otp) | `input-otp` | `InputOTP` | `value`, `onValueChange`, `length=6`, `group=3`, `onComplete`, `status="idle"`, `celebrate="join"`, `invalid`, `disabled`, `size="default"`, `result`, `placeholder`, `className`, `id`, `ref`, `aria-label`, `aria-describedby` |
| [Label](https://design.alorawork.com/components/label) | `label` | `Label` | `required` |
| [Search](https://design.alorawork.com/components/search) | `search` | `Search` | `value`, `onValueChange`, `invalid`, `wrapperClassName` |
| [Field](https://design.alorawork.com/components/field) | `field` | `Field` | `label`, `error`, `layout="stack"`, `className`, `children`, `htmlFor` |
| [Select](https://design.alorawork.com/components/select) | `select` | `OptionList`, `Select`, `usePressOpen`, `useListNav` | `id`, `options`, `active`, `setActive`, `isSelected`, `onPick`, `multiple`, `empty`, `className`, `value`, `onValueChange`, `placeholder="Select"`, `prefix`, `disabled`, `contentClassName`, `align="start"`, `aria-label`, `renderValue` |
| [Multi-select](https://design.alorawork.com/components/multi-select) | `multi-select` | `MultiSelect` | `value`, `onValueChange`, `options`, `placeholder="Select"`, `maxChips=2`, `inline`, `listHeight=216`, `className`, `aria-label` |
| [Combobox](https://design.alorawork.com/components/combobox) | `combobox` | `Combobox` | `value`, `onValueChange`, `options`, `placeholder="Select"`, `searchPlaceholder="Search"`, `empty="No match"`, `onCreate`, `createLabel=(label) => `Create "${label}"``, `inline`, `listHeight=216`, `className`, `aria-label` |
| [Calendar](https://design.alorawork.com/components/calendar) | `calendar` | `Calendar` | `value`, `onValueChange`, `today=new Date()`, `min`, `autoFocus`, `className` |
| [Date picker](https://design.alorawork.com/components/date-picker) | `date-picker` | `DatePicker` | `value`, `onValueChange`, `placeholder="Pick a date"`, `smart=true`, `today=new Date()`, `className` |
| [Period stepper](https://design.alorawork.com/components/period-stepper) | `period-stepper` | `PeriodStepper` | `value`, `period`, `onValueChange`, `max`, `className` |
| [Language picker](https://design.alorawork.com/components/language-picker) | `language-picker` | `LanguagePicker` | `value`, `onValueChange`, `languages=LANGUAGES`, `className` |
| [Segmented control](https://design.alorawork.com/components/segmented) | `segmented` | `Segmented` | `value`, `onValueChange`, `options`, `size="default"`, `className`, `aria-label` |
| [Sliding pill](https://design.alorawork.com/components/sliding-pill) | `sliding-pill` | `SlidingPill`, `HoldLabel` | `selector`, `className`, `children` |
| [Tabs](https://design.alorawork.com/components/tabs) | `tabs` | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | none |
| [Toggle](https://design.alorawork.com/components/switch) | `switch` | `Switch` | `size="default"` |
| [Toggle button](https://design.alorawork.com/components/toggle) | `toggle` | `Toggle` | `size="default"`, `icon` |
| [Checkbox](https://design.alorawork.com/components/checkbox) | `checkbox` | `Checkbox`, `CheckboxField` | `label` |
| [Radio](https://design.alorawork.com/components/radio) | `radio` | `RadioGroup`, `Radio` | `label` |
| [Slider](https://design.alorawork.com/components/slider) | `slider` | `Slider` | `value`, `onValueChange`, `min`, `max`, `step=1`, `label`, `display`, `className` |
| [Number dial](https://design.alorawork.com/components/number-dial) | `number-dial` | `RollingNumber`, `NumberDial` | `value`, `format=formatNumber`, `blur`, `instant`, `className`, `onValueChange`, `min=0`, `max=100`, `majorEvery=10`, `spacing=9`, `unit`, `onTick`, `aria-label` |
| [Password](https://design.alorawork.com/components/password-input) | `password-input` | `PasswordInput` | `value`, `onValueChange`, `minLength=8`, `suggest=true`, `error`, `submitted`, `wrapperClassName` |
| [Theme switch](https://design.alorawork.com/components/theme-switch) | `theme-switch` | `ThemeSwitch` | `value`, `onValueChange`, `system=true`, `iconOnly`, `within`, `className` |
| [Step form](https://design.alorawork.com/components/step-form) | `step-form` | `StepPanels`, `StepForm` | `step`, `children`, `className`, `steps`, `onStepChange`, `finishLabel="Finish"`, `onFinish` |

### Display

| Component | Install name | Exports | Props (`=default`) |
| --- | --- | --- | --- |
| [Card](https://design.alorawork.com/components/card) | `card` | `Card`, `CardHeader` | `interactive`, `inset="pad"`, `title`, `action`, `className` |
| [Metric card](https://design.alorawork.com/components/metric-card) | `metric-card` | `MetricCard` | `label`, `value`, `unit`, `delta`, `primary`, `interactive`, `variant="tile"`, `short`, `fitTo`, `loading` |
| [Table](https://design.alorawork.com/components/table) | `table` | `Table`, `THead`, `TBody`, `TRow`, `TH`, `TD`, `TableBar` | `children`, `selected`, `onActivate`, `align="left"`, `className`, `width`, `maxWidth`, `page`, `total`, `pageSize=50`, `onPageChange` |
| [Attention list](https://design.alorawork.com/components/attention-list) | `attention-list` | `AttentionList`, `AttentionItem` | `children`, `className`, `media`, `title`, `meta`, `value`, `action`, `onClick` |
| [Bar chart](https://design.alorawork.com/components/bar-chart) | `bar-chart` | `BarChart`, `BarList` | `data`, `height=140`, `current`, `labelEvery=1`, `loading`, `className`, `aria-label`, `selected`, `onSelect` |
| [Status, pill, chip](https://design.alorawork.com/components/status) | `status` | `Status`, `Pill`, `Chip`, `ChipGroup` | `tone="default"`, `children`, `className`, `tone="attention"`, `dot`, `selected`, `onClick`, `onRemove`, `size="default"` |
| [Badge](https://design.alorawork.com/components/badge) | `badge` | `Badge` | `children`, `className` |
| [Avatar](https://design.alorawork.com/components/avatar) | `avatar` | `Avatar` | `name`, `src`, `size="md"`, `className` |
| [Thumb](https://design.alorawork.com/components/thumb) | `thumb` | `Thumb` | `src`, `alt`, `size=32`, `className` |
| [Alert](https://design.alorawork.com/components/alert) | `alert` | `Alert` | `tone="neutral"`, `title`, `children`, `action`, `className` |
| [Progress](https://design.alorawork.com/components/progress) | `progress` | `Progress` | `value`, `max=100`, `className`, `aria-label` |
| [Empty state](https://design.alorawork.com/components/empty-state) | `empty-state` | `EmptyState` | `icon`, `title`, `className` |
| [Skeleton](https://design.alorawork.com/components/skeleton) | `skeleton` | `Skeleton`, `Loading`, `LoadingText` | `onFill`, `loading`, `children`, `className` |
| [Data table](https://design.alorawork.com/components/data-table) | `data-table` | `DataTable` | `rows`, `columns`, `rowKey`, `selected`, `onSelectedChange`, `onRowClick`, `pageSize=50`, `search=true`, `toolbar`, `loading`, `skeletonRows`, `className` |
| [Item](https://design.alorawork.com/components/item) | `item` | `Item`, `ItemList` | `media`, `title`, `description`, `end`, `variant="plain"`, `asChild` |
| [Accordion](https://design.alorawork.com/components/accordion) | `accordion` | `Accordion` | `items`, `type="single"`, `defaultValue`, `cards`, `className` |
| [Collapsible](https://design.alorawork.com/components/collapsible) | `collapsible` | `Collapsible` | `title`, `meta` |
| [Carousel](https://design.alorawork.com/components/carousel) | `carousel` | `Carousel` | `children`, `perView=1`, `gap=12`, `peek=true`, `arrows=true`, `dots=true`, `className`, `aria-label` |
| [Aspect ratio](https://design.alorawork.com/components/aspect-ratio) | `aspect-ratio` | `AspectRatio` | none |
| [Typography](https://design.alorawork.com/components/typography) | `typography` | `H1`, `H2`, `H3`, `H4`, `P`, `Muted`, `Small`, `Num`, `InlineCode`, `List`, `Quote` | none |

### Charts

| Component | Install name | Exports | Props (`=default`) |
| --- | --- | --- | --- |
| [Chart parts](https://design.alorawork.com/components/chart) | `chart` | `ChartTooltip`, `ChartLegend`, `CartesianChart`, `useWidth` | `title`, `rows`, `style`, `className`, `ref`, `items`, `active`, `onActiveChange`, `data`, `series`, `kind="line"`, `height=200`, `curve="smooth"`, `grid=false`, `axis=false`, `dots=false`, `stacked=false`, `fill=0.14`, `labelEvery=0`, `legend=true`, `format=formatShort`, `activeSeries`, `onActiveSeriesChange`, `aria-label` |
| [Line chart](https://design.alorawork.com/components/line-chart) | `line-chart` | `LineChart` | `data`, `legend`, `height`, `className`, `aria-label`, `grid`, `series`, `curve`, `axis`, `dots`, `labelEvery`, `format`, `active`, `onActiveChange`, `activeSeries`, `onActiveSeriesChange` |
| [Area chart](https://design.alorawork.com/components/area-chart) | `area-chart` | `AreaChart` | `data`, `legend`, `height`, `className`, `aria-label`, `fill`, `grid`, `stacked`, `series`, `curve`, `axis`, `dots`, `labelEvery`, `format`, `active`, `onActiveChange`, `activeSeries`, `onActiveSeriesChange` |
| [Pie and donut](https://design.alorawork.com/components/pie-chart) | `pie-chart` | `PieChart` | `data`, `size=168`, `thickness=0.32`, `center`, `legend="side"`, `format=formatShort`, `className`, `aria-label` |
| [Radar chart](https://design.alorawork.com/components/radar-chart) | `radar-chart` | `RadarChart` | `data`, `series`, `size=240`, `rings=4`, `fill=0.14`, `format=formatShort`, `className`, `aria-label` |
| [Radial chart](https://design.alorawork.com/components/radial-chart) | `radial-chart` | `RadialChart` | `data`, `size=168`, `thickness=10`, `gap=6`, `sweep=270`, `center`, `className`, `aria-label` |
| [Linked highlight](https://design.alorawork.com/components/brush) | `brush` | `useBrush` | none |

### Navigation

| Component | Install name | Exports | Props (`=default`) |
| --- | --- | --- | --- |
| [Breadcrumb](https://design.alorawork.com/components/breadcrumb) | `breadcrumb` | `Breadcrumb` | `items`, `max=4`, `className` |
| [Navigation menu](https://design.alorawork.com/components/navigation-menu) | `navigation-menu` | `NavigationMenu` | `items`, `className` |
| [Menubar](https://design.alorawork.com/components/menubar) | `menubar` | `Menubar` | `menus`, `className` |
| [Pagination](https://design.alorawork.com/components/pagination) | `pagination` | `Pagination` | `page`, `pageCount`, `onPageChange`, `total`, `pageSize=50`, `numbers=true`, `className` |

### Overlays

| Component | Install name | Exports | Props (`=default`) |
| --- | --- | --- | --- |
| [Dialog](https://design.alorawork.com/components/dialog) | `dialog` | `Dialog`, `useReturnFocus` | `open`, `onOpenChange`, `trigger`, `title`, `children`, `footer`, `className` |
| [Side pane](https://design.alorawork.com/components/sheet) | `sheet` | `Sheet` | `open`, `onOpenChange`, `title`, `children`, `footer`, `modal=true`, `keepOpenOn`, `className` |
| [Popover](https://design.alorawork.com/components/popover) | `popover` | `PopoverGroup`, `Popover` | `children`, `trigger`, `align="start"`, `side="bottom"`, `open`, `onOpenChange`, `className`, `tone` |
| [Tooltip](https://design.alorawork.com/components/tooltip) | `tooltip` | `TooltipProvider`, `Tooltip` | `children`, `content`, `side="top"`, `open`, `className` |
| [Toast](https://design.alorawork.com/components/toast) | `toast` | `Toaster`, `ToastView` | `className`, `tone="success"`, `children` |
| [Alert dialog](https://design.alorawork.com/components/alert-dialog) | `alert-dialog` | `AlertDialog` | `open`, `onOpenChange`, `trigger`, `title`, `children`, `action`, `onAction`, `cancel="Keep"`, `className` |

### Layout

| Component | Install name | Exports | Props (`=default`) |
| --- | --- | --- | --- |
| [Sidebar](https://design.alorawork.com/components/sidebar) | `sidebar` | `Sidebar`, `SidebarSection`, `SidebarItem` | `className`, `children`, `label`, `icon`, `active`, `count`, `asChild`, `onClick` |
| [Resizable panes](https://design.alorawork.com/components/resizable) | `resizable` | `Resizable` | `children`, `direction="horizontal"`, `defaultSize=50`, `min=20`, `max=80`, `onResize`, `className` |
| [Scroll area](https://design.alorawork.com/components/scroll-area) | `scroll-area` | `ScrollArea` | `orientation="vertical"` |

### Chat

| Component | Install name | Exports | Props (`=default`) |
| --- | --- | --- | --- |
| [Message and bubble](https://design.alorawork.com/components/message) | `message` | `Bubble`, `BubbleGroup`, `Message` | `variant="soft"`, `align="start"`, `reactions`, `from`, `time`, `mine`, `actions`, `children`, `className` |
| [Message scroller](https://design.alorawork.com/components/message-scroller) | `message-scroller` | `MessageScroller` | `children`, `watch`, `className` |
| [Marker](https://design.alorawork.com/components/marker) | `marker` | `Marker` | `icon`, `variant="note"`, `live` |
| [Trace](https://design.alorawork.com/components/trace) | `trace` | `Trace` | `steps`, `live`, `className` |
| [Attachment](https://design.alorawork.com/components/attachment) | `attachment` | `Attachment`, `AttachmentGroup` | `name`, `meta`, `kind="file"`, `src`, `state="done"`, `progress=0`, `onRemove`, `onRetry`, `onOpen`, `size="default"`, `className` |
| [Questionnaire](https://design.alorawork.com/components/questionnaire) | `questionnaire` | `Questionnaire` | `questions`, `onSubmit`, `skippable=true`, `submitLabel="Send answers"`, `className` |
| [Code block](https://design.alorawork.com/components/code-block) | `code-block` | `CodeBlock` | `code`, `title`, `lineNumbers`, `maxHeight=420`, `onCopy`, `className` |
| [Prompt suggestions](https://design.alorawork.com/components/prompt-suggestions) | `prompt-suggestions` | `PromptSuggestions` | `items`, `onPick`, `layout="list"`, `className` |
| [Streaming text](https://design.alorawork.com/components/streaming-text) | `streaming-text` | `StreamingText` | `text`, `streaming`, `reserve=3`, `final`, `cite`, `className` |
| [Citation](https://design.alorawork.com/components/citation) | `citation` | `Citation` | `n`, `source`, `className` |
| [Proposed change](https://design.alorawork.com/components/proposed-change) | `proposed-change` | `ProposedChange` | `title`, `changes`, `state="pending"`, `onApply`, `onDismiss`, `onUndo`, `applyLabel="Apply"`, `size="default"`, `className` |
| [Reactions](https://design.alorawork.com/components/reactions) | `reactions` | `Reactions` | `items`, `onToggle`, `onError`, `className` |

### Niche ERP parts

| Component | Install name | Exports | Props (`=default`) |
| --- | --- | --- | --- |
| [Command palette](https://design.alorawork.com/components/command-palette) | `command-palette` | `CommandPalette`, `useCommandShortcut` | `open=false`, `onOpenChange`, `groups`, `placeholder`, `empty`, `inline`, `className` |
| [Date range picker](https://design.alorawork.com/components/date-range-picker) | `date-range-picker` | `DateRangePicker` | `value`, `onValueChange`, `presets=DEFAULT_PRESETS`, `today=new Date()`, `inline`, `className` |
| [Time picker](https://design.alorawork.com/components/time-picker) | `time-picker` | `TimePicker` | `value`, `onValueChange`, `step=15`, `placeholder="Pick a time"`, `className` |
| [Quantity stepper](https://design.alorawork.com/components/quantity-stepper) | `quantity-stepper` | `QuantityStepper` | `value`, `onValueChange`, `min=0`, `max=Infinity`, `step=1`, `size="default"`, `className`, `aria-label` |
| [Currency input](https://design.alorawork.com/components/currency-input) | `currency-input` | `CurrencyInput` | `value`, `onValueChange`, `currency="Rp"`, `placeholder="0"`, `invalid`, `max=999_999_999_999`, `quick`, `limit`, `className`, `aria-label` |
| [Difference](https://design.alorawork.com/components/diff) | `diff` | `Diff` | `value`, `unit`, `format=(n) => formatNumber(Math.round(n))`, `tolerance=0`, `zero="—"`, `className` |
| [Fee row](https://design.alorawork.com/components/fee-row) | `fee-row` | `FeeRow`, `FeeTotal` | `payer`, `market="shopee"`, `label`, `amount`, `unit="Rp"`, `shipping`, `className` |
| [Marketplace mark](https://design.alorawork.com/components/marketplace-mark) | `marketplace-mark` | `MarketMark` | `market`, `size=16`, `className` |
| [Shop picker](https://design.alorawork.com/components/shop-picker) | `shop-picker` | `ShopPicker` | `shops`, `value`, `onValueChange`, `quick=["shopee", "tiktok"]`, `className` |
| [Split button](https://design.alorawork.com/components/split-button) | `split-button` | `SplitButton` | `children`, `onClick`, `menu`, `variant="primary"`, `disabled`, `className`, `aria-label` |
| [Toggle group](https://design.alorawork.com/components/toggle-group) | `toggle-group` | `ToggleGroup` | `options`, `className`, `aria-label`, `type`, `value`, `onValueChange` |
| [Context menu](https://design.alorawork.com/components/context-menu) | `context-menu` | `ContextMenu`, `ContextMenuItem`, `ContextMenuGroup`, `ContextMenuSub` | `children`, `menu`, `className`, `icon`, `shortcut`, `onSelect`, `disabled`, `label` |
| [Hover card](https://design.alorawork.com/components/hover-card) | `hover-card` | `HoverCard` | `trigger`, `children`, `side="bottom"`, `align="start"`, `className` |
| [Column menu](https://design.alorawork.com/components/column-menu) | `column-menu` | `ColumnMenu` | `columns`, `visible`, `onVisibleChange`, `defaults`, `className` |
| [Inline edit](https://design.alorawork.com/components/inline-edit) | `inline-edit` | `InlineEdit` | `value`, `onSave`, `prefix`, `suffix`, `format`, `parse`, `validate`, `align="left"`, `inputMode`, `className`, `aria-label` |
| [Copy chip](https://design.alorawork.com/components/copy-chip) | `copy-chip` | `CopyChip`, `CopyField` | `value`, `children`, `onCopied`, `className`, `label`, `group=4` |
| [Keyboard shortcut](https://design.alorawork.com/components/kbd) | `kbd` | `Kbd`, `Shortcut` | `children`, `className`, `keys` |
| [Sparkline](https://design.alorawork.com/components/sparkline) | `sparkline` | `Sparkline` | `data`, `kind="line"`, `width=96`, `height=28`, `dot=true`, `className`, `aria-label` |
| [Progress ring](https://design.alorawork.com/components/progress-ring) | `progress-ring` | `ProgressRing` | `value`, `max=100`, `size=48`, `thickness=5`, `label`, `className`, `aria-label` |
| [Step progress](https://design.alorawork.com/components/steps) | `steps` | `Steps` | `steps`, `current`, `size="default"`, `className` |
| [Activity timeline](https://design.alorawork.com/components/timeline) | `timeline` | `Timeline` | `events`, `className` |
| [Comment thread](https://design.alorawork.com/components/comment-thread) | `comment-thread` | `CommentThread` | `comments`, `me`, `onReact`, `onReply`, `className` |
| [File dropzone](https://design.alorawork.com/components/dropzone) | `dropzone` | `Dropzone` | `onFiles`, `accept`, `multiple=true`, `files=[]`, `onRemove`, `onRetry`, `title="Drop files here"`, `className`, `listClassName` |
| [Tag input](https://design.alorawork.com/components/tag-input) | `tag-input` | `TagInput` | `value`, `onValueChange`, `placeholder="Add a tag"`, `suggestions=[]`, `className`, `aria-label` |
| [Avatar group](https://design.alorawork.com/components/avatar-group) | `avatar-group` | `AvatarGroup` | `people`, `max=4`, `size="md"`, `className` |
| [Notification bell](https://design.alorawork.com/components/notification-bell) | `notification-bell` | `NotificationBell` | `notices`, `onMarkAllRead`, `className`, `listHeight`, `unreadFill`, `inline`, `defaultOpen=false`, `panelClassName` |
| [Kanban card](https://design.alorawork.com/components/kanban-card) | `kanban-card` | `KanbanCard`, `KanbanColumn`, `KanbanBoard` | `title`, `id`, `media`, `tags=[]`, `people=[]`, `due`, `attention`, `action`, `onClick`, `className`, `count`, `children`, `columns`, `cards`, `defaultCards=[]`, `onCardsChange`, `onMove`, `moveMenu`, `height=320` |
| [Calendar month](https://design.alorawork.com/components/calendar-month) | `calendar-month` | `CalendarMonth` | `month`, `onMonthChange`, `events`, `today=new Date()`, `max=2`, `onEventClick`, `className` |
| [Holo card](https://design.alorawork.com/components/holo-card) | `holo-card` | `HoloCard` | `holder="RIZKY HARTONO"`, `last4="4410"`, `expiry="08/29"`, `tone="holo"`, `interactive=true` |

### Mobile

| Component | Install name | Exports | Props (`=default`) |
| --- | --- | --- | --- |
| [Tab bar](https://design.alorawork.com/mobile/mobile-tab-bar) | `mobile-tab-bar` | `MobileTabBar`, `MobileTab` | `children`, `iconOnly=false`, `className`, `aria-label`, `icon`, `label`, `active`, `badge`, `onClick` |
| [Large-title nav bar](https://design.alorawork.com/mobile/mobile-nav-bar) | `mobile-nav-bar` | `MobileScreen`, `MobileBarTextButton`, `MobileBarButton` | `title`, `barTitle`, `large=true`, `back`, `leading`, `trailing`, `header`, `bottomInset="tab-bar"`, `children`, `className`, `ref`, `translateTitle=true` |
| [Action bar](https://design.alorawork.com/mobile/mobile-action-bar) | `mobile-action-bar` | `MobileBarScrim`, `MobileActionBar`, `MobileFab`, `useKeyboardInset` | `height`, `className`, `children`, `icon`, `label`, `iconOnly=false`, `above="tab-bar"` |
| [Grouped list](https://design.alorawork.com/mobile/mobile-list) | `mobile-list` | `MobileList`, `MobileListRow` | `title`, `variant="inset"`, `children`, `className`, `media`, `subtitle`, `value`, `chevron`, `onClick`, `trailing`, `toggle` |
| [Swipe actions](https://design.alorawork.com/mobile/mobile-swipe-row) | `mobile-swipe-row` | `SwipeRow` | `children`, `leading=[]`, `trailing=[]`, `className` |
| [Pull to refresh](https://design.alorawork.com/mobile/mobile-pull-refresh) | `mobile-pull-refresh` | `PullToRefresh` | `onRefresh`, `children`, `className` |
| [Skeleton list](https://design.alorawork.com/mobile/mobile-list-skeleton) | `mobile-list-skeleton` | `MobileListSkeleton` | `rows=6`, `media="thumb"`, `subtitle=true`, `value=true`, `chevron=false`, `title=false`, `className` |
| [Empty state](https://design.alorawork.com/mobile/mobile-empty-state) | `mobile-empty-state` | same as `empty-state` | same as `empty-state` |
| [Bottom sheet](https://design.alorawork.com/mobile/mobile-sheet) | `mobile-sheet` | `MobileSheet` | `open`, `onOpenChange`, `trigger`, `title`, `aria-label`, `detents=["fit"]`, `initialDetent=0`, `children`, `footer`, `surface=true`, `className` |
| [Action sheet](https://design.alorawork.com/mobile/mobile-action-sheet) | `mobile-action-sheet` | `MobileActionSheet` | `open`, `onOpenChange`, `title`, `actions`, `cancelLabel="Cancel"`, `className` |
| [Wheel date picker](https://design.alorawork.com/mobile/mobile-date-picker) | `mobile-date-picker` | `WheelColumn`, `WheelPicker`, `MobileDateSheet` | `options`, `value`, `onValueChange`, `aria-label`, `className`, `children`, `open`, `onOpenChange`, `title`, `mode="date"`, `years=[2024, 2028]` |
| [Segmented control](https://design.alorawork.com/mobile/mobile-segmented) | `mobile-segmented` | same as `segmented` | same as `segmented` |
| [Search bar](https://design.alorawork.com/mobile/mobile-search-bar) | `mobile-search-bar` | `MobileSearchBar` | `value`, `onValueChange`, `placeholder="Search"`, `onCancel`, `className` |
| [Stepper](https://design.alorawork.com/mobile/mobile-stepper) | `mobile-stepper` | same as `quantity-stepper` | same as `quantity-stepper` |
| [Snackbar](https://design.alorawork.com/mobile/mobile-snackbar) | `mobile-snackbar` | `MobileSnackbar` | `open`, `onOpenChange`, `message`, `action`, `duration=4000`, `above="tab-bar"`, `className` |
| [Filter chips](https://design.alorawork.com/mobile/mobile-filter-chips) | `mobile-filter-chips` | `MobileFilterChips` | `value`, `onValueChange`, `options`, `aria-label`, `className` |
| [Top tabs](https://design.alorawork.com/mobile/mobile-top-tabs) | `mobile-top-tabs` | `MobileTopTabs`, `MobileTabPager` | `value`, `onValueChange`, `tabs`, `aria-label`, `className`, `pages` |
| [Switch, check and radio rows](https://design.alorawork.com/mobile/mobile-choice-rows) | `mobile-choice-rows` | `MobileSwitchRow`, `CheckMark`, `MobileCheckRow`, `MobileRadioList` | `title`, `subtitle`, `icon`, `checked`, `onCheckedChange`, `disabled`, `className`, `value`, `onValueChange`, `options`, `aria-label` |
| [Avatar rows](https://design.alorawork.com/mobile/mobile-person-row) | `mobile-person-row` | `MobilePersonRow` | `name`, `src`, `subtitle`, `meta`, `unread`, `badge`, `chevron`, `onClick`, `className` |
| [A–Z index](https://design.alorawork.com/mobile/mobile-index-list) | `mobile-index-list` | `MobileIndexedList` | `sections`, `renderItem`, `bottomInset=96`, `className` |
| [Picker sheet](https://design.alorawork.com/mobile/mobile-picker-sheet) | `mobile-picker-sheet` | `MobilePickerSheet`, `MobileMultiSelectSheet` | `open`, `onOpenChange`, `title`, `options`, `value`, `onValueChange`, `className`, `doneLabel=(n) => (n ? `Done · ${n}` : "Done")` |
| [Multi-select sheet](https://design.alorawork.com/mobile/mobile-multi-select) | `mobile-multi-select` | same as `mobile-picker-sheet` | same as `mobile-picker-sheet` |
| [Date range sheet](https://design.alorawork.com/mobile/mobile-date-range) | `mobile-date-range` | `MobileDateRangeSheet` | `open`, `onOpenChange`, `title="Dates"`, `value`, `onValueChange`, `today=new Date()`, `presets=MOBILE_RANGE_PRESETS`, `className` |
| [Long-press menu](https://design.alorawork.com/mobile/mobile-context-menu) | `mobile-context-menu` | `MobileContextMenu` | `children`, `actions`, `open`, `onOpenChange`, `aria-label` |
| [Full-screen modal](https://design.alorawork.com/mobile/mobile-modal) | `mobile-modal` | `MobileModal` | `open`, `onOpenChange`, `title`, `onSave`, `saveLabel="Save"`, `dirty=false`, `discardTitle="Discard your changes?"`, `savePlacement="bottom"`, `children`, `className` |
| [Alert dialog](https://design.alorawork.com/mobile/mobile-alert) | `mobile-alert` | `MobileAlert` | `open`, `onOpenChange`, `title`, `message`, `actions`, `className` |
| [Text field](https://design.alorawork.com/mobile/mobile-text-field) | `mobile-text-field` | `MobileTextField` | `label`, `value`, `onValueChange`, `error`, `prefix`, `clearable=true`, `trailing`, `className` |
| [Amount keypad](https://design.alorawork.com/mobile/mobile-keypad) | `mobile-keypad` | `MobileAmountKeypad`, `MobileAmountSheet` | `value`, `onValueChange`, `label`, `max=999_999_999`, `quick`, `className`, `open`, `onOpenChange`, `title`, `doneLabel="Done"`, `max` |
| [Slider](https://design.alorawork.com/mobile/mobile-slider) | `mobile-slider` | `MobileSlider` | `label`, `value`, `onValueChange`, `min`, `max`, `step=1`, `display`, `format`, `className` |
| [Photo picker](https://design.alorawork.com/mobile/mobile-photo-picker) | `mobile-photo-picker` | `MobilePhotoGrid`, `MobilePhotoSheet`, `MobilePhotoStrip` | `photos`, `selected`, `onSelectedChange`, `max=9`, `onAdd`, `className`, `open`, `onOpenChange`, `onPick`, `title="Photos"`, `max`, `onRemove`, `onAddClick`, `cover=true`, `onRetry` |
| [Barcode scanner](https://design.alorawork.com/mobile/mobile-scanner) | `mobile-scanner` | `MobileScanner` | `onScan`, `camera`, `mockCode=() => "8991234500017"`, `paused`, `className` |
| [Signature pad](https://design.alorawork.com/mobile/mobile-signature) | `mobile-signature` | `MobileSignaturePad` | `onValueChange`, `onChange`, `placeholder="Sign here"`, `className`, `aria-label` |
| [One-time code](https://design.alorawork.com/mobile/mobile-otp) | `mobile-otp` | same as `input-otp` | same as `input-otp` |
| [Stat tiles](https://design.alorawork.com/mobile/mobile-stat-tiles) | `mobile-stat-tiles` | `MobileStatTile`, `MobileStatGrid`, `MobileKpiCard` | `label`, `value`, `onClick`, `loading`, `className`, `children` |
| [KPI carousel](https://design.alorawork.com/mobile/mobile-kpi-carousel) | `mobile-kpi-carousel` | `MobileKpiCarousel` | `children`, `className`, `aria-label` |
| [Scrub charts](https://design.alorawork.com/mobile/mobile-scrub-chart) | `mobile-scrub-chart` | `MobileScrubChart` | `label`, `value`, `data`, `kind="line"`, `height=120`, `current`, `labelEvery=0`, `holdToScrub`, `className` |
| [Order timeline](https://design.alorawork.com/mobile/mobile-timeline) | `mobile-timeline` | `MobileTimeline` | `events`, `className` |
| [Progress steps](https://design.alorawork.com/mobile/mobile-steps) | `mobile-steps` | same as `steps` | same as `steps` |
| [Receipt](https://design.alorawork.com/mobile/mobile-receipt) | `mobile-receipt` | `MobileReceipt` | `shop`, `number`, `time`, `lines`, `discount=0`, `method`, `received`, `cashier`, `className` |
| [Badge counts](https://design.alorawork.com/mobile/mobile-badge) | `mobile-badge` | `CountBadge`, `BadgeAnchor` | `count=0`, `max=99`, `dot`, `tone="ink"`, `className`, `aria-label`, `badge`, `children` |
| [Offline banner](https://design.alorawork.com/mobile/mobile-banner) | `mobile-banner` | `MobileBanner`, `useOnline` | `open`, `icon`, `children`, `action`, `tone="neutral"`, `className` |
| [Upload progress](https://design.alorawork.com/mobile/mobile-upload-row) | `mobile-upload-row` | `MobileUploadRow` | `name`, `size`, `progress`, `state`, `media`, `onCancel`, `onRetry`, `className` |
| [Onboarding pager](https://design.alorawork.com/mobile/mobile-onboarding) | `mobile-onboarding` | `MobileOnboardingPager` | `pages`, `onDone`, `doneLabel="Get started"`, `className` |
| [Chat and composer](https://design.alorawork.com/mobile/mobile-chat) | `mobile-chat` | `MobileChatThread`, `MobileComposer` | `messages`, `typing`, `className`, `value`, `onValueChange`, `onSend`, `onAttach`, `placeholder="Message"`, `suggestions`, `busy` |
| [Install prompt](https://design.alorawork.com/mobile/mobile-install-prompt) | `mobile-install-prompt` | `MobileInstallSheet`, `useInstallPrompt` | `open`, `onOpenChange`, `name`, `icon`, `platform`, `onInstall`, `onOpenApp` |
| [Passkey sign-in](https://design.alorawork.com/mobile/mobile-passkey) | `mobile-passkey` | `MobilePasskeySheet` | `open`, `onOpenChange`, `name`, `avatar`, `onAuthenticate`, `onDone`, `onUseCode` |
| [Notification ask](https://design.alorawork.com/mobile/mobile-push-ask) | `mobile-push-ask` | `MobilePushAsk`, `usePushPermission` | `status`, `title="Get new orders on this phone"`, `onAllow`, `onLater`, `onFix`, `className` |
| [App header](https://design.alorawork.com/mobile/mobile-app-header) | `mobile-app-header` | `MobileAppHeader` | `title`, `onPick`, `back`, `standalone`, `trailing`, `className` |
| [App badge](https://design.alorawork.com/mobile/mobile-app-badge) | `mobile-app-badge` | `MobileAppIcon`, `useAppBadge` | `children`, `label`, `count=0`, `size=60`, `className` |
| [Offline queue](https://design.alorawork.com/mobile/mobile-sync-status) | `mobile-sync-status` | `MobileSyncPill`, `MobileSyncSheet`, `useSyncQueue` | `online`, `items`, `onClick`, `className`, `open`, `onOpenChange`, `onRetry` |
| [Update toast](https://design.alorawork.com/mobile/mobile-update-toast) | `mobile-update-toast` | `MobileUpdateToast`, `useAppUpdate` | `open`, `onReload`, `onLater`, `busy=false`, `message="New version ready"`, `above="tab-bar"`, `className` |
| [Swipe-back stack](https://design.alorawork.com/mobile/mobile-page-stack) | `mobile-page-stack` | `MobilePageStack` | `pages`, `onBack`, `className` |
| [Share sheet](https://design.alorawork.com/mobile/mobile-share) | `mobile-share` | `MobileShareSheet` | `open`, `onOpenChange`, `data` |
| [Camera scan](https://design.alorawork.com/mobile/mobile-camera) | `mobile-camera` | `useCameraScan` | none |
| [Keep screen on](https://design.alorawork.com/mobile/mobile-wake-lock) | `mobile-wake-lock` | `MobileWakeLockRow`, `useWakeLock` | `checked`, `onCheckedChange`, `title="Keep screen on"` |
| [State button](https://design.alorawork.com/mobile/mobile-state-button) | `mobile-state-button` | `MobileStateButton` | `state="idle"`, `children`, `busyLabel`, `doneLabel`, `variant` |

### AI

| Component | Install name | Exports | Props (`=default`) |
| --- | --- | --- | --- |
| [Thinking orbs](https://design.alorawork.com/ai/thinking-orbs) | `thinking-orbs` | `ThinkingOrbs` | `active=true`, `size=22`, `count=3`, `speed=1`, `orb=0.154`, `ring=0.32`, `tone="ink"`, `className` |
| [Run status](https://design.alorawork.com/ai/run-status) | `run-status` | `RunStatus` | `text`, `active=true`, `size=22`, `shimmer=2.2`, `speed=1`, `tone="ink"`, `className` |
| [Composer glow](https://design.alorawork.com/ai/composer-glow) | `composer-glow` | `Composer`, `ComposerGlow` | `placeholder="Ask anything"`, `working=false`, `value`, `onValueChange`, `onSend`, `onStop`, `onAttach`, `canSendEmpty=false`, `maxLines=6`, `disabled`, `className`, `children`, `breathe=true`, `halo=20`, `strength=0.52`, `pulse=3.6`, `ring=0.48`, `radius=COMPOSER_RADIUS` |
| [Chat list](https://design.alorawork.com/ai/chat-list) | `chat-list` | `ChatList` | `chats`, `selectedId`, `onSelect`, `onNewChat`, `onPin`, `onRename`, `onArchive`, `onRestore`, `onDelete`, `archived`, `onExitArchived`, `collapsed`, `onCollapsedChange`, `footer`, `className` |
| [New chat screen](https://design.alorawork.com/ai/empty-chat) | `empty-chat` | `EmptyChat` | `title="Where should we start?"`, `suggestions=[]`, `onPick`, `children`, `className` |
| [Assistant reply](https://design.alorawork.com/ai/assistant-markdown) | `assistant-markdown` | `AssistantMarkdown` | `text`, `reveal`, `citeTitle`, `onCite`, `className` |
| [Message sources](https://design.alorawork.com/ai/message-sources) | `message-sources` | `MessageSources` | `sources`, `openId`, `onOpenChange`, `className` |
| [Proposal card](https://design.alorawork.com/ai/proposal-card) | `proposal-card` | `ProposalCard` | `title`, `changes`, `status`, `onApprove`, `onDecline`, `disabled`, `className` |
| [Report row](https://design.alorawork.com/ai/report-row) | `report-row` | `ReportRow` | `name`, `meta`, `making=false`, `onPreview`, `onDownload`, `className` |
| [Turn rail](https://design.alorawork.com/ai/turn-rail) | `turn-rail` | `TurnRail` | `turns`, `scrollRef`, `onJump`, `className` |

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

`npm run verify` runs typecheck, lint, unit checks, the docs check, the grey check, build and a headless smoke test.
How to add a component and what every UI change is checked against: [CONTRIBUTING.md](CONTRIBUTING.md). Layout,
deliberate oddities and landmines, for people and coding agents: [AGENTS.md](AGENTS.md).

| Path | What |
| --- | --- |
| `src/components/ui/` | the components, one copy-pasteable file each |
| `src/components/ai/`, `src/components/backgrounds/` | the AI and Backgrounds collections |
| `src/lib/` | `config.ts` (settings → tokens), `color.ts`, `registry.ts` (every item), `kit.ts` (exports), `encyclopedia.ts` (UI rules), `ad.ts` (`cn()`, formatters, dates) and `ad-hooks.ts` (shared hooks), which ship with every component |
| `src/styles/` | `theme.css` (Tailwind mapping), `base.css` (corner shape, scrollbar, keyframes); both ship in the theme |
| `src/site/` | the gallery site: landing, Components, AI, Backgrounds, examples, encyclopedia, export |
| `api/` | Vercel functions behind `/r/*.json`, `/api/kit`, `/tokens.*`, `/ui-checklist.md` |
| `scripts/` | verify, unit checks, smoke test, docs generator, grey check, screenshots and before/after review sheets |
| `docs/components.md` | generated props reference |
| `docs/ui-checklist.md` | generated UI checklist (from `src/lib/encyclopedia.ts`) |

## License

MIT, see [LICENSE](LICENSE).
