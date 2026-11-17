# Alora Design

Open-source (repo private until Joshua says otherwise), shadcn-like React component library in Joshua's
ERP UI taste, plus the gallery site at https://design.alorawork.com. Users: Joshua (critiques every
component), Alora builders and agents who install components into client apps.

The taste source is the erp-ui skill (`~/.claude-personal/skills/erp-ui/taste.md`, `joshua-feedback.md`).
taste.md wins over anything here. Build to his taste, not library defaults.

## Layout

- `src/lib/config.ts`: the one config object (radius, corner shape, smoothing, padding, height, accent,
  greys, shadow, font size, theme), URL (de)serialization, and every derived `--ad-*` CSS variable.
- `src/lib/color.ts`: OKLCH maths, accent shade ramp. `src/lib/kit.ts`: export generators (agent kit
  markdown, shadcn registry items, Tailwind block). `src/lib/registry.ts`: the component list.
- `src/lib/ad.ts`: `cn()` (tailwind-merge that knows our token names) and date/money formatters.
- `src/styles/theme.css`: Tailwind v4 `@theme inline` mapping (`bg-fill`, `rounded-card`, `h-control`...).
  `src/styles/base.css`: corner-shape, scrollbar, no focus rings, keyframes. Both ship in exports.
- `src/components/ui/*.tsx`: the library, one copy-pasteable file per component (shadcn style). 41 core
  components plus 28 niche ERP parts (group "Niche": command palette, date range, fee rows, shop picker…).
- `src/site/`: landing (plain hero, the gallery grid, the niche spotlight, the corner demo at the bottom),
  gallery (`demos.tsx` + `demos-niche.tsx` = one demo per component), examples (7 pages: dashboard, orders,
  products, promotions, cancellations, team, settings), export. `layout.tsx` holds the one site header.
- `api/`: Vercel functions. `kit.ts` (`/api/kit`), `r.ts` (`/r/<name>.json`, rewritten in `vercel.json`),
  `tokens.ts` (`/tokens.css`, `/tokens.json`, `/tailwind.css`). They import `src/lib/*` and read
  component sources from disk (`includeFiles` in `vercel.json`).
- `scripts/`: `verify`, `smoke.mjs`, `shots` + `shots.mjs`, `check-endpoints`.

## Run, test, verify

- `npm ci`, then `npm run dev` (port 5190). Node 24 via nvm.
- Quick inline checks: `npx tsc -p tsconfig.json --noEmit`, `npx eslint .`, `npx vite build` (~2 s).
- Full verify (typecheck, lint, build, headless Playwright smoke on port 5196) goes through the queue:
  `job submit --kind script --name alora-design-verify --ram 2 --minutes 6 --needs yoga --owner <thread> --cwd "$PWD" --cmd ./scripts/verify`
- Review screenshots + automatic taste checks (visible borders, fonts, hover shifts, skeleton boxes, header
  box on every page): `./scripts/shots` through the queue (port 5197, ~0.6 GB, ~10 min). Output in
  `output/review-v2/` (gitignored): PNGs lettered L/G/N/M/E/F/X/S, `shots.md`, `checks.json`; `index.md` is
  written by hand for Joshua (before/after pairs use `before/`, v1 crops). `ONLY=<regex>` limits the shots.
  v1 shots stay in `output/review/`.
- Endpoints on a deployment: `./scripts/check-endpoints [base-url]` (curl, quick, inline is fine).
- Playwright uses `playwright-core` 1.65 with the cached `chromium_headless_shell-1254`; no download.

## Accounts and deploy

- Alora only: `~/.local/bin/alora git|gh|vercel`. GitHub `taskflowdev1/alora-design` (private).
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
- Menu is custom (not Radix DropdownMenu) to get a debounced safe triangle; see the header comment in
  `menu.tsx`. `showSafeArea` draws it.
- Toasts read `data-toast-avoid` elements to stay clear of save bars and side panes.
- shadcn install: every component depends on `/r/theme.json?<settings>` (cssVars + base css) and
  `/r/ad.json` (utils). shadcn also adds harmless `--color-ad-*` aliases to `@theme inline`.

- One padding scale for bubbles: `--ad-bubble-x` (pills at control height, chips, segments, tabs) and
  `--ad-bubble-x-sm` (24 px pills, copy chips, reactions); Tailwind `px-bubble` / `px-bubble-sm`.
- Metric card: one or two digits get the short treatment (variant "tile", default; "scale" and "compact"
  exist as B/C). Every metric card is the same height so mixed rows line up.
- The site header is sticky and shared by every page (same box; shots and smoke check it). Examples sit in
  the same 1280 px container. Ctrl/Cmd+K opens the command palette over pages and components.

## Landmines

- No borders, outlines or rings anywhere (shots.mjs flags them). Focus = the hover fill token.
- No dividing lines, eyebrows, subtitles under titles or captions under buttons. Accent only on
  primary/key actions. One typeface (code blocks use mono, the only exception).
- Changing a token name means updating `theme.css`, `config.ts`, `ad.ts` (twMerge names) and the kit.
- Yoga is RAM-tight: one preview server per job, close browsers, no blanket Docker cleanup.
- Pages inside the examples are `grid grid-cols-1`: a plain `grid` lets a wide table stretch the page on phone.
- Marketplace marks are simplified drawings, not the official logos; swap in real assets per product.
