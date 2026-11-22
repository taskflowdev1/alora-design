// Demos for the installed-app (PWA) parts: the same scenes as the Mobile tab, each in its 390 × 844 phone.
import * as React from "react";
import { MobileStateButton, type MobileButtonState } from "@/components/mobile/mobile-state-button";
import { MobileScreen } from "@/components/mobile/mobile-nav-bar";
import type { InstallPlatform } from "@/components/mobile/mobile-install-prompt";
import type { Demo } from "./demos";
import { BadgeScene, InstallScene, PasskeyScene, PushScene, ScanScene, ShareScene, ShellScene, StackScene, SyncScene, UpdateScene, WakeScene } from "./mobile-pwa";

function StateButtonDemo() {
  const [state, setState] = React.useState<MobileButtonState>("idle");
  const timers = React.useRef<number[]>([]);
  React.useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  return (
    <MobileScreen title="Payout" bottomInset="none">
      <div className="grid px-pad pt-4">
        <MobileStateButton
          variant="primary"
          state={state}
          busyLabel="Sending"
          doneLabel="Sent"
          onClick={() => {
            setState("busy");
            timers.current.push(window.setTimeout(() => setState("done"), 1200), window.setTimeout(() => setState("idle"), 2800));
          }}
        >
          Send payout
        </MobileStateButton>
      </div>
    </MobileScreen>
  );
}

export const MOBILE_DEMOS_PWA: Record<string, Demo> = {
  "mobile-install-prompt": {
    stage: "phone",
    controls: [{ key: "platform", type: "select", label: "Phone", options: ["android", "ios"], labels: ["Android", "iPhone"], default: "android" }],
    render: (p) => <InstallScene key={String(p.platform)} platform={p.platform as InstallPlatform} />,
    usage: () => `const app = useInstallPrompt();

{!app.installed && (
  <MobileInstallSheet
    open={open}
    onOpenChange={setOpen}
    name="Rimba"
    icon={<AppIcon />}
    platform={app.platform}
    onInstall={app.install}
    onOpenApp={() => setOpen(false)}
  />
)}`,
  },
  "mobile-passkey": {
    stage: "phone",
    render: () => <PasskeyScene />,
    usage: () => `<MobilePasskeySheet
  open={open}
  onOpenChange={setOpen}
  name="Sari Wulandari"
  onAuthenticate={async () => {
    const credential = await navigator.credentials.get({ publicKey: await getOptions() });
    await verify(credential);
  }}
  onDone={enterApp}
  onUseCode={showCodeScreen}
/>`,
  },
  "mobile-push-ask": {
    stage: "phone",
    render: () => <PushScene />,
    usage: () => `const push = usePushPermission();

<MobilePushAsk
  status={push.status}
  onAllow={() => push.ask()} // straight from the tap
  onLater={hideUntilNextSuccess}
  onFix={showHowTo}
/>`,
  },
  "mobile-app-header": {
    stage: "phone",
    render: () => <ShellScene />,
    usage: () => `<MobileAppHeader title="Rimba Kemang" onPick={openShopList} back={goBack} trailing={<MobileSyncPill online={online} items={items} />} />`,
  },
  "mobile-app-badge": {
    stage: "phone",
    render: () => <BadgeScene />,
    usage: () => `useAppBadge(ordersToPack);

<MobileAppIcon label="Rimba" count={ordersToPack}>
  <AppIcon />
</MobileAppIcon>`,
  },
  "mobile-sync-status": {
    stage: "phone",
    controls: [{ key: "online", type: "toggle", label: "Online", default: false }],
    render: (p) => <SyncScene online={!!p.online} />,
    usage: () => `const online = useOnline();
const queue = useSyncQueue({ online, send: (item) => api.save(item) });

<MobileSyncPill online={online} items={queue.items} onClick={() => setOpen(true)} />
<MobileSyncSheet open={open} onOpenChange={setOpen} items={queue.items} onRetry={queue.retry} />`,
  },
  "mobile-update-toast": {
    stage: "phone",
    render: () => <UpdateScene />,
    usage: () => `const update = useAppUpdate();

<MobileUpdateToast open={update.ready && !later} busy={busy} onReload={() => (setBusy(true), update.reload())} onLater={() => setLater(true)} />

// In your service worker:
self.addEventListener("message", (e) => e.data?.type === "SKIP_WAITING" && self.skipWaiting());`,
  },
  "mobile-page-stack": {
    stage: "phone",
    render: () => <StackScene />,
    usage: () => `<MobilePageStack pages={stack.map((id) => ({ key: id, node: <Page id={id} /> }))} onBack={pop} />`,
  },
  "mobile-share": {
    stage: "phone",
    render: () => <ShareScene />,
    usage: () => `const data = { title: "Invoice RMB-24811", url };

<Button onClick={async () => (await shareNative(data)) === "fallback" && setOpen(true)}>Share invoice</Button>
<MobileShareSheet open={open} onOpenChange={setOpen} data={data} />`,
  },
  "mobile-camera": {
    stage: "phone",
    render: () => <ScanScene />,
    usage: () => `const cam = useCameraScan({ onCode: addToCount });

<Button onClick={cam.start}>Camera</Button>
<MobileScanner onScan={addToCount} camera={cam.status === "idle" ? undefined : cam.video} />`,
  },
  "mobile-wake-lock": {
    stage: "phone",
    render: () => <WakeScene />,
    usage: () => `const lock = useWakeLock();

{lock.supported && <MobileWakeLockRow checked={lock.on} onCheckedChange={lock.set} />}`,
  },
  "mobile-state-button": {
    stage: "phone",
    render: () => <StateButtonDemo />,
    usage: () => `<MobileStateButton variant="primary" state={state} busyLabel="Sending" doneLabel="Sent" onClick={send}>
  Send payout
</MobileStateButton>`,
  },
};
