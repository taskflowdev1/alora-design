# Alora Design v3: landing bento (16 Nov 2026)
Shots: `output/review-v3/` (gitignored; `./scripts/landing-shots`), `index.md` there is the review page, `checks.json` the automatic checks.

## What changed after Joshua's v2 review
1. The labelled component tile grid and "The niche ones" are gone. Under the plain hero there is one bento of 19 real-looking ERP cards (B1–B19) in a 12-column grid of bands: cards in a band share a height, a stack of two cards fills a column. Tablet: two columns. Phone: one column, no horizontal page scroll (checked: scrollWidth 390 = width 390).
2. Every component sits in the cards in use, interactive, with no per-component labels; card titles only where an app would have one ("Orders", "Notes", "Team", an order number). The command palette is shown open (new `inline` prop); a toast is shown in place in the phone card (new `ToastView`). Filter changes (orders, sales range, by-shop range and channels) swap content for its skeleton; `?loading=1` holds them.
3. "Corners that agree" is removed with its concentric stack. Corner shape, smoothing and radius stay in the gallery, the Customize panel and the export.
4. Dark mode: the example sidebar (and the save bar, bottom nav) is at card level, a step lighter than the page, so it still contrasts (it was darker than the page).
5. Gallery thumbnails render full size when the demo fits and step down only to 60%; trigger-only demos (menu, context menu, split button, popover, tooltip, dialog, side pane, toast, command palette, hover card, notification bell) show their open state; badge, avatar, thumb and marketplace mark show in a small list instead of alone in an empty tile.

## Where each component is (B = bento card)
- B1 Orders: card, toolbar, search, shop picker (marketplace marks), period stepper (tooltip), popover (filter with checkboxes), column menu, chips, table + bottom bar, status dots, difference, hover card (customer), context menu (right click a row), menu (… with submenu), split button, side pane (click a row: steps, copy chip, fee rows, timeline), empty state when nothing matches.
- B2 Sales: metric card (hero, primary: big number, delta pill), segmented Today/Week/Month, sparkline, bar chart, skeleton on switch.
- B3 Command palette, open, with keyboard shortcuts (kbd).
- B4 Sidebar (dark) with workspace menu, counts, account menu, notification bell.
- B5 Packing board: kanban columns and cards (thumb, tag, avatar group, due).
- B6 Fees on an order: fee rows with who pays, total, attention pill, dialog (Dispute: field, select, textarea).
- B7 Calendar month with events. B8 Notes: comment thread with emoji reactions. B9 Shipment: steps, timeline, copy chip.
- B10 Shop settings: toggles, select, time picker, currency input, quantity stepper, language picker, save bar.
- B11 New promotion: field, input, combobox, multi-select, date picker, slider, radio, buttons.
- B12 Team: avatar group, avatars, role selects, invite input. B13 Returns: empty state.
- B14 Products: tabs, checkbox (select all, indeterminate), thumb, inline edit (price, stock).
- B15 Low stock: attention list, badge. B16 Phone view: bottom nav, toast. B17 Stock sync: alert, progress rings, progress, tooltip.
- B18 Photos: dropzone (with upload progress), tag input. B19 By shop: date range picker, toggle group, sparklines, skeleton on change.

