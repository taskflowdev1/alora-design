import * as React from "react";
import { ArrowRight, GitHub } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { SandField } from "@/components/backgrounds/sand-field";
import { SLink } from "./config";
import { Wordmark } from "./logo";
import { PlainMarks } from "./mark";
import { OrdersCard } from "./moments/orders";
import { PaletteCard, SalesCard, ShellCard } from "./moments/sales-palette-shell";
import { ShipmentCard } from "./moments/shipment";
import { ProductPhotosTile, SalesTrendTile, TillSignInTile } from "./showcase-more";
import { AppearanceTile, StockCountTile } from "./showcase-motion";
import { LazyPhone } from "./lazy-phone";
import { MobileApp } from "./mobile-app";
import { AgentApp, NewChat } from "./agent";
import { Credit, TABS } from "./layout";

function Hero() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 pb-10 pt-10 sm:px-6 lg:pb-16 lg:pt-16">
      <h1 className="-ml-[0.04em] max-w-[11ch] text-[length:clamp(72px,13.2vw,220px)] font-semibold leading-[0.88] tracking-[-0.055em] text-ink">just some random ui styling</h1>
      <div className="mt-10 grid grid-cols-2 gap-2 sm:flex lg:mt-14">
        <Button variant="primary" asChild className="justify-center">
          <SLink to="/components">
            Explore components
            <ArrowRight />
          </SLink>
        </Button>
        <Button variant="secondary" asChild className="justify-center">
          <a href="https://github.com/JoshD94/ai-skills/tree/main/erp-ui" target="_blank" rel="noopener">
            <GitHub />
            erp-ui skill
          </a>
        </Button>
      </div>
    </section>
  );
}

/**
 * One component on its own: its name (a link to its page) over the component, centred, with the screen around it.
 * Scrolling brings one moment into focus at a time; the ones above and below dim (index.css `.ad-moment`).
 */
function Moment({ id, title, to, className, children }: { id: string; title: string; to: string; className?: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} data-moment={id} className="ad-moment mx-auto grid w-full max-w-[1280px] justify-items-center gap-8 px-4 py-[clamp(56px,11dvh,120px)] sm:px-6">
      <h2 className="text-center text-[length:clamp(28px,3.4vw,44px)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink">
        <SLink to={to} className="-mx-1 rounded-small px-1 transition-colors duration-[160ms] hover:text-ink-muted focus-visible:bg-fill">
          {title}
        </SLink>
      </h2>
      <div className={cn("grid w-full min-w-0", className)}>{children}</div>
    </section>
  );
}

/** The landing's footer: the wordmark and the way in on one line, the tabs and the credit on the next. */
function Closing() {
  return (
    <footer data-landing="footer" className="mx-auto mb-12 mt-16 w-full max-w-[1280px] px-4 sm:px-6">
      <div className="grid gap-8 rounded-sheet bg-surface p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-5">
          <Wordmark height={22} />
          <Button variant="primary" asChild>
            <SLink to="/components">
              Explore components
              <ArrowRight />
            </SLink>
          </Button>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-body text-ink-muted">
            {TABS.map((t) => (
              <SLink key={t.to} to={t.to} className="-mx-1 rounded-small px-1 transition-colors duration-[160ms] hover:text-ink focus-visible:bg-fill focus-visible:text-ink">
                {t.label}
              </SLink>
            ))}
          </nav>
          <Credit />
        </div>
      </div>
    </footer>
  );
}

/**
 * The landing: the showpiece components one at a time, each on its own screen; then the phone, AI and backgrounds;
 * the ERP screen (table, filters, pagination, the sidebar) comes last, as one demo.
 */
export function Landing() {
  return (
    <main>
      <Hero />
      <PlainMarks.Provider value={true}>
        <div data-landing="moments">
          <Moment id="metric" title="Metric card" to="/components/metric-card" className="max-w-[560px]">
            <SalesCard chartHeight={148} />
          </Moment>
          <Moment id="otp" title="One-time code" to="/components/input-otp" className="max-w-[440px]">
            <TillSignInTile />
          </Moment>
          <Moment id="palette" title="Command palette" to="/components/command-palette" className="max-w-[560px]">
            <PaletteCard className="bg-surface" />
          </Moment>
          <Moment id="dial" title="Number dial" to="/components/number-dial" className="max-w-[640px]">
            <StockCountTile />
          </Moment>
          <Moment id="theme" title="Theme switch" to="/components/theme-switch" className="max-w-[440px]">
            <AppearanceTile />
          </Moment>
          <Moment id="tracker" title="Step progress" to="/components/steps" className="max-w-[560px]">
            <ShipmentCard />
          </Moment>
          <Moment id="chart" title="Line chart" to="/components/line-chart" className="max-w-[880px]">
            <SalesTrendTile />
          </Moment>
          <Moment id="carousel" title="Carousel" to="/components/carousel" className="max-w-[880px]">
            <ProductPhotosTile />
          </Moment>
          <Moment id="phone" title="Mobile" to="/mobile" className="max-w-[880px]">
            {/* The phone stands on a stage, as on /mobile: its dark screen on the dark page would vanish. */}
            <div className="grid justify-items-center rounded-sheet bg-surface px-4 py-8 shadow-card sm:py-10">
              <LazyPhone className="w-full max-w-[350px]">
                <MobileApp screen="orders" />
              </LazyPhone>
            </div>
          </Moment>
        </div>
      </PlainMarks.Provider>
      <div data-landing="ai">
        <Moment id="ai" title="AI" to="/ai">
          <AgentApp />
        </Moment>
      </div>
      <div data-landing="backgrounds">
        <Moment id="backgrounds" title="Backgrounds" to="/backgrounds">
          <div data-field-stage className="relative isolate grid min-h-[clamp(440px,58dvh,600px)] place-items-center overflow-hidden rounded-sheet bg-surface px-4 py-12 shadow-card">
            <SandField className="rounded-[inherit] bg-surface" />
            <NewChat />
          </div>
        </Moment>
      </div>
      <div data-landing="erp">
        <Moment id="erp" title="ERP" to="/examples/orders" className="gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <ShellCard className="hidden lg:flex" />
          <OrdersCard />
        </Moment>
      </div>
      <Closing />
    </main>
  );
}
