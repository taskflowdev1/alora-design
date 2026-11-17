import * as React from "react";
import { Edit3, Maximize2, X } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";

/** The Alora mark: the "o" of the wordmark, a rounded tile cut by a wave (the site favicon). Fills with currentColor. */
export function AloraMark({ className }: { className?: string }) {
  return (
    <svg viewBox="-18 0 188 188" aria-hidden className={className}>
      <path fill="currentColor" fillRule="evenodd" d="M49.8 187.8C46.8 187.6 35.7 187.3 32.2 187.3C27.8 187.3 27.6 187.3 23.9 185.4C13.5 180.2 8.3 174.9 2.9 163.9C0.9 160 0.8 159.6 0.8 155.5C0.8 152.9 0.5 148.4 0.2 146.4C0 145.1 0 142.3 0 131.4C0 118 0 118 1.1 118C2.3 118 2.7 118.1 6 119.7C12.4 122.7 18.8 124.6 23.3 125C24.4 125.1 25.8 125.2 26.5 125.4C28.2 125.6 34.2 125.6 35.8 125.4C36.5 125.2 38.2 125.1 39.5 125C40.8 124.9 42.4 124.7 43.1 124.5C43.9 124.3 45 124.1 45.7 124C47 123.8 49.2 123.3 52.8 122.4C58.7 120.8 62.7 119.4 75.1 114.7C94.5 107.3 102 104.8 107.5 103.9C108.3 103.8 109.4 103.6 109.9 103.4C110.5 103.3 111.9 103.1 113.1 103C114.3 102.9 116.4 102.7 117.8 102.6C123 102 131.8 102.5 135.4 103.6C139.3 104.7 142.7 106.1 147.3 108.4C149.2 109.3 151 110.1 151.4 110.1C152 110.2 152 110.2 152 132C152 153.2 152 153.8 151.7 154.6C151.3 155.5 151 157.7 151 159C151 159.9 150 164.1 149.4 165.5C146.3 173.2 139 180.3 129.7 184.8C126.4 186.4 124.8 186.8 121.9 187C118.4 187.2 115.7 187.5 114.1 187.8C112.6 188 54.1 188.1 49.8 187.8ZM27.7 85.9C27.3 85.9 25.8 85.7 24.5 85.5C23.2 85.3 21.4 85.1 20.5 85C13.6 84.3 2.9 79.5 1.2 76.4C-0.1 73.9 -0 74.8 0.1 57.7C0.1 48.9 0.2 41.8 0.3 40.9C0.4 40.1 0.6 37.1 0.7 34.3C0.9 28.1 0.9 28.2 3.1 23.7C7.7 14.4 12.5 8.8 19.7 4.7C24.5 2 27.5 1.2 33.2 1C37.7 0.8 41.1 0.6 46.4 0.2C50.4 -0.1 82.4 -0 93.8 0.3C97.4 0.4 105.8 0.6 112.7 0.7C126.9 0.8 125.5 0.7 129.3 2.6C134.1 5 137 7.2 141.4 11.7C147.2 17.6 150.2 22.8 151.1 28.7C151.2 29.6 151.5 30.7 151.7 31.1C152 31.9 152 32.2 152 51.2C152 70.5 152 70.5 151.5 70.4C151.3 70.4 149.8 69.7 148.2 68.9C141.9 65.8 138.3 64.6 131.2 63.2C130.6 63.1 129.6 63 129 63C128.4 63 127 62.9 125.9 62.7C123.7 62.5 119.2 62.4 117.4 62.7C116.8 62.8 115 62.9 113.5 63C112 63.1 110.2 63.3 109.4 63.5C108.7 63.7 107.4 63.9 106.7 64C105.9 64.1 104.7 64.3 104.1 64.5C103.4 64.7 102.5 64.9 102 65C98 65.7 87.9 69.2 74.1 74.7C60.7 80 52.4 82.8 46.6 84C45.7 84.2 44.3 84.5 43.6 84.7C42.9 84.8 41.5 85 40.6 85.1C39.7 85.1 38 85.3 36.9 85.5C34.8 85.8 29.3 86.1 27.7 85.9Z" />
    </svg>
  );
}

