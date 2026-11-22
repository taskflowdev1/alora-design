// /mobile: the Mobile tab. The life of an installed web app, one real phone per moment, then the example app's screens.
import * as React from "react";
import { ArrowRight, Grid, RotateCcw } from "react-feather";
import { cn } from "@/lib/ad";
import { findItem, itemPath } from "@/lib/registry";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import type { InstallPlatform } from "@/components/mobile/mobile-install-prompt";
import { SLink } from "./config";
import { LazyPhone } from "./lazy-phone";
import { MobileOverview } from "./mobile-overview";
import { BadgeScene, InstallScene, KeyboardScene, PasskeyScene, PushScene, ScanScene, ShareScene, ShellScene, StackScene, SyncScene, UpdateScene, WakeScene } from "./mobile-pwa";

interface SceneState {
  platform: InstallPlatform;
  online: boolean;
  setKeyboard: (open: boolean) => void;
}

/** In the order an app meets them: installed, signed in, opened every day, offline, updated. */
const PIECES: { name: string; title: string; control?: "platform" | "online"; render: (s: SceneState) => React.ReactNode }[] = [
  { name: "mobile-install-prompt", title: "Install", control: "platform", render: (s) => <InstallScene platform={s.platform} /> },
  { name: "mobile-passkey", title: "Passkey", render: () => <PasskeyScene /> },
  { name: "mobile-push-ask", title: "Notifications", render: () => <PushScene /> },
  { name: "mobile-app-header", title: "App shell", render: () => <ShellScene /> },
  { name: "mobile-app-badge", title: "App badge", render: () => <BadgeScene /> },
  { name: "mobile-sync-status", title: "Offline queue", control: "online", render: (s) => <SyncScene online={s.online} /> },
  { name: "mobile-update-toast", title: "Update", render: () => <UpdateScene /> },
  { name: "mobile-page-stack", title: "Swipe back", render: () => <StackScene /> },
  { name: "mobile-action-bar", title: "Above the keyboard", render: (s) => <KeyboardScene onKeyboard={s.setKeyboard} /> },
  { name: "mobile-share", title: "Share", render: () => <ShareScene /> },
  { name: "mobile-camera", title: "Scan", render: () => <ScanScene /> },
  { name: "mobile-wake-lock", title: "Keep awake", render: () => <WakeScene /> },
];

function Piece({ piece }: { piece: (typeof PIECES)[number] }) {
  const [platform, setPlatform] = React.useState<InstallPlatform>("android");
  const [net, setNet] = React.useState<"online" | "offline">("offline");
  // The keyboard scene opens with the drawn keyboard up. A touch device has its own, so it never draws a second one.
  const opensKeyboard = piece.name === "mobile-action-bar";
  const [keyboard, setKeyboard] = React.useState(opensKeyboard);
  const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  const [run, setRun] = React.useState(0);
  const item = findItem(piece.name);
  return (
    <section data-pwa-piece={piece.name} aria-label={piece.title} className="grid min-w-0 content-start gap-4">
      <div className="mx-auto flex min-h-control w-full max-w-[390px] items-center gap-2">
        <h2 className="mr-auto truncate text-[24px] font-semibold leading-none tracking-[-0.02em] text-ink">
          {item ? (
            <SLink to={itemPath(item)} className="-mx-1 rounded-small px-1 transition-colors duration-[160ms] hover:text-ink-muted focus-visible:bg-fill">
              {piece.title}
            </SLink>
          ) : (
            piece.title
          )}
        </h2>
        {piece.control === "platform" ? (
          <Segmented<InstallPlatform> aria-label="Phone" value={platform} onValueChange={setPlatform} options={[{ value: "android", label: "Android" }, { value: "ios", label: "iPhone" }]} />
        ) : null}
        {piece.control === "online" ? (
          <Segmented<"online" | "offline"> aria-label="Connection" value={net} onValueChange={setNet} options={[{ value: "online", label: "Online" }, { value: "offline", label: "Offline" }]} />
        ) : null}
        <Button variant="ghost" icon aria-label={`Start ${piece.title} over`} onClick={() => (setRun((r) => r + 1), setKeyboard(opensKeyboard))}>
          <RotateCcw />
        </Button>
      </div>
      {/* Nothing inside a scene scrolls, so a wheel or a swipe over a phone moves the page. */}
      <LazyPhone key={run} keyboard={keyboard && !coarse} className="[&_[data-mobile-screen]]:overflow-hidden [&_[data-mobile-screen]]:overscroll-auto">
        {piece.render({ platform, online: net === "online", setKeyboard })}
      </LazyPhone>
    </section>
  );
}

export function MobilePage() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 pb-8 sm:px-6">
      <section className="pb-12 pt-8 lg:pb-20 lg:pt-14">
        <h1 className="-ml-[0.04em] max-w-[12ch] text-[length:clamp(56px,10vw,152px)] font-semibold leading-[0.9] tracking-[-0.05em] text-ink">for yal phone users</h1>
        <div className="mt-8 grid grid-cols-2 gap-2 sm:flex lg:mt-10">
          <Button variant="primary" asChild className="justify-center max-sm:h-touch">
            <SLink to="/mobile/app">
              Open the app
              <ArrowRight />
            </SLink>
          </Button>
          <Button variant="secondary" asChild className="justify-center max-sm:h-touch">
            <SLink to="/mobile/screens">
              <Grid />
              All screens
            </SLink>
          </Button>
        </div>
      </section>
      <div className={cn("grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2 xl:grid-cols-3 xl:pb-[72px]", "xl:[&>*:nth-child(3n+2)]:translate-y-[72px]")}>
        {PIECES.map((p) => (
          <Piece key={p.name} piece={p} />
        ))}
      </div>
      <h2 className="mb-6 mt-20 text-[length:clamp(28px,3.4vw,44px)] font-semibold leading-[1.05] tracking-[-0.03em] text-ink">Screens</h2>
      <MobileOverview />
    </main>
  );
}
