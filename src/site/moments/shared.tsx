import * as React from "react";
import { useSearchParams } from "react-router";

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
