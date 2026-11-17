# Alora Design v1: self-audit (16 Nov 2026)
Shots: `output/review/` (gitignored), `index.md` maps letters (L landing, G0 index, G1–G41 components, E1–E3 examples, X1 export, S1–S22 states). `checks.json` holds the automatic checks.

## Never list
1. AI-slop captions: pass. No eyebrows, subtitles, meta lines, button micro-copy or corner text. Under titles only controls.
2. Number + title + caption triple: pass. None anywhere.
3. Dividing lines: pass. Automatic scan of every page and state: 0 visible borders, outlines or `<hr>`. Rows, lists and settings use spacing, soft fills and soft cards.
4. Sharp shapes: pass by default (squircle, 12 px controls, 16 px cards, concentric nests). "Square" exists only as an opt-in corner-shape setting he asked for.
5. Glued to the edge: pass. Sidebar, side pane, save bar, bottom nav and toasts float with margin and full rounding.
6. One typeface: pass for UI (system stack; Noto Sans on Yoga, plain "1"). Exception: code blocks in the gallery/export use monospace.
7. Random colour: pass. Greys + one accent and its OKLCH shades. Accent only on primary buttons (Add, Save, Pack). Charts use accent shades; active nav and numbers stay neutral. Cancelled is a grey dot. Muted red only for the payout-failed alert/validation; flags keep their real colours.
8. Text acting as a button: pass. Every action is a styled button or a whole-row target with hover fill.
9. Inconsistent buttons: pass. One height (36) and one radius per view; icons on all siblings or none.
10. Square avatars: pass. People are circles (`corner-shape: round` forced); products are rounded squares.
11. Clutter: pass. Counts are plain grey badges; no tag clouds or nested badges.
12. Logo / language picker: pass. Text wordmark "Alora Design"; picker is a round flag + EN/ID/CN in trigger and list.
13. Device mockups: none.

## Rules checked by script
- Hover/focus layout shift: 0 real shifts on landing, settings and 6 component pages (swatch/slider hover scale removed).
- Skeleton vs loaded: orders 52/52 boxes, 0 differences; dashboard 24/24, 0 differences (charts and lists pulse in place, `?loading=1`, S14 and S15).
- Corner shape: `corner-shape` works in Chromium 139+ (shots use it). Safari and Firefox lack it today; they fall back to plain `border-radius` at the nominal radius, which looks like the compensated squircle (squircle radii are scaled ×1.5 at smoothing 2 because the curve hugs the corner). G1 shows Square / Round / Squircle side by side at one radius; corner shape is in every gallery controls panel, the Customize panel, the hero, the URL (`c`, `k`) and every export.

## Unmet or bent, and why
- Product pictures: every product slot shows a neutral image placeholder (Thumb). No real product photos yet.
- Phone tables are the desktop table with horizontal scroll, not a summary view; fine for a gallery, not tuned per app.
- Toast position: bottom right, lifted above save bars and moved left of an open side pane (S10, S11), rather than a fixed corner.
- Safe triangle (S6) is drawn only because the demo toggles `showSafeArea`; it is invisible in real use.
- Focus is a soft fill only, as he asked; keyboard users get no ring.

## Placeholders (all invented)
- Brand "Rimba" / "PT Rimba Rumah Nusantara", shops Kemang, Senopati, Dago, Darmo, Shopee, TikTok Shop.
- 10 products, SKUs RMB-xx-0xx, prices, stock; 1.240 seeded orders (RMB-24817 down), customers like "Rina S.", couriers, fees at 4,5%.
- Team Rizky Hartono, Dewi Anggraini, Bayu Saputra, Intan Permata (emails at rimba.example). "Now" pinned to 16 Nov 2026, 14:20.
- Metric values, hourly and 30-day sales, by-shop totals, alert texts, every toast message.
