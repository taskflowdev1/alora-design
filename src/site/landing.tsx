import * as React from "react";
import { ArrowRight, GitHub } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Carousel } from "@/components/ui/carousel";
import { HoloCard } from "@/components/ui/holo-card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { SLink } from "./config";
import { Wordmark } from "./logo";
import { PlainMarks } from "./mark";
import { PaletteCard, SalesCard } from "./moments/sales-palette";
import { SalesTrendTile } from "./showcase-more";
import { StockCountTile } from "./showcase-motion";
import { OtpFlow } from "./otp-flow";
import { SHOWPIECE_MOMENTS } from "./showpieces";
import { DAFOE_PHOTOS } from "./data";
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
function Moment({ id, title, to, touchOnly, className, children }: { id: string; title: string; to: string; touchOnly?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} data-moment={id} className={cn("ad-moment mx-auto grid w-full max-w-[1280px] justify-items-center gap-8 px-4 py-[clamp(56px,11dvh,120px)] sm:px-6", touchOnly && "[@media(pointer:fine)]:hidden")}>
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

/** Photos one row at a time: whole slides only, rounded to sit concentric inside the card, the dots and arrows under them. */
function PhotoCarousel() {
  return (
    <Card inset="nest" className="grid gap-nest">
      <Carousel aria-label="Willem Dafoe" perView={3} gap={8} peek={false} className="gap-nest">
        {DAFOE_PHOTOS.map((p) => (
          <AspectRatio key={p.src} ratio={4 / 5} className="overflow-hidden rounded-control bg-fill">
            <img src={p.src} alt={p.alt} loading="lazy" draggable={false} className="size-full object-cover" />
          </AspectRatio>
        ))}
      </Carousel>
    </Card>
  );
}

/**
 * The landing: one showpiece component per screen, each polished on its own (the first few here, the rest from
 * ./showpieces). Tables, lists, AI and backgrounds live on their own pages.
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
          <Moment id="holo" title="Holo card" to="/components/holo-card" className="max-w-[440px] justify-items-center">
            <div className="grid w-full place-items-center py-6">
              <HoloCard className="w-full" />
            </div>
          </Moment>
          <Moment id="otp" title="One-time code" to="/components/input-otp" className="max-w-[440px]">
            <OtpFlow framed />
          </Moment>
          <Moment id="palette" title="Command palette" to="/components/command-palette" className="max-w-[560px]">
            <PaletteCard className="h-[372px] bg-surface" />
          </Moment>
          <Moment id="dial" title="Number dial" to="/components/number-dial" className="max-w-[640px]">
            <StockCountTile />
          </Moment>
          <Moment id="chart" title="Line chart" to="/components/line-chart" className="max-w-[640px]">
            <SalesTrendTile />
          </Moment>
          <Moment id="carousel" title="Carousel" to="/components/carousel" className="max-w-[720px]">
            <PhotoCarousel />
          </Moment>
          {SHOWPIECE_MOMENTS.map((m) => (
            <Moment key={m.id} id={m.id} title={m.title} to={m.to} touchOnly={m.touchOnly} className={m.width}>
              {m.render()}
            </Moment>
          ))}
        </div>
      </PlainMarks.Provider>
      <Closing />
    </main>
  );
}
