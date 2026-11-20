# Alora Design

Open-source (public, MIT) shadcn-like React component library in Joshua's ERP UI taste, plus the gallery site at
https://design.alorawork.com. Users: Joshua (critiques every component), Alora builders and agents who install components
into client apps. Taste source: the erp-ui skill (`~/.claude-personal/skills/erp-ui/taste.md`, `joshua-feedback.md`;
public copy https://github.com/JoshD94/ai-skills/tree/main/erp-ui). His words win over anything here.

## UI checklist (required for every UI change)

- Run every UI change through `docs/ui-checklist.md` before review: every **must** holds, every **should** holds or the
  PR says why not. A rule's *Exempt:* names the parts it doesn't apply to. Cite rules by id; old ids still resolve.
- Rules live in `src/lib/encyclopedia.ts` (site `/encyclopedia`, agents `/ui-checklist.md`; the counts are in the
  checklist header). Edit them there, then `node scripts/gen-docs.mjs`. `context` says where house rules differ from
  outside advice. Merged or renamed ids go in `ALIASES`, dropped ones in `DROPPED`, never just deleted.

## Layout

- `src/lib/`: `config.ts` (the one config object, URL (de)serialization, every `--ad-*` variable, `GREY_ROLES`),
  `color.ts` (OKLCH, accent ramp), `registry.ts` (every item, section, page path), `kit.ts` (agent kit, shadcn registry
  items, Tailwind block), `ad.ts` (`cn()` that knows our token names, date/money formatters), `encyclopedia.ts`.
- `src/styles/`: `theme.css` (Tailwind v4 `@theme inline`: `bg-fill`, `rounded-card`, `h-control`…), `base.css`
  (corner-shape, scrollbar, no focus rings, keyframes). Both ship in exports. There is no `tokens.css` file; the
  `/tokens.css` endpoint is generated from `config.ts`.
- `src/components/ui/*.tsx`: one copy-pasteable file per component (core, shadcn-parity, "Niche" ERP parts).
  `src/components/mobile/*.tsx`: the phone set (registry section `mobile`, pages `/mobile/<name>`); they import each other
  relatively and the kit rewrites `../mobile/` to `./`. Shared parts take `size="touch"` instead of a copy.
  `src/components/ai/` and `src/components/backgrounds/`: ported read-only from alora-board's assistant.
- `src/site/`: landing (`landing.tsx`, `bento.tsx`, `showcase-more.tsx`), Components (`gallery.tsx`, `showcase.tsx`,
  `mark.tsx`, `demos*.tsx`), AI/Backgrounds (`collections.tsx`, `agent.tsx`), examples (`examples.tsx`), mobile
  (`mobile-overview.tsx`, `phone.tsx`, `mobile-app*.tsx`, `mobile-screens-*.tsx`, `mobile-data.ts`), `encyclopedia.tsx`
  (+ lazy `encyclopedia-demos.tsx`), `export.tsx`, `layout.tsx` (header, footer, Customize flap).
- `api/`: Vercel functions (`kit.ts`, `checklist.ts`, `r.ts`, `tokens.ts`) that import `src/lib/*` and read component
  sources from disk (`includeFiles` in `vercel.json`).
- `scripts/`: `verify`, `smoke.mjs`, `gen-docs.mjs` (README tables, `docs/components.md`, `docs/ui-checklist.md`),
  `greys.mjs`, `shots`, `review-*-shots` (one per review round), `check-endpoints`, `env.sh`.

## Run, test, verify

- `npm ci`, then `npm run dev` (port 5190). Node 24 via nvm.
- Inline: `npx tsc -p tsconfig.json --noEmit`, `npx eslint .`, `node scripts/gen-docs.mjs --check`, `npx vite build`
  (~2 s). After changing a component's props, the settings, the registry or a rule: `node scripts/gen-docs.mjs`.
- Full verify (typecheck, lint, docs drift, greys, build, headless Playwright smoke on 5196) goes through the queue.
  Mac lent: `job submit --kind script --name alora-design-verify --ram 2 --minutes 8 --needs mac --sync --owner <thread>
  --cwd "$PWD" --cmd ./scripts/verify`; otherwise `--needs yoga` without `--sync`. Scripts source `scripts/env.sh`
  (nvm, `npm ci` when deps are missing, Playwright headless shell; caches under `$HOME`). Wrappers carry
  `# jobq: portable` because the queue misreads "Promotions" (an example page) as a production word.
- Shots: `./scripts/shots` (per component + taste checks: borders, fonts, hover shifts, skeletons) into `output/`;
  each `review-*-shots` writes lettered before/after PNGs for one round (`ONLY=` letters, `BEFORE=` url); `index.md`
  in those folders is written by hand. Build into `$TMPDIR`, never `dist/`.
- Playwright: `playwright-core` 1.65 with `chromium_headless_shell-1254`. Endpoints: `./scripts/check-endpoints [url]`.

## Accounts and deploy

- Alora only: `~/.local/bin/alora git|gh|vercel`. GitHub `taskflowdev1/alora-design` (public). Vercel project
  `alora-design`, scope `taskflowdevs-projects`, Git-connected: push to `main` deploys. Domain `design.alorawork.com`
  (Cloudflare wildcard DNS; never touch DNS). Push-to-live is measured from `<meta name="build">`; target 60 s.

## Deliberate oddities

- Defaults: dark theme, neutral greys, blue accent `#3c6fe0`. Exports put the default theme on `:root` and the other
  on a class. Config lives in the URL query (`r c k p h a g sh f t`); `SLink`/`useHref` keep it on every link.
- Spacing: Tailwind steps are rem on a 13 px body root (`gap-2` = 6.5 px): the approved density. Use the tokens
  (`p-pad`, `gap-gap` between controls in both axes, `px-bubble`); never override `--spacing`. Icons are 16 px and
  desktop hit areas at least 24 px (transparent `::after`), set in px; touch targets 44 px.
- Radii: control R; nest gap G = round(R/3); card = R + G; item = R − G; sheet = R + padding. Concentric only for close
  insets. Square mode zeroes every radius; circles stay round.
- Greys: one ramp of six per theme; role tokens map to a step (`GREY_ROLES`). Never add a grey, an alpha on a grey
  token, `color-mix` on one, a palette grey or a raw hex; `scripts/greys.mjs --check` enforces it (`grey-ok` exempts a
  line). In dark, menus, selects, popovers, hover cards, tooltips and toasts take the page grey (darker than the page
  around them) and separate by shadow. The sidebar, save bar and bottom nav use `--ad-side`, dark in both themes.
- Selected states: in a track a raised `bg-sel shadow-sel` pill; on a plain surface the `fill-strong` pill. One-of-N
  pickers slide one `SlidingPill`; a one-of-N picker is a Segmented, never a ButtonGroup with a painted button.
  Switch is neutral, never the accent.
- Focus: no rings; keyboard focus is a fill (`fill`, or `fill-strong` on a fill; an already-filled selected item darkens
  a notch), on every focusable part.
- Phone: a floating button for the create action on list screens, a pinned action bar on forms and details.
  `PhoneFrame` (390 × 844) is the containing block for fixed bars and the portal target for sheets.
- Routes: `/components` (`/gallery` redirects) and `/mobile` (same `GalleryIndex`, Desktop | Mobile switch; plus
  `/mobile/screens`, `/mobile/app/<screen>`), `/ai`, `/backgrounds`, `/examples/*`, `/encyclopedia`, `/export`. The
  sticky header is one box on every page; below lg its tabs scroll sideways in a second row. Ctrl/Cmd+K opens the palette.
- Pills, chips, segments and tabs share one padding scale: `px-bubble` / `px-bubble-sm`. Metric cards are all one
  height; Tile (default), Hero for the one main number, Scale for a few short counts.
- Gallery per-component overrides go on `<body>` (portalled menus live there); `#root` keeps the global tokens.
- /components is a bento: every component appears exactly once in a `Mark` (smoke checks it against the registry); a new
  component needs a place in a tile. `showcase: false` keeps an item off the bento. AI/Backgrounds item = one file + one
  registry entry; keyframes live in the file; each pauses off screen and honours reduced motion.
- Menu is custom (not Radix DropdownMenu) for a debounced safe triangle (`menu.tsx`). Toasts read `data-toast-avoid`.
- Scrollbars: nothing sits under one; page widths come from `clientWidth` / `100cqw`, never `innerWidth` / `100vw`.
- Customize is the left flap in `layout.tsx` (md and up): it pushes the page with a FLIP transform, overlays when narrow.
- shadcn install: every component depends on `/r/theme.json?<settings>` and `/r/ad.json`.

## Landmines

- No borders, outlines, rings or dividing lines (shots.mjs flags them); exemptions are listed on `layout.no-lines`.
- No eyebrows, subtitles under titles or captions under buttons. Accent only on primary/key actions and chart shades.
  One typeface; mono only in code blocks.
- Skeletons only for real fetches, matching the loaded layout exactly; filtering loaded rows swaps at once.
- Changing a token name means updating `theme.css`, `config.ts`, `ad.ts` (twMerge names) and the kit.
- Yoga is RAM-tight: one preview server per job, close browsers, no blanket Docker cleanup.
- Example pages are `grid grid-cols-1`: a plain `grid` lets a wide table stretch the page on phone.
- Marketplace marks are simplified drawings, not the official logos.
