import * as React from "react";
import { CreditCard, FileText, Home, Package, ShoppingBag, User, X } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

export type SourceKind = "order" | "product" | "shop" | "person" | "payout" | "report";

export interface SourceField {
  label: string;
  value: string;
}

export interface MessageSource {
  id: string;
  title: string;
  kind?: SourceKind;
  /** The record behind the chip. Without fields the chip is a plain label. */
  fields?: SourceField[];
}

export interface MessageSourcesProps {
  sources: MessageSource[];
  /** The open source; leave out to let the row hold its own. */
  openId?: string | null;
  onOpenChange?: (id: string | null) => void;
  className?: string;
}

const ICON: Record<SourceKind, React.ComponentType<{ size?: number | string; className?: string }>> = {
  order: ShoppingBag,
  product: Package,
  shop: Home,
  person: User,
  payout: CreditCard,
  report: FileText,
};

const CSS = `
.ad-src-pane { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows 220ms var(--ad-ease), opacity 180ms var(--ad-ease); }
.ad-src-pane[data-open] { grid-template-rows: 1fr; opacity: 1; }
.ad-src-pane > div { min-height: 0; overflow: hidden; }
@media (prefers-reduced-motion: reduce) { .ad-src-pane { transition: none; } }`;

/** A value with "Rp" as the small muted unit on its baseline. */
function Value({ v }: { v: string }) {
  const m = /^Rp\s?(.+)$/.exec(v);
  if (!m) return <>{v}</>;
  return (
    <>
      <span className="text-small text-ink-muted">Rp</span>
      {" "}
      {m[1]}
    </>
  );
}

/**
 * Where an answer came from: numbered chips under the reply. A chip opens its record in place, and the numbers match
 * the reply's citations. Escape or the close button folds it back and returns focus to the chip.
 */
export function MessageSources({ sources, openId, onOpenChange, className }: MessageSourcesProps) {
  const [own, setOwn] = React.useState<string | null>(null);
  const open = openId === undefined ? own : openId;
  const set = (id: string | null) => (openId === undefined ? setOwn(id) : onOpenChange?.(id));
  const current = sources.find((s) => s.id === open && s.fields?.length);
  // Keeps the last record drawn while the pane folds, so its text doesn't vanish before the height does.
  const [shown, setShown] = React.useState(current);
  if (current && current !== shown) setShown(current);
  const root = React.useRef<HTMLDivElement>(null);
  const paneRef = React.useRef<HTMLDivElement>(null);
  const openedId = current?.id;
  React.useEffect(() => {
    if (openedId) paneRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [openedId]);
  const close = () => {
    const back = root.current?.querySelector<HTMLElement>(`[data-source="${open}"]`);
    set(null);
    back?.focus({ preventScroll: true });
  };
  if (!sources.length) return null;
  return (
    <div
      ref={root}
      role="group"
      aria-label="Sources"
      className={cn("grid min-w-0 gap-1.5", className)}
      onKeyDown={(e) => {
        if (e.key === "Escape" && current) {
          e.stopPropagation();
          close();
        }
      }}
    >
      <style href="ad-message-sources" precedence="default">
        {CSS}
      </style>
      <div className="flex min-w-0 flex-wrap gap-1">
        {sources.map((s, i) => {
          const Icon = ICON[s.kind ?? "report"];
          const can = !!s.fields?.length;
          const on = open === s.id && can;
          const body = (
            <>
              <span className="tabular-nums text-ink-muted">{i + 1}</span>
              <Icon size={14} className="shrink-0 text-ink-muted" />
              <span translate="no" className="max-w-[180px] truncate">
                {s.title}
              </span>
            </>
          );
          const base = "inline-flex h-7 min-w-0 items-center gap-1.5 rounded-full px-bubble-sm text-small text-ink";
          return can ? (
            <button
              key={s.id}
              type="button"
              data-source={s.id}
              aria-expanded={on}
              onClick={() => set(on ? null : s.id)}
              className={cn(base, "ad-press cursor-pointer select-none hover:bg-fill-strong focus-visible:bg-fill-strong active:scale-[0.97]", on ? "bg-fill-strong" : "bg-fill")}
            >
              {body}
            </button>
          ) : (
            <span key={s.id} className={cn(base, "bg-fill")}>
              {body}
            </span>
          );
        })}
      </div>
      <div ref={paneRef} className="ad-src-pane" data-open={current ? "" : undefined} inert={!current || undefined}>
        <div>
          {shown ? (
            <section aria-label={`Source: ${shown.title}`} className="grid gap-1.5 rounded-card bg-fill p-3">
              <div className="flex min-h-item items-center justify-between gap-2">
                <h4 translate="no" className="m-0 min-w-0 truncate text-body font-semibold text-ink">
                  {shown.title}
                </h4>
                <Tooltip content="Close">
                  <Button variant="ghost" size="sm" icon aria-label="Close source" onClick={close} className="-me-1 hover:bg-fill-strong focus-visible:bg-fill-strong">
                    <X />
                  </Button>
                </Tooltip>
              </div>
              <dl className="m-0 grid grid-cols-[minmax(84px,auto)_minmax(0,1fr)] gap-x-4 gap-y-1 text-body">
                {shown.fields?.map((f) => (
                  <React.Fragment key={f.label}>
                    <dt className="text-ink-muted">{f.label}</dt>
                    <dd className="m-0 min-w-0 tabular-nums text-ink">
                      <Value v={f.value} />
                    </dd>
                  </React.Fragment>
                ))}
              </dl>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
