import * as React from "react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/ad";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "strong";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accent only for the primary or key action ("Add", "Save"). */
  variant?: ButtonVariant;
  size?: "default" | "sm";
  /** Square icon-only button. Give it an aria-label. */
  icon?: boolean;
  asChild?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-ink hover:bg-brand-hover focus-visible:bg-brand-hover",
  secondary: "bg-fill text-ink hover:bg-fill-strong focus-visible:bg-fill-strong data-[state=open]:bg-fill-strong",
  ghost: "bg-transparent text-ink hover:bg-fill focus-visible:bg-fill data-[state=open]:bg-fill",
  strong: "bg-on text-on-ink hover:bg-ink-muted focus-visible:bg-ink-muted",
};

export function buttonClass({ variant = "secondary", size = "default", icon = false }: Pick<ButtonProps, "variant" | "size" | "icon"> = {}) {
  return cn(
    "inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium text-body",
    "ad-press active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-[16px] [&_svg]:shrink-0",
    variants[variant],
    size === "sm" ? "h-item" : "h-control",
    icon ? (size === "sm" ? "w-item" : "w-control") : size === "sm" ? "px-2.5" : "px-3.5",
  );
}

export function Button({ variant, size, icon, asChild, className, type = "button", ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp type={asChild ? undefined : type} data-variant={variant ?? "secondary"} className={cn(buttonClass({ variant, size, icon }), className)} {...props} />;
}