export interface AssistantLauncherProps {
  /** The assistant's name, on the button and the panel, e.g. "Alora". */
  label?: string;
  /** Panel open. The button opens it and Close or Escape shut it; this sets where it starts. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Fixed to the page's bottom-right corner, over the content (the real use). Off: drawn in place. */
  floating?: boolean;
  /** Header actions. Each shows only when given. */
  onNewChat?: () => void;
  onExpand?: () => void;
  /** The mark on the button and the panel. Default: the Alora mark. */
  icon?: React.ReactNode;
  /** The chat inside the panel: thread and message box. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * The assistant's button and its small chat panel (Mayapada's Alora launcher). A round accent button bottom right;
 * it opens a panel in its place with the name, New chat, Expand and Close. Escape closes it unless a dialog above
 * already took the key. The panel stays mounted while closed, so the conversation is kept.
 */
export function AssistantLauncher({
  label = "Alora",
  open,
  onOpenChange,
  floating = false,
  onNewChat,
  onExpand,
  icon,
  children,
  className,
}: AssistantLauncherProps) {
  const [isOpen, setIsOpen] = React.useState(!!open);
  const [everOpened, setEverOpened] = React.useState(!!open);
  React.useEffect(() => {
    if (open === undefined) return;
    setIsOpen(open);
    if (open) setEverOpened(true);
  }, [open]);
  const set = React.useCallback(
    (next: boolean) => {
      setIsOpen(next);
      if (next) setEverOpened(true);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (!e.defaultPrevented && e.key === "Escape") set(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, set]);

  const place = floating ? "fixed bottom-5 right-5 z-40" : "relative";
  return (
    <div className={cn(!floating && "flex w-full justify-end", className)}>
      {isOpen ? null : (
        <button
          type="button"
          data-shape="round"
          aria-label={label}
          onClick={() => set(true)}
          className={cn(
            place,
            "inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-brand pl-4 pr-5 text-body font-semibold text-brand-ink shadow-raised",
            "transition-[background-color,transform] duration-[160ms] ease-ad hover:bg-brand-hover active:scale-[0.97] [&_svg]:size-5",
          )}
        >
          {icon ?? <AloraMark />}
          {label}
        </button>
      )}
      {everOpened ? (
        <section
          aria-label={`${label} assistant`}
          hidden={!isOpen}
          className={cn(
            place,
            "flex max-h-[min(36rem,calc(100dvh-2.5rem))] w-[min(26rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-sheet bg-surface text-ink shadow-dialog",
            isOpen && "animate-[ad-up_220ms_var(--ad-ease)]",
            !floating && "h-[min(30rem,70vh)]",
          )}
        >
          <header className="flex min-h-control shrink-0 items-center justify-between gap-2 px-4 pt-3">
            <span className="flex min-w-0 items-center gap-2 [&>svg]:size-[18px] [&>svg]:shrink-0 [&>svg]:text-brand">
              {icon ?? <AloraMark />}
              <span className="truncate text-body font-semibold">{label}</span>
            </span>
            <span className="flex items-center gap-0.5">
              {onNewChat ? (
                <Button variant="ghost" size="sm" icon aria-label="New chat" title="New chat" onClick={onNewChat}>
                  <Edit3 />
                </Button>
              ) : null}
              {onExpand ? (
                <Button variant="ghost" size="sm" icon aria-label="Expand" title="Expand" onClick={onExpand}>
                  <Maximize2 />
                </Button>
              ) : null}
              <Button variant="ghost" size="sm" icon aria-label="Close" title="Close" onClick={() => set(false)}>
                <X />
              </Button>
            </span>
          </header>
          <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2">{children}</div>
        </section>
      ) : null}
    </div>
  );
}
