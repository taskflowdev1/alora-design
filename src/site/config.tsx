import * as React from "react";
import { Link, useLocation, useNavigate, useSearchParams, type LinkProps } from "react-router";
import { inlineTokens, parseConfig, serializeConfig, type Config } from "@/lib/config";

export const shapedSupported = () => typeof CSS !== "undefined" && CSS.supports("corner-shape", "squircle");

export function applyTokens(el: HTMLElement, c: Config) {
  const root = el === document.documentElement;
  // A theme switch turns every transition off for a frame, so colours swap at once instead of fading one by one.
  const switching = root && el.style.colorScheme !== "" && el.style.colorScheme !== c.theme;
  if (switching) el.classList.add("ad-theme-switch");
  const map = inlineTokens(c, shapedSupported());
  for (const [k, v] of Object.entries(map)) el.style.setProperty(k, v);
  if (root) {
    el.classList.toggle("dark", c.theme === "dark");
    el.style.colorScheme = c.theme;
  }
  if (switching) {
    void getComputedStyle(el).backgroundColor;
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove("ad-theme-switch")));
  }
}

/**
 * A change not yet in the URL. The route re-renders on every URL change, which takes a while on a busy page, so a
 * control shows its new value (and the page its new tokens) from this draft at once; the URL catches up in the
 * router's transition, and the draft clears when it does.
 */
let draft: Config | null = null;
const listeners = new Set<() => void>();
const setDraft = (c: Config | null) => {
  draft = c;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => (listeners.add(l), () => void listeners.delete(l));
const getDraft = () => draft;

/** Global config lives in the URL query, so every link carries it. */
export function useConfig(): [Config, (patch: Partial<Config>) => void] {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const config = React.useMemo(() => parseConfig(params), [params]);
  const set = React.useCallback(
    (patch: Partial<Config>) => {
      const next = { ...(draft ?? config), ...patch };
      applyTokens(document.documentElement, next);
      setDraft(next);
      const q = serializeConfig(next);
      navigate({ pathname: location.pathname, search: q ? `?${q}` : "", hash: location.hash }, { replace: true, preventScrollReset: true });
    },
    [config, navigate, location.pathname, location.hash],
  );
  return [config, set];
}

/** useConfig for the controls that change it: the pending value first, so a segment or slider moves on the next frame. */
export function useLiveConfig(): [Config, (patch: Partial<Config>) => void] {
  const [config, set] = useConfig();
  const pending = React.useSyncExternalStore(subscribe, getDraft, getDraft);
  return [pending ?? config, set];
}

export function ConfigTokens() {
  const [config] = useConfig();
  React.useLayoutEffect(() => {
    // An older URL value can land while a newer change is pending: keep the newer one on screen.
    if (draft && serializeConfig(draft) === serializeConfig(config)) setDraft(null);
    applyTokens(document.documentElement, draft ?? config);
  }, [config]);
  return null;
}

/** Link that keeps the current settings. */
export function SLink({ to, ...props }: Omit<LinkProps, "to"> & { to: string }) {
  const [config] = useConfig();
  const q = serializeConfig(config);
  return <Link to={q ? `${to}?${q}` : to} {...props} />;
}

export function useHref(to: string) {
  const [config] = useConfig();
  const q = serializeConfig(config);
  return q ? `${to}?${q}` : to;
}

/** Scoped tokens for a preview: only this subtree takes the overrides. */
export function TokenScope({
  config,
  className,
  children,
  ...rest
}: {
  config: Config;
  className?: string;
  children: React.ReactNode;
  "data-stage"?: boolean;
}) {
  const style = React.useMemo(() => inlineTokens(config, shapedSupported()) as React.CSSProperties, [config]);
  return (
    <div style={style} className={className} {...rest}>
      {children}
    </div>
  );
}

