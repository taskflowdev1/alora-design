# Alora Design

Open-source (MIT) shadcn-like React component library for dense ERP and admin apps, plus the gallery site at
https://design.alorawork.com. Users: developers and coding agents who install components into their apps. The taste
is Joshua Dirga's, who reviews every component; its source is the erp-ui skill
(https://github.com/JoshD94/ai-skills/tree/main/erp-ui), and it wins over anything here. Contributor guide:
`CONTRIBUTING.md`. Maintainer ops (accounts, deploy, the job runner) live in `AGENTS.local.md` when it exists (not
tracked); read it before deploying or running heavy jobs.

## UI checklist (required for every UI change)

- Run every UI change through `docs/ui-checklist.md` before review: every **must** holds, every **should** holds or the
  PR says why not. A rule's *Exempt:* names the parts it doesn't apply to. Cite rules by id; old ids still resolve.
- Rules live in `src/lib/encyclopedia.ts` (site `/encyclopedia`, agents `/ui-checklist.md`; the counts are in the
  checklist header). Edit them there, then `node scripts/gen-docs.mjs`. `context` says where house rules differ from
  outside advice. Merged or renamed ids go in `ALIASES`, dropped ones in `DROPPED`, never just deleted.

## Quick map
Update this map in the same PR when you add, move or remove a top-level area, entrypoint, or check command.

| Change | Where | Narrowest check |
|---|---|---|
| A component | `src/components/ui/<name>.tsx`, registry entry in `src/lib/registry.ts` | `npm run unit`, then `npm run docs` |
| Phone set, Mobile tab | `src/components/mobile/`, `src/site/mobile-*.tsx` (tab: `mobile-page.tsx`, PWA scenes: `mobile-pwa.tsx`), `src/site/phone.tsx` | `npm run unit` |
| AI, backgrounds | `src/components/ai/`, `src/components/backgrounds/`, `src/site/collections.tsx`, the assistant in `src/site/agent*.tsx` | `npm run typecheck` |
| Tokens, theme | `src/lib/config.ts`, `src/styles/theme.css`, `src/lib/ad.ts`, kit in `src/lib/kit.ts` | `npm run greys`, `npm run unit` |
| Shared helpers | `src/lib/ad.ts`, `src/lib/ad-hooks.ts` (ship as the `ad` item) | `npm run unit`, `npm run knip` |
| UI rules | `src/lib/encyclopedia.ts` (page: `src/site/encyclopedia.tsx`), then `node scripts/gen-docs.mjs` | `npm run docs:check` |
| Gallery, landing | `src/site/gallery.tsx`, `src/site/showcase/`, `src/site/mark.tsx`, `src/site/demos*.tsx`, `src/site/landing.tsx`, `src/site/moments/` | `npm run typecheck`, `./scripts/shots` |
| Examples | `src/site/examples/` (one file per page), demo data in `src/site/data.ts` | `npm run typecheck` |
| Site shell | `src/site/layout.tsx` (header, footer, Customize flap), `src/site/app-frame.tsx` (rounded app window), `src/site/routes.tsx`, `src/site/export.tsx` | `npm run typecheck` |
| Endpoints | `api/kit.ts`, `api/checklist.ts`, `api/r.ts`, `api/tokens.ts`, `vercel.json` | `./scripts/check-endpoints [url]` |
| Tooling | `scripts/` (`verify`, `changed.mjs`, `lib/smoke-map.mjs`, `unit.mjs`, `smoke.mjs`, `gen-docs.mjs`, `greys.mjs`, `shots`, `review`, `env.sh`) | `npm run lint` |

Full file-by-file layout: [docs/agent-notes/layout.md](docs/agent-notes/layout.md).

- `src/lib/`: `config.ts` is the one config object, URL (de)serialization, every `--ad-*` variable and `GREY_ROLES`;
  `color.ts` is OKLCH and the accent ramp; `registry.ts` holds every item, section and page path; `kit.ts` the agent kit,
  shadcn registry items and Tailwind block. `ad.ts` is `cn()` with our token names, formatters, safe-area and motion
  helpers (React-free). `ad.ts` and `ad-hooks.ts` ship as the `ad` registry item every component depends on, so shared
  code goes there, never into a new component dependency.
- `src/styles/`: `theme.css` (Tailwind v4 `@theme inline`: `bg-fill`, `rounded-card`, `h-control`…), `base.css`
  (corner-shape, scrollbar, no focus rings, keyframes). Both ship in exports. There is no `tokens.css` file; the
  `/tokens.css` endpoint is generated from `config.ts`.
- Mobile components import each other relatively and the kit rewrites `../mobile/` to `./`; shared parts take
  `size="touch"` instead of a copy. `ai/` and `backgrounds/` are ported from an agent assistant and self-contained by
  design (keyframes in the file); don't extract shared hooks from them.
- `api/` functions import `src/lib/*` and read component sources from disk (`includeFiles` in `vercel.json`). Scripts
  import `src/` TypeScript through `scripts/lib/load-lib.mjs`; `unit.mjs` keeps formatter goldens in `unit-goldens.json`;
  review sheets use a shot list kept with the round's output.

## Run, test, verify

- `npm ci`, then `npm run dev` (port 5190). Node 24 via nvm (`.nvmrc`).
- Quick (seconds): `npm run typecheck`, `npm run lint`, `npm run unit`, `npm run docs:check`, `npm run knip` (dead
  exports), `npx vite build --outDir "$TMPDIR/site"`. After changing a component's props, the settings, the registry
  or a rule: `npm run docs`.
- While iterating: `./scripts/verify --changed [base]` (default `origin/main`): all static checks, the build, and the smoke
  sections that reach the changed files. Shared code, config, tooling or a deleted file widens to full; docs alone skip
  the build and browser. Before a large release or merging shared code: `./scripts/verify` (full, every section, no caches).
  Run both and shots as background jobs. A new smoke section needs an entry in `scripts/lib/smoke-map.mjs`.
- A failure ends with `GATE FAIL alora-design-verify: <check> | log: <path> | rerun: ./scripts/verify --only <step>`.
  `SMOKE_WORKERS=1` runs smoke serially. Heavy scripts source `scripts/env.sh` (nvm, `npm ci` when deps are missing,
  Playwright headless shell; caches under `$HOME`) and carry `# jobq: portable`, so the job runner can use a fresh copy.
- Shots: `./scripts/shots` (per component + taste checks: borders, fonts, hover shifts, skeletons) into
  `output/shots/`. Review sheets: `./scripts/review output/<round>/shots.mjs [ONLY]` (format in
  `scripts/review.example.mjs`; `BEFORE_REF`, default `origin/main`). `output/` is not tracked. Build into `$TMPDIR`,
  never `dist/`.
- Playwright: `playwright-core` 1.65 with `chromium_headless_shell-1254`. Endpoints: `./scripts/check-endpoints [url]`.

## Deploy

- GitHub `taskflowdev1/alora-design` (public). Vercel, Git-connected: a push to `main` deploys production at
  `design.alorawork.com`, so never push unverified work. The deployed commit is in `<meta name="build">`.

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
  line). In dark, menus, selects, popovers, hover cards and tooltips take the page grey (darker than the page
  around them) and separate by shadow. The sidebar, save bar, bottom nav and toasts use `--ad-side*`, dark in both
  themes. Never put the page grey as a panel inside a card: it reads as an off black.
