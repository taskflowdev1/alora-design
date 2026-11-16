import * as React from "react";
import { Link, useLocation, useNavigate, useSearchParams, type LinkProps } from "react-router";
import { DEFAULTS, inlineTokens, parseConfig, serializeConfig, type Config } from "@/lib/config";

export const shapedSupported = () => typeof CSS !== "undefined" && CSS.supports("corner-shape", "squircle");

export function applyTokens(el: HTMLElement, c: Config) {
  const map = inlineTokens(c, shapedSupported());
  for (const [k, v] of Object.entries(map)) el.style.setProperty(k, v);
  if (el === document.documentElement) {
    el.classList.toggle("dark", c.theme === "dark");
    el.style.colorScheme = c.theme;
  }
}

/** Global config lives in the URL query, so every link carries it. */
export function useConfig(): [Config, (patch: Partial<Config>) => void] {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const config = React.useMemo(() => parseConfig(params), [params]);
  const set = React.useCallback(
    (patch: Partial<Config>) => {
      const next = { ...config, ...patch };
      const q = serializeConfig(next);
      navigate({ pathname: location.pathname, search: q ? `?${q}` : "", hash: location.hash }, { replace: true, preventScrollReset: true });
    },
    [config, navigate, location.pathname, location.hash],
  );
  return [config, set];
}

export function ConfigTokens() {
  const [config] = useConfig();
  React.useLayoutEffect(() => applyTokens(document.documentElement, config), [config]);
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
export function TokenScope({ config, className, children }: { config: Config; className?: string; children: React.ReactNode }) {
  const style = React.useMemo(() => inlineTokens(config, shapedSupported()) as React.CSSProperties, [config]);
  return (
    <div style={style} className={className}>
      {children}
    </div>
  );
}

export { DEFAULTS };
