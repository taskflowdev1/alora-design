import * as React from "react";
import { useSearchParams } from "react-router";

/* ------------------------------------------------------------ shared bits */

export type Market = "shopee" | "tiktok" | "offline";
export const marketOf = (shop: string): Market => (shop === "Shopee" ? "shopee" : shop === "TikTok Shop" ? "tiktok" : "offline");
export const shopName = (shop: string) => (shop === "Shopee" ? "Rimba Official" : shop === "TikTok Shop" ? "Rimba Live" : shop);

function useHeldLoading() {
  const [params] = useSearchParams();
  return params.get("loading") === "1";
}

/** A filter change swaps the content for its skeleton for a beat (taste: skeleton on every filter change). */
export function useBusy(ms = 420): [boolean, () => void] {
  const held = useHeldLoading();
  const [busy, setBusy] = React.useState(false);
  const timer = React.useRef<number>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const kick = React.useCallback(() => {
    setBusy(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setBusy(false), ms);
  }, [ms]);
  return [held || busy, kick];
}

/** Payout check per order: what the platform paid against what we expected. Mostly none. */
export const diffOf = (i: number) => [0, 0, -4000, 0, 0, 1500, 0, 0, -12000, 0, 0, 0][i % 12];
