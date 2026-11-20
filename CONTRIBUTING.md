# Contributing

Thanks for helping. Alora Design is a copy-paste component library with one strong taste: dense ERP screens, no
lines, soft fills, one accent. Read [AGENTS.md](AGENTS.md) once for the layout and the deliberate oddities; it is written
for people and coding agents alike.

## Setup

```sh
nvm use              # Node 24, from .nvmrc
npm ci
npm run dev          # http://localhost:5190
```

Quick checks while you work: `npm run typecheck`, `npm run lint`, `npm run unit`, `npm run docs:check`. Before a pull
request, `npm run verify` runs all of them plus the grey check, a build and a headless smoke test (it installs the
Playwright headless shell the first time).

## Adding a component

1. **One file**: `src/components/ui/<name>.tsx` (phone parts in `src/components/mobile/`). It imports only React,
   `react-feather`, `radix-ui` where needed, `@/lib/ad`, `@/lib/ad-hooks` and other components, so it stays
   copy-pasteable. Colours, radii and spacing come from the tokens (`bg-fill`, `rounded-card`, `p-pad`), never raw
   values. Shared helpers go in `src/lib/ad.ts` or `src/lib/ad-hooks.ts`, which every install gets.
2. **A registry entry** in `ITEMS` in `src/lib/registry.ts`: `name`, `title`, `group`, `files`, npm `deps` and
   `registryDeps` for the components it imports. `npm run unit` fails when they don't match the imports.
3. **A demo** for its page in `src/site/demos*.tsx`, and **a place on /components**: wrap a real use of it in a `Mark`
   inside a tile (`src/site/showcase/`, one file per band). The smoke test checks every component appears exactly once. An item with
   no natural tile takes `showcase: false`.
4. **Docs**: `npm run docs` regenerates the README tables, `docs/components.md` and `docs/ui-checklist.md`. Write a
   one-line doc comment on the component and on each prop; that is where the docs come from.

An AI loader or a background is one file and one registry entry; see "Adding an AI loader or a background" in the
README.

## Every UI change

Run it through [docs/ui-checklist.md](docs/ui-checklist.md): every **must** holds, every **should** holds or the pull
request says why not. Cite rules by id (`layout.no-lines`). The rules, with why, how and sources, live in
`src/lib/encyclopedia.ts` and on the site at `/encyclopedia`; propose a rule change there, never by ignoring it.

The ones people trip on most:

- No borders, outlines, rings or dividing lines. Separate with space, fills and shadow.
- No eyebrows, subtitles under titles or captions under buttons. One typeface; mono only in code blocks.
- Greys only from the ramp (`npm run greys`); accent only on primary or key actions.
- Focus is a fill, never a ring. Presses shrink a little (`ad-press`) and nothing else moves.
- Skeletons only for real fetches, the exact size of what loads.

## Pull requests

Keep one change per pull request. For anything visible, attach before and after screenshots at the same viewport,
theme and state; `scripts/review` makes them from a short shot list (see `scripts/review.example.mjs`). Contributions
are released under the [MIT License](LICENSE).
