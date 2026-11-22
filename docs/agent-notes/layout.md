# Alora Design: layout, full text

Moved verbatim from `AGENTS.md` to keep the always-loaded file short.

## Layout

- `src/lib/`: `config.ts` (the one config object, URL (de)serialization, every `--ad-*` variable, `GREY_ROLES`),
  `color.ts` (OKLCH, accent ramp), `registry.ts` (every item, section, page path), `kit.ts` (agent kit, shadcn registry
  items, Tailwind block), `ad.ts` (`cn()` that knows our token names, number/date/money formatters, safe-area and
  motion helpers; React-free), `ad-hooks.ts` (shared hooks), `encyclopedia.ts`. `ad.ts` and `ad-hooks.ts` ship as the
  `ad` registry item every component depends on, so shared code goes there, never into a new component dependency.
- `src/styles/`: `theme.css` (Tailwind v4 `@theme inline`: `bg-fill`, `rounded-card`, `h-control`…), `base.css`
  (corner-shape, scrollbar, no focus rings, keyframes). Both ship in exports. There is no `tokens.css` file; the
  `/tokens.css` endpoint is generated from `config.ts`.
- `src/components/ui/*.tsx`: one copy-pasteable file per component (core, shadcn-parity, "Niche" ERP parts).
  `src/components/mobile/*.tsx`: the phone set (registry section `mobile`, pages `/mobile/<name>`); they import each other
  relatively and the kit rewrites `../mobile/` to `./`. Shared parts take `size="touch"` instead of a copy.
  `src/components/ai/` and `src/components/backgrounds/`: ported from an agent assistant and self-contained by design
  (keyframes in the file); don't extract shared hooks from them.
- `src/site/`: landing (`landing.tsx`, `moments/` (the cards it shows), tiles borrowed from `showcase-more.tsx` and `showcase-motion.tsx`), Components (`gallery.tsx`, `showcase/`,
  `mark.tsx`, `demos*.tsx`), AI/Backgrounds (`collections.tsx`, `agent*.tsx`, `app-frame.tsx`), examples (`examples/`, one file per
  page), shared demo data and formatters (`data.ts`), mobile
  (`mobile-overview.tsx`, `phone.tsx`, `mobile-app*.tsx`, `mobile-screens-*.tsx`, `mobile-data.ts`), `encyclopedia.tsx`
  (+ lazy `encyclopedia-demos.tsx`), `export.tsx`, `layout.tsx` (header, footer, Customize flap).
- `api/`: Vercel functions (`kit.ts`, `checklist.ts`, `r.ts`, `tokens.ts`) that import `src/lib/*` and read component
  sources from disk (`includeFiles` in `vercel.json`).
- `scripts/`: `verify` (full, or `--changed [base]` scoped by `changed.mjs` and `lib/smoke-map.mjs`), `unit.mjs` (formatter goldens in `unit-goldens.json`, config round-trip, registry deps vs
  imports), `smoke.mjs`, `gen-docs.mjs` (README tables, `docs/components.md`, `docs/ui-checklist.md`), `greys.mjs`,
  `lib/load-lib.mjs` (imports `src/` TypeScript from Node scripts), `shots`, `review` + `review.mjs` (before/after
  sheets from a shot list kept with the round's output), `check-endpoints`, `env.sh`.
