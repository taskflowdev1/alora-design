import * as React from "react";
import { ChevronDown } from "react-feather";
import { cn } from "@/lib/ad";
import { Menu } from "@/components/ui/menu";

export interface SplitButtonProps {
  /** The main action. */
  children: React.ReactNode;
  onClick?: () => void;
  /** MenuItems for the other actions. */
  menu: React.ReactNode;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

const tone = {
  primary: { box: "bg-brand text-brand-ink", hover: "hover:bg-brand-hover focus-visible:bg-brand-hover data-[state=open]:bg-brand-hover" },
  secondary: { box: "bg-fill text-ink", hover: "hover:bg-fill-strong focus-visible:bg-fill-strong data-[state=open]:bg-fill-strong" },
};

/**
 * One shape, two targets: the main action and a chevron for the rest.
 * No line between them; each half lights up on its own hover.
 */
export function SplitButton({ children, onClick, menu, variant = "primary", disabled, className, ...aria }: SplitButtonProps) {
  const t = tone[variant];
  const half = cn(
    "inline-flex h-full cursor-pointer select-none items-center justify-center ad-press active:scale-[0.97] [&_svg]:size-[16px]",
    t.hover,
  );
  return (
    <div className={cn("inline-flex h-control shrink-0 rounded-control text-body font-medium", t.box, disabled && "pointer-events-none opacity-45", className)}>
      <button type="button" onClick={onClick} disabled={disabled} className={cn(half, "gap-2 rounded-l-control rounded-r-small pl-3.5 pr-3")}>
        {children}
      </button>
      <Menu
        align="end"
        trigger={
          <button type="button" aria-label={aria["aria-label"] ?? "More actions"} disabled={disabled} className={cn(half, "w-8 rounded-l-small rounded-r-control pr-0.5")}>
            <ChevronDown />
          </button>
        }
      >
        {menu}
      </Menu>
    </div>
  );
}
