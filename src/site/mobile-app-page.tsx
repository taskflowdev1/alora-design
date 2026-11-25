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
  const at = query.get("at");
  const screen = path ?? (at ? "order" : "home");
  const state = query.get("state") ?? undefined;
  const params: Record<string, string> = {};
  query.forEach((v, k) => {
    if (!["state", "at", "keyboard", "t", "r", "c", "k", "p", "h", "a", "g", "sh", "f"].includes(k)) params[k] = v;
  });
  if (at === "actions") params.actions = "1";
  const app = <MobileApp key={screen} screen={screen} params={params} state={state} page />;
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
      <main data-mobile-app className={narrow ? "fixed inset-0 bg-page" : "grid min-h-dvh place-items-center gap-4 bg-page px-4 py-8"}>
        <div className={narrow ? "contents" : "grid w-[390px] max-w-full gap-4"}>
          {narrow ? null : (
            <SLink to="/mobile" className="inline-flex h-control w-fit items-center gap-1 rounded-control pl-1.5 pr-3 text-body text-ink transition-colors duration-[150ms] ease-ad hover:bg-fill focus-visible:bg-fill">
              <ChevronLeft size={18} />
              Mobile components
            </SLink>
          )}
          <PhoneFrame bare={narrow} keyboard={query.get("keyboard") === "1"} returnKey={RETURN_KEY[screen] ?? "return"}>
            {app}
          </PhoneFrame>
        </div>
      </main>
    </>
  );
}
