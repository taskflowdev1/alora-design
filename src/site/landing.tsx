import { ArrowRight, GitHub } from "react-feather";
import { Button } from "@/components/ui/button";
import { SandField } from "@/components/backgrounds/sand-field";
import { SLink } from "./config";
import { Wordmark } from "./logo";
import { Bento } from "./bento";
import { AgentApp, NewChat } from "./agent";
import { Credit, TABS } from "./layout";

function Hero() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-10 sm:px-6 lg:pb-24 lg:pt-16">
      <h1 className="max-w-[11ch] text-[length:clamp(72px,13.2vw,220px)] font-semibold leading-[0.88] tracking-[-0.055em] text-ink">just some random ui styling</h1>
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

function SectionTitle({ to, children }: { to: string; children: string }) {
  return (
    <h2 className="px-1 text-title font-semibold text-ink">
      <SLink to={to} className="rounded-small transition-colors duration-[160ms] hover:text-ink-muted">
        {children}
      </SLink>
    </h2>
  );
}

/** AI pieces in use: a thread with its live run line and working message box, and the chat list. */
function AiBand() {
  return (
    <section aria-label="AI" data-landing="ai" className="mx-auto mt-20 grid w-full max-w-[1280px] gap-4 px-4 sm:px-6">
      <SectionTitle to="/ai">AI</SectionTitle>
      <AgentApp />
    </section>
  );
}

/** The new-chat screen over the sand field: move the mouse over it. */
function BackgroundsBand() {
  return (
    <section aria-label="Backgrounds" data-landing="backgrounds" className="mx-auto mt-20 grid w-full max-w-[1280px] gap-4 px-4 sm:px-6">
      <SectionTitle to="/backgrounds">Backgrounds</SectionTitle>
      <div data-field-stage className="relative isolate grid min-h-[clamp(440px,58vh,600px)] place-items-center overflow-hidden rounded-sheet bg-surface px-4 py-12 shadow-card">
        <SandField className="rounded-[inherit] bg-surface" />
        <NewChat />
      </div>
    </section>
  );
}

/** The landing's footer: the wordmark and the way in on one line, the tabs and the credit on the next. */
function Closing() {
  return (
    <footer data-landing="footer" className="mx-auto mb-12 mt-24 w-full max-w-[1280px] px-4 sm:px-6">
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
              <SLink key={t.to} to={t.to} className="rounded-small transition-colors duration-[160ms] hover:text-ink">
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

export function Landing() {
  return (
    <main>
      <Hero />
      <Bento />
      <AiBand />
      <BackgroundsBand />
      <Closing />
    </main>
  );
}
