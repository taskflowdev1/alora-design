import { ArrowRight, GitHub } from "react-feather";
import { Button } from "@/components/ui/button";
import { SLink } from "./config";
import { Wordmark } from "./logo";
import { Bento } from "./bento";

function Hero() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-10 sm:px-6 lg:pb-24 lg:pt-16">
      <h1 className="max-w-[11ch] text-[length:clamp(72px,13.2vw,220px)] font-semibold leading-[0.88] tracking-[-0.055em] text-ink">just some random ui styling</h1>
      <div className="mt-10 grid grid-cols-2 gap-2 sm:flex lg:mt-14">
        <Button variant="primary" asChild className="justify-center">
          <SLink to="/gallery">
            Explore gallery
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

export function Footer() {
  return (
    <footer className="mx-auto mt-24 w-full max-w-[1280px] px-4 pb-10 sm:px-6">
      <div className="flex flex-col gap-8 rounded-sheet bg-surface p-pad shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="grid gap-4">
          <Wordmark height={24} />
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-body text-ink-muted">
            <SLink to="/gallery" className="hover:text-ink">
              Gallery
            </SLink>
            <SLink to="/examples/dashboard" className="hover:text-ink">
              Examples
            </SLink>
            <SLink to="/export" className="hover:text-ink">
              Export
            </SLink>
          </nav>
        </div>
        <div>
          <Button variant="primary" asChild>
            <SLink to="/gallery">
              Explore gallery
              <ArrowRight />
            </SLink>
          </Button>
        </div>
      </div>
      <p className="mt-6 px-1 text-small text-ink-muted">© 2026 Alora</p>
    </footer>
  );
}

export function Landing() {
  return (
    <main>
      <Hero />
      <Bento />
      <Footer />
    </main>
  );
}
