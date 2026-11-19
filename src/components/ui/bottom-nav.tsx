import * as React from "react";
import { cn } from "@/lib/ad";

/** Phone: bottom tabs with icon + label, floating with margin. Pair with one floating action button. */
export function BottomNav({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <nav className={cn("ad-on-dark fixed inset-x-3 bottom-3 z-40 flex items-stretch justify-around rounded-card bg-side p-nest shadow-dialog", className)}>
      {children}
    </nav>
  );
}

export function BottomNavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number | string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-w-14 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-control py-1.5 text-[11px] transition-[background-color,color,transform] duration-[150ms] ease-ad active:scale-[0.97]",
        active ? "bg-side-fill-strong text-side-ink" : "text-side-muted",
      )}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

/** The one main action on phone screens. Sits above the bottom tabs. */
export function Fab({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ size?: number | string }>; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="fixed bottom-[88px] right-4 z-40 grid size-12 cursor-pointer place-items-center rounded-card bg-brand text-brand-ink shadow-dialog transition-[transform,background-color] duration-[150ms] ease-ad hover:bg-brand-hover active:scale-[0.97]"
    >
      <Icon size={20} />
    </button>
  );
}
