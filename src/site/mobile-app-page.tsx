// /mobile/app: the example app full screen. On a phone it fills the screen (real safe areas, keyboard tracking); on a
// wider screen it sits in the phone frame with a way back.
import * as React from "react";
import { ChevronLeft } from "react-feather";
import { useSearchParams } from "react-router";
import { useKeyboardInset } from "@/components/mobile/mobile-action-bar";
import { OrdersApp } from "./mobile-app";
import { PhoneFrame } from "./phone";
import { ConfigTokens, SLink } from "./config";

function useNarrow() {
  const q = "(max-width: 600px)";
  const [narrow, setNarrow] = React.useState(() => matchMedia(q).matches);
  React.useEffect(() => {
    const m = matchMedia(q);
    const on = () => setNarrow(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return narrow;
}

export function MobileAppPage() {
  useKeyboardInset();
  const narrow = useNarrow();
  const [params] = useSearchParams();
  const at = params.get("at") ?? undefined;
  // Full screen on a phone: let the page run under the status bar and home indicator, then clear them with env().
  React.useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    const before = meta?.content;
    if (meta && before && !before.includes("viewport-fit")) meta.content = `${before}, viewport-fit=cover`;
    return () => {
      if (meta && before) meta.content = before;
    };
  }, []);
  return (
    <>
      <ConfigTokens />
      {narrow ? (
        <div data-mobile-app className="fixed inset-0 bg-page">
          <OrdersApp startAt={at} />
        </div>
      ) : (
        <main data-mobile-app className="grid min-h-dvh place-items-center gap-4 bg-page px-4 py-8">
          <div className="grid w-[390px] max-w-full gap-4">
            <SLink to="/mobile" className="inline-flex h-control w-fit items-center gap-1 rounded-control pl-1.5 pr-3 text-body text-ink transition-colors duration-[150ms] ease-ad hover:bg-fill">
              <ChevronLeft size={18} />
              Mobile components
            </SLink>
            <PhoneFrame>
              <OrdersApp startAt={at} />
            </PhoneFrame>
          </div>
        </main>
      )}
    </>
  );
}