## Not shown on the landing, and why
- Corner shape and Scrollbar are foundations, not components: every card follows the corner setting, and the orders table, kanban and palette use the one scrollbar. Their controls live in the gallery and the Customize panel (the corner demo was removed on Joshua's request).
- Every other component (67 of 67) appears at least once.

## Checks (`output/review-v3/checks.json`)
- Borders and outlines on the landing: 0. Page errors: 0. Hover shifts (60 controls and rows, scroll undone): 0.
- Phone: no horizontal page scroll in dark or light. The orders table and kanban scroll inside their cards on phone; the calendar shrinks to the width.

## Bent, and why
- The settings card opens with its save bar showing (an edit in progress) so the save bar is seen; Save or Discard hides it, any change brings it back.
- The phone card is a card with the bottom nav floating in it, not a device frame (no mockups).

# Alora Design v2: self-audit (16 Nov 2026)
Shots: `output/review-v2/` (gitignored). `index.md` is the review page (letters, before/after pairs for the spacing fixes); `shots.md` lists every file; `checks.json` holds the automatic checks. v1 shots stay in `output/review/`.

## What changed after Joshua's v1 review
1. Defaults: dark, neutral greys, pink accent `#dc467d` (OKLCH 0.62 0.19 2; shades from the OKLCH ramp). Dark is neutral near-black: page `#0c0c0c`, cards `#161616`, fills `#222`; shadows are black. Cool and warm keep only a hint of tint in dark. Light stays one click away (`t=l`). URL defaults, `/api/kit`, `/tokens.*`, `/tailwind.css` and `/r/*.json` all default to dark (default theme on `:root`, the other on `.light`).
2. Landing: plain hero (headline + Explore gallery), then the component grid itself (live, scaled tiles that open their pages), then "The niche ones" (28 live, usable tiles), then the concentric demo with corner shape, smoothing and radius, then the footer with Explore gallery. The halo around the demo is gone. One sticky site header for every page: same box on landing, gallery, examples, export (checked by script). Ctrl/Cmd+K search in the header.
3. Metric numbers: three treatments for short (1–2 digit) and long values. A "Tile" (default, used in the examples): a short value sits big in a soft square tile beside its label; long values keep one line with a small muted "Rp". B "Scale": a short value fills the card height; long values mute trailing ".000" groups. C "Compact": a short value is a round count beside the label; long values shorten to "Rp 48,2 jt" with the exact value on hover. All metric cards share one height.
4. Spacing: attention rows have equal left and right insets; one bubble padding scale (`--ad-bubble-x` 12 px, `--ad-bubble-x-sm` 8 px) for chips, pills, segments, tabs, multi-select chips, copy chips, reactions; the "Paid / Cancelled" statuses beside an attention pill now use the same pill box; triggers size to their value (no stretched "Today"); one-line alerts centre icon, text and action, multi-line alerts keep the icon and action on the first line.
5. Examples: Dashboard, Orders, Products, Promotions, Cancellations, Team, Settings are all real pages (sidebar and phone "More" menu). No toast saying a page isn't part of the example.
6. 28 niche components, each with a gallery page, controls (component props + corner shape, smoothing, radius, padding, height, accent, shadow), usage code and a shadcn registry item: command palette, date range picker, time picker, quantity stepper, currency input, difference, fee row, marketplace mark, shop picker, split button, toggle group, context menu, hover card, column menu, inline edit, copy chip, keyboard shortcut, sparkline, progress ring, step progress, activity timeline, comment thread (emoji reactions), file dropzone, tag input, avatar group, notification bell, kanban card, calendar month.
7. G1 compares the three corner shapes at the same visual size: the squircle gets the same compensation the components use (36 px round = 54 px squircle at smoothing 2).

## Never list
1. AI-slop captions: pass. Hero is a headline and one button. Section titles only ("Components", "The niche ones", "Corners that agree.").
2. Number + title + caption triple: pass.
3. Dividing lines: pass. 0 visible borders, outlines or `<hr>` across every page, component and state (script). No rail line in the timeline, no grid lines in the calendar, no line between split-button halves, no dashed dropzone border, no step connectors.
4. Sharp shapes: pass by default. Square only as the opt-in corner setting.
5. Glued to the edge: pass. Sidebar, panes, bottom nav, save bar float.
6. One typeface: pass (system stack; code blocks mono).
7. Random colour: pass. Greys + pink and its shades. Accent on primary actions, the one attention pill, chart shades. Green/red only for real differences (Diff, fee direction). Marketplace marks keep their own colours.
8. Text acting as a button: pass.
9. Inconsistent buttons: pass.
10. Square avatars: pass (avatar group, comments, team).
11. Clutter: pass. Kanban cards cap tags at two; notification count is neutral.
12. Logo / language picker: pass.
13. Device mockups: none.

## Rules checked by script (`checks.json`)
- Borders: 0. Fonts: one family. Header box identical on 6 pages.
- Hover shifts: only the gallery tiles' intended hover lift on the landing (cards lift slightly, as taste asks).
- Skeleton vs loaded: dashboard 25/25 and orders 52/52 boxes, 0 differences.

## Unmet or bent, and why
- Marketplace marks are simplified drawings, not official logos (licensing); products should swap in real assets.
- Attention tone uses the accent's soft shade, so with pink it sits close to the danger alert; the dashboard sync alert uses the neutral tone.
- Phone tables still scroll sideways; fine for a gallery.
- Full-page review shots set the sticky header static so it isn't stitched mid-page; in the browser it stays on top.
- Focus is a soft fill only; keyboard users get no ring (his rule).

## Placeholders (all invented)
- Brand "Rimba", shops Kemang, Senopati, Dago, Darmo, Rimba Official / Outlet (Shopee), Rimba Live (TikTok), Rimba Tokopedia.
- Products, prices, 1.240 orders, 38 cancellations with reasons and fee differences, 6 promotions, team of 5 with activity, comments, notifications, calendar events. "Now" pinned to 16 Nov 2026, 14:20.

## v3.2 (hero, Sales card, customize flap), 2026-11-16
- Lines/borders: none added. Panel groups are soft cards; radii concentric (groups = sheet, panel = sheet + 2 nest gaps, 0 in Square).
- One font; accent only on the Sales delta pill when up and the chart's current bar. Down delta is grey.
- No captions: panel has a title, group titles and labelled controls only.
- Layout shift: Sales card 292 px for today/week/month and loading (checks.json). Flap push measured flush: panel right = page left = 344, page right = 1440, no horizontal scroll (landing, gallery, examples).
- Behaviour: hover opens, slider drag outside keeps it open, leave closes after 260 ms, keyboard focus opens, Esc and X close, tap pins.
- Not checked on real devices: iPad touch and Safari/Firefox corner-shape fallback for the panel.