- Selected states: in a track a raised `bg-sel shadow-sel` pill; on a plain surface the `fill-strong` pill. One-of-N
  pickers slide one `SlidingPill`; a one-of-N picker is a Segmented, never a ButtonGroup with a painted button.
  Switch is neutral, never the accent.
- Focus: no rings; keyboard focus is a fill (`fill`, or `fill-strong` on a fill; an already-filled selected item darkens
  a notch), on every focusable part.
- Phone: a floating button for the create action on list screens, a pinned action bar on forms and details.
  `PhoneFrame` (390 × 844) is the containing block for fixed bars and the portal target for sheets.
- Routes: `/components` (desktop; `/gallery` redirects), `/mobile` (its own tab: PWA scenes, then the app's screens; plus
  `/mobile/<name>`, `/mobile/screens`, `/mobile/app/<screen>`), `/ai`, `/backgrounds`, `/examples/*`, `/encyclopedia`, `/export`. The
  sticky header is one box on every page; below lg its tabs scroll sideways in a second row. Ctrl/Cmd+K opens the palette.
- Pills, chips, segments and tabs share one padding scale: `px-bubble` / `px-bubble-sm`. Metric cards are all one
  height; Tile (default), Hero for the one main number, Scale for a few short counts.
- Gallery per-component overrides go on `<body>` (portalled menus live there); `#root` keeps the global tokens.
- /components is a bento: every component appears exactly once in a `Mark` (smoke checks it against the registry); a new
  component needs a place in a tile, and a new tile a place in `BANDS` (`showcase/index.tsx`), which is the page's layout
  and separate from registry groups. `showcase: false` keeps an item off the bento. AI/Backgrounds item = one file + one
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
- One preview server per job, on its own port; close browsers and servers you start.
- Example pages are `grid grid-cols-1`: a plain `grid` lets a wide table stretch the page on phone.
- Marketplace marks are simplified drawings, not the official logos.
