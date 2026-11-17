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
