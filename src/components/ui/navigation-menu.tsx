import * as React from "react";
import { NavigationMenu as N } from "radix-ui";
import { ChevronDown } from "react-feather";
import { cn } from "@/lib/ad";
import { buttonClass } from "@/components/ui/button";

export interface NavLinkDef {
  title: React.ReactNode;
  href?: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  /** One short line, only when the title needs it. */
  description?: React.ReactNode;
  active?: boolean;
  onSelect?: () => void;
}

export interface NavigationMenuItemDef {
  label: React.ReactNode;
  /** A plain link (no panel)… */
  href?: string;
  active?: boolean;
  onSelect?: () => void;
  /** …or a panel of links (opens on hover, click and keyboard). */
  links?: NavLinkDef[];
  /** Columns in the panel. */
  columns?: 1 | 2;
}

const trigger = cn(buttonClass({ variant: "ghost" }), "font-normal text-ink-muted hover:text-ink data-[state=open]:bg-fill data-[state=open]:text-ink data-[active]:bg-fill-strong data-[active]:text-ink");

/**
 * A site or app top nav whose items can open a panel of links. Icon + label in the panel, the active page as a
 * fill-strong row; the panel is one raised card that morphs between items instead of jumping. Hover menus also open
 * on click and keyboard.
 */
export function NavigationMenu({ items, className }: { items: NavigationMenuItemDef[]; className?: string }) {
  return (
    <N.Root className={cn("relative z-20", className)} delayDuration={80}>
      <N.List className="flex items-center gap-1">
        {items.map((it, i) => (
          <N.Item key={i}>
            {it.links ? (
              <>
                <N.Trigger className={cn(trigger, "gap-1.5")} data-active={it.active || undefined}>
                  {it.label}
                  <ChevronDown size={14} aria-hidden className="transition-transform duration-[220ms] ease-ad [[data-state=open]>&]:rotate-180" />
                </N.Trigger>
                <N.Content className="p-nest data-[motion^=from-]:animate-[ad-fade-in_200ms_var(--ad-ease)] data-[motion^=to-]:animate-[ad-fade-out_160ms_var(--ad-ease)]">
                  <ul className={cn("grid gap-px", it.columns === 2 ? "w-[min(480px,calc(100vw-32px))] sm:grid-cols-2" : "w-[min(260px,calc(100vw-32px))]")}>
                    {it.links.map((l, j) => (
                      <li key={j}>
                        <N.Link
                          href={l.href}
                          active={l.active}
                          onSelect={() => l.onSelect?.()}
                          className="flex min-h-item cursor-pointer select-none items-center gap-2.5 rounded-control px-2.5 py-1.5 text-body text-ink transition-colors duration-[160ms] ease-ad hover:bg-fill focus-visible:bg-fill data-[active]:bg-fill-strong"
                        >
                          {l.icon ? <l.icon size={16} className="shrink-0" /> : null}
                          <span className="grid min-w-0">
                            <span className="truncate">{l.title}</span>
                            {l.description ? <span className="truncate text-small text-ink-muted">{l.description}</span> : null}
                          </span>
                        </N.Link>
                      </li>
                    ))}
                  </ul>
                </N.Content>
              </>
            ) : (
              <N.Link href={it.href} active={it.active} onSelect={() => it.onSelect?.()} className={trigger}>
                {it.label}
              </N.Link>
            )}
          </N.Item>
        ))}
      </N.List>
      <div className="absolute left-0 top-full flex justify-start pt-1.5">
        <N.Viewport className="relative h-(--radix-navigation-menu-viewport-height) w-(--radix-navigation-menu-viewport-width) origin-top overflow-hidden rounded-card bg-raised text-ink shadow-raised transition-[width,height] duration-[220ms] ease-ad data-[state=open]:animate-[ad-in_220ms_var(--ad-ease)] data-[state=closed]:animate-[ad-out_180ms_var(--ad-ease)]" />
      </div>
    </N.Root>
  );
}
