# Alora Design

Open-source (public on GitHub since 2026-11-17, MIT), shadcn-like React component library in Joshua's
ERP UI taste, plus the gallery site at https://design.alorawork.com. Users: Joshua (critiques every
component), Alora builders and agents who install components into client apps.

The taste source is the erp-ui skill (`~/.claude-personal/skills/erp-ui/taste.md`, `joshua-feedback.md`; public copy: https://github.com/JoshD94/ai-skills/tree/main/erp-ui).
taste.md wins over anything here. Build to his taste, not library defaults.

## Layout

- `src/lib/config.ts`: the one config object (radius, corner shape, smoothing, padding, height, accent,
  greys, shadow, font size, theme), URL (de)serialization, and every derived `--ad-*` CSS variable.
- `src/lib/color.ts`: OKLCH maths, accent shade ramp. `src/lib/kit.ts`: export generators (agent kit
  markdown, shadcn registry items, Tailwind block). `src/lib/registry.ts`: every item, its section and page path.
- `src/lib/ad.ts`: `cn()` (tailwind-merge that knows our token names) and date/money formatters.
- `src/styles/theme.css`: Tailwind v4 `@theme inline` mapping (`bg-fill`, `rounded-card`, `h-control`...).
  `src/styles/base.css`: corner-shape, scrollbar, no focus rings, keyframes. Both ship in exports.
- `src/components/ui/*.tsx`: the library, one copy-pasteable file per component (shadcn style): core components,
  the shadcn-parity set (charts on `chart.tsx`, navigation, chat parts, data table…) and niche ERP parts (group "Niche").
  Every shadcn component has ours except Separator (no dividing lines) and Direction (an RTL provider); Spinner maps
  to Thinking orbs (no spinners). `src/components/ai/` (Thinking orbs, Run status, Composer
  glow) and `src/components/backgrounds/` (Sand field): ported read-only from alora-board's assistant.
- `src/site/`: landing (hero, `bento.tsx` = the original components in 19 real ERP cards, `MoreBento` from
  `showcase-more.tsx` = the shadcn-parity tiles in category bands, then the AI and Backgrounds bands, then the closing
  card that is the landing's footer), Components page (`showcase.tsx`: every component live in category bento tiles,
  its own `BASE_TILES` plus `MORE_TILES`; `mark.tsx` = the shared Mark, Tile, spans; `demos-more.tsx` = the new demos; `gallery.tsx` = page shell + detail
  pages with sliders, `demos.tsx` + `demos-niche.tsx` = one demo each for those), AI and Backgrounds (`collections.tsx`, `agent.tsx` = the composer/new-chat/thread
  they sit in; `AgentApp` = chat sidebar left (fit-content, 240–280 px), thread takes the rest, 580 px tall from lg). The message box
  (`Composer`) ships in `composer-glow.tsx`: one row attach | text | send, one control size, inset = half the card padding,
  radius = control radius + inset; text grows upward, buttons stay at the bottom (Board's assistant composer), examples (7 pages), export. `layout.tsx` holds the one header (tabs), footer and customize flap.
- `api/`: Vercel functions. `kit.ts` (`/api/kit`), `r.ts` (`/r/<name>.json`, rewritten in `vercel.json`),
  `tokens.ts` (`/tokens.css`, `/tokens.json`, `/tailwind.css`). They import `src/lib/*` and read
  component sources from disk (`includeFiles` in `vercel.json`).
- `scripts/`: `verify`, `smoke.mjs`, `gen-docs.mjs` (README tables + `docs/components.md`), `review-shots`, `shots`,
  `check-endpoints`, `env.sh`, `greys.mjs` (grey ramp check and inventory).

## Run, test, verify

- `npm ci`, then `npm run dev` (port 5190). Node 24 via nvm.
- Quick inline checks: `npx tsc -p tsconfig.json --noEmit`, `npx eslint .`, `node scripts/gen-docs.mjs --check`,
  `npx vite build` (~2 s). After changing a component's props, the settings or the registry: `node scripts/gen-docs.mjs`.
- Full verify (typecheck, lint, docs drift, build, headless Playwright smoke on port 5196) goes through the queue. Job
  scripts source `scripts/env.sh` (nvm Node 24, `npm ci` when deps are missing, Playwright headless shell + ffmpeg when
  missing; caches under `$HOME`), so they are portable. While `mac status` shows the Mac lent, send them there:
  `job submit --kind script --name alora-design-verify --ram 2 --minutes 8 --needs mac --sync --owner <thread> --cwd "$PWD" --cmd ./scripts/verify`
  (screenshot jobs add `--out output/<folder>`). Otherwise use `--needs yoga` (no `--sync`). The wrappers carry
  `# jobq: portable` because the queue's audit misreads "Promotions" (an example page) as a production word.
- v5 review shots: `./scripts/review-v5-shots [before] [ONLY]` (before = the live site into `before/`) into
  `output/review-v5/` (letters A AI, F footer, H wordmark, T on/off states, N new components, X overflow).
- Review shots for Joshua: `./scripts/review-shots` (port 5193, ~1.5 GB, ~6 min; `ONLY="C|W"` ~2 min): lettered PNGs + two webm videos +
  `checks.json` (no horizontal scroll at 360–1440 in both themes, flap clearance, orbs drawing/pausing, reduced
  motion, sand field reacting) in `output/review-v4.3/` (gitignored; `OUT` to change, `ONLY=<letters>`, before shots
  from `BEFORE_BASE`, default the live site). `index.md` there is written by hand.
- Per-component shots + taste checks (visible borders, fonts, hover shifts, skeleton boxes): `./scripts/shots`
  (port 5197, ~0.6 GB, ~10 min) into `output/review-v2/`.
- Endpoints on a deployment: `./scripts/check-endpoints [base-url]` (curl, quick, inline is fine).
- Playwright uses `playwright-core` 1.65 with `chromium_headless_shell-1254` (cached on Yoga; `env.sh` installs it
  on the Mac once).

## Accounts and deploy

- Alora only: `~/.local/bin/alora git|gh|vercel`. GitHub `taskflowdev1/alora-design` (public).
  Vercel project `alora-design`, scope `taskflowdevs-projects`, Git-connected: push to `main` deploys.
- Domain `design.alorawork.com` (Cloudflare wildcard DNS already points at Vercel; never touch DNS).
- Push-to-live is measured from the `<meta name="build">` commit stamp in `index.html`; target 60 s.
  Keep dependencies small; the build is Vite only.

## Deliberate oddities

- Defaults: dark theme, neutral greys, pink accent `#dc467d` (Joshua, v1 review). Dark is neutral
  near-black; cool/warm keep only a hint of tint in dark. Exports put the default theme on `:root` and the
  other on a class (`.light` when dark is default); the Tailwind `dark:` variant follows.
- Config lives in the URL query (`r c k p h a g sh f t`, defaults omitted; light is `t=l`). `SLink`/`useHref`
  keep it on every link. Unknown keys are ignored (`?loading=1` holds skeletons in the examples). On a
  gallery page, a key matching a demo control sets it (`/gallery/metric-card?variant=scale`).
- Radii: control radius R; nest gap G = round(R/3); card = R + G; item = R - G; sheet = R + padding.
  With `corner-shape` support, R is scaled (`squircleCompensation`) because a squircle looks tighter.
  Square mode zeroes every radius; circles (`rounded-full`, `data-shape="round"`) always stay round.
- Gallery per-component overrides are applied to `<body>` (portalled menus/popovers live there) while
  `#root` keeps the global tokens. Cleanup removes both.
- Sidebar (and save bar, bottom nav) use `--ad-side`: dark in both themes; in dark mode it sits at card level,
  a step above the page, so it still stands out.
- Routes: `/components` (was `/gallery`, which redirects), `/ai`, `/backgrounds`, `/examples/*`, `/export`. Header
  tabs in that order (Components first); below lg they move to a second row that scrolls sideways, never the page.
- /components is a bento like the landing (12 columns, 16 px gaps): per category, tiles that compose its components
  in real use. Each component sits in a `Mark` (`data-spot`): hover shows a soft fill and a name chip that opens its
  sliders; a click on its empty space does too. Every component appears exactly once (smoke checks against the
  registry); a new component needs a place in a tile in `TILES`. Overlays are drawn open in place. /ai uses `TileSpot`
  tiles; /backgrounds keeps `Spot`s.
- AI/Backgrounds item = one file + one registry entry (`export`, `params`, `stage`, `kind`, `preview`);
  `collections.tsx` finds the export with `import.meta.glob` and builds the sliders. They install as `registry:ui`
  next to the ui components, so `run-status.tsx` imports `./thinking-orbs`. Keyframes live in the file as a React 19
  `<style href precedence>` tag. Each pauses off screen and honours reduced motion (sand field: plain ground).
- Menu is custom (not Radix DropdownMenu) to get a debounced safe triangle; see the header comment in
  `menu.tsx`. `showSafeArea` draws it.
- Toasts read `data-toast-avoid` elements to stay clear of save bars and side panes.
- shadcn install: every component depends on `/r/theme.json?<settings>` (cssVars + base css) and
  `/r/ad.json` (utils). shadcn also adds harmless `--color-ad-*` aliases to `@theme inline`.

- One padding scale for bubbles: `--ad-bubble-x` (pills at control height, chips, segments, tabs) and
  `--ad-bubble-x-sm` (24 px pills, copy chips, reactions); Tailwind `px-bubble` / `px-bubble-sm`.
- Metric card: one or two digits get the short treatment (variant "tile", default; "scale" and "compact"
  exist as B/C). Every metric card is the same height so mixed rows line up.
- Customize (md and up) is the left flap in `layout.tsx`: hover opens a panel as wide as the room left of the 1280 px
  page (min 344 px) and pushes the page wrapper (`[data-page]`) flush right. The margin is set once and a WAAPI
  transform slides it (FLIP), so text rewraps once at the start, never per frame. Below md the header Customize
  popover stays. Narrower than 344 + 960 px, the panel overlays instead of pushing. Below 1304 px the page wrapper
  gets up to 12 px of left padding so the edge tab never covers content (smoke checks it at 768).
- Footer: the credit "Curated by Joshua Dirga · 2026" (his name links to joshuadirga.com) at body size. Inner pages:
  one line on the content edge. Landing: the closing card is the only footer (wordmark + Explore, then tabs + credit).
- Selected states follow the shadcn/Radix/Apple norm (Joshua rejected solid-ink pills in v5): in a track (segmented,
  toggle group, chips inside a field, own reactions) a raised pill, `bg-sel shadow-sel` on `bg-track` (a soft drop only: never an edge, outline or ring); on a plain
  surface (tabs, chips, shop-picker All/Only, toggle, pagination) the grey `fill-strong` pill. Active text is ink and
  medium, inactive muted and regular; `.ad-hold` keeps the width when the weight changes. The track is `fill` (the
  original lightness). Switch: neutral, never the accent: `switch-on` = ink in light, `ink-muted` in dark, off =
  `fill-strong`, white thumb, sized in whole px (2 px inset all round; smoke asserts equal insets). Tune these tokens in `config.ts`, not per component. `.ad-on-dark` remaps them for the
  dark sidebar. Review: `./scripts/review-v5.3-shots` (original, v5.2 and new side by side, switch insets, grey sheet, 6 vs 5 steps).
- Greys (Joshua, v5.1, v5.2): one ramp of six per theme (page, surface, fill, fill-strong, ink-muted, ink) (`GREY_STEPS`/`greyRamp`/`GREY_ROLES` in `config.ts`, table in the
  README). The dark islands take the dark ramp in both themes, so both themes together use 12 greys. Hover on a surface is
  `fill`, on a fill `fill-strong`. Role tokens map to a step; never add a grey, an alpha on a grey token (`bg-fill/40`), `color-mix` on one, a
  palette grey (`text-white`, `bg-black/5`) or a raw hex. `scripts/greys.mjs --check` (in verify) enforces it; image
  content or an accent choice gets `grey-ok` on its line. `--inventory` / `--sheet` make the before/after swatch sheet.
- The site header is sticky and shared by every page (same box; shots and smoke check it). The logo is the Alora
  wordmark traced to one SVG path (`src/site/logo.tsx`, currentColor, 16 px in the header) + a muted "design" whose d
  reaches alora's x-height (same width as the mark); the
  favicon is the traced mark. The customize panel and phone popover are their own scroll areas (`useOwnScroll`). Examples sit in
  the same 1280 px container. Ctrl/Cmd+K opens the command palette over pages and components.

## Landmines

- No borders, outlines or rings anywhere (shots.mjs flags them). Focus = the hover fill token.
- No dividing lines, eyebrows, subtitles under titles or captions under buttons. Accent only on
  primary/key actions. One typeface (code blocks use mono, the only exception).
- Changing a token name means updating `theme.css`, `config.ts`, `ad.ts` (twMerge names) and the kit.
- Yoga is RAM-tight: one preview server per job, close browsers, no blanket Docker cleanup.
- Pages inside the examples are `grid grid-cols-1`: a plain `grid` lets a wide table stretch the page on phone.
- Marketplace marks are simplified drawings, not the official logos; swap in real assets per product.
