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
- `src/components/ui/*.tsx`: the library, one copy-pasteable file per component (shadcn style).
- `src/site/`: landing, gallery (`demos.tsx` = one demo per component), examples, export.
- `api/`: Vercel functions. `kit.ts` (`/api/kit`), `r.ts` (`/r/<name>.json`, rewritten in `vercel.json`),
  `tokens.ts` (`/tokens.css`, `/tokens.json`, `/tailwind.css`). They import `src/lib/*` and read
  component sources from disk (`includeFiles` in `vercel.json`).
- `scripts/`: `verify`, `smoke.mjs`, `shots` + `shots.mjs`, `check-endpoints`.

## Run, test, verify

- `npm ci`, then `npm run dev` (port 5190). Node 24 via nvm.
- Quick inline checks: `npx tsc -p tsconfig.json --noEmit`, `npx eslint .`, `npx vite build` (~2 s).
- Full verify (typecheck, lint, build, headless Playwright smoke on port 5196) goes through the queue:
  `job submit --kind script --name alora-design-verify --ram 2 --minutes 6 --needs yoga --owner <thread> --cwd "$PWD" --cmd ./scripts/verify`
- Review screenshots + automatic taste checks (visible borders, fonts, hover shifts, skeleton boxes):
  `./scripts/shots` through the queue (port 5197, ~2.5 GB). Output in `output/review/` (gitignored):
  PNGs lettered L/G/E/X/S, `index.md`, `checks.json`. `ONLY=<regex>` limits the shots.
- Endpoints on a deployment: `./scripts/check-endpoints [base-url]` (curl, quick, inline is fine).
- Playwright uses `playwright-core` 1.65 with the cached `chromium_headless_shell-1254`; no download.

## Accounts and deploy

- Alora only: `~/.local/bin/alora git|gh|vercel`. GitHub `taskflowdev1/alora-design` (private).
  Vercel project `alora-design`, scope `taskflowdevs-projects`, Git-connected: push to `main` deploys.
- Domain `design.alorawork.com` (Cloudflare wildcard DNS already points at Vercel; never touch DNS).
- Push-to-live is measured from the `<meta name="build">` commit stamp in `index.html`; target 60 s.
  Keep dependencies small; the build is Vite only.

## Deliberate oddities

- Config lives in the URL query (`r c k p h a g sh f t`, defaults omitted). `SLink`/`useHref` keep it on
  every link. Unknown keys are ignored (`?loading=1` holds skeletons in the examples for screenshots).
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

## Landmines

- No borders, outlines or rings anywhere (shots.mjs flags them). Focus = the hover fill token.
- No dividing lines, eyebrows, subtitles under titles or captions under buttons. Accent only on
  primary/key actions. One typeface (code blocks use mono, the only exception).
- Changing a token name means updating `theme.css`, `config.ts`, `ad.ts` (twMerge names) and the kit.
- Yoga is RAM-tight: one preview server per job, close browsers, no blanket Docker cleanup.
