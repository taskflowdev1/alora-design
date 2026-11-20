// /mobile/app: the example app full screen. On a phone it fills the screen (real safe areas, keyboard tracking); on a
// wider screen it sits in the phone frame with a way back.
import * as React from "react";
import { ChevronLeft } from "react-feather";
import { useParams, useSearchParams } from "react-router";
import { useKeyboardInset } from "@/components/mobile/mobile-action-bar";
import { MobileApp } from "./mobile-app";
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

/** The drawn keyboard's return key, as the screen's focused field would set it (enterkeyhint). */
const RETURN_KEY: Record<string, "send" | "search"> = { chat: "send", assistant: "send", login: "send", search: "search", orders: "search", products: "search", customers: "search", pos: "search" };

export function MobileAppPage() {
  useKeyboardInset();
  const narrow = useNarrow();
  const { screen: path } = useParams();
  const [query] = useSearchParams();
  // /mobile/app/<screen>?state=…&id=…: the screen, a forced state, and the rest as the screen's params. The v1 links
  // (?at=detail, ?at=actions) open an order.
  const at = query.get("at");
  const screen = path ?? (at ? "order" : "home");
  const state = query.get("state") ?? undefined;
  const params: Record<string, string> = {};
  query.forEach((v, k) => {
    if (!["state", "at", "keyboard", "t", "r", "c", "k", "p", "h", "a", "g", "sh", "f"].includes(k)) params[k] = v;
  });
  if (at === "actions") params.actions = "1";
  // Keyed on the screen only: a theme or customise change rewrites the query, and must not reset the app's stack.
  const app = <MobileApp key={screen} screen={screen} params={params} state={state} page />;
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
          {app}
        </div>
      ) : (
        <main data-mobile-app className="grid min-h-dvh place-items-center gap-4 bg-page px-4 py-8">
          <div className="grid w-[390px] max-w-full gap-4">
            <SLink to="/mobile" className="inline-flex h-control w-fit items-center gap-1 rounded-control pl-1.5 pr-3 text-body text-ink transition-colors duration-[150ms] ease-ad hover:bg-fill focus-visible:bg-fill">
              <ChevronLeft size={18} />
              Mobile components
            </SLink>
            <PhoneFrame keyboard={query.get("keyboard") === "1"} returnKey={RETURN_KEY[screen] ?? "return"}>
              {app}
            </PhoneFrame>
          </div>
        </main>
      )}
    </>
  );
}
