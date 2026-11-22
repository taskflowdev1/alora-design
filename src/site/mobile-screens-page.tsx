// /mobile/screens: every screen of the example app as a live phone; each opens that screen full screen.
import { Maximize2 } from "react-feather";
import { MobileApp, SCREENS } from "./mobile-app";
import { LazyPhone } from "./lazy-phone";
import { SLink } from "./config";

/** Every screen, then each forced state (empty, offline, error) as its own tile. Lettered P1… in order. */
const SCREEN_TILES = SCREENS.flatMap((s) => [
  { screen: s.id, state: undefined as string | undefined, title: typeof s.title === "string" ? s.title : s.id === "order" ? "Order" : s.id === "product" ? "Product" : s.id === "chat" ? "Chat" : "Customer" },
  ...(s.states ?? []).map((st) => ({ screen: s.id, state: st.key, title: st.title })),
]).map((t, i) => ({ ...t, letter: `P${i + 1}`, href: `/mobile/app/${t.screen}${t.state ? `?state=${t.state}` : ""}` }));

export function MobileScreensPage() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 pb-8 pt-2 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-heading font-semibold">Screens</h1>
      </div>
      <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {SCREEN_TILES.map((t) => (
          <section key={t.letter} data-screen-tile={t.screen} className="group relative grid min-w-0 content-start gap-3 rounded-sheet bg-surface p-4 shadow-card transition-transform duration-[180ms] ease-ad has-[a:hover]:-translate-y-0.5 has-[a:focus-visible]:bg-fill">
            <LazyPhone inert>
              <MobileApp screen={t.screen} state={t.state} />
            </LazyPhone>
            <h2 className="flex min-h-control items-center justify-between gap-2 px-1 text-body">
              <span className="truncate font-medium text-ink">{t.title}</span>
              <Maximize2 size={16} className="shrink-0 text-ink-muted transition-colors duration-[150ms] group-has-[a:hover]:text-ink" />
            </h2>
            {/* The whole card is the link (stretched over it); the phone inside is a picture of the screen. */}
            <SLink to={t.href} aria-label={`${t.title}, open full screen`} className="absolute inset-0 rounded-sheet" />
          </section>
        ))}
      </div>
    </main>
  );
}
