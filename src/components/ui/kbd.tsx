import * as React from "react";
import { cn } from "@/lib/ad";

/** "⌘" on Apple devices, "Ctrl" elsewhere. */
export function modKey() {
  if (typeof navigator === "undefined") return "Ctrl";
  return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? "⌘" : "Ctrl";
}

/** One key: a small soft block, no border. */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-grid h-5 min-w-5 place-items-center rounded-small bg-fill px-1.5 font-sans text-small font-medium text-ink-muted tabular-nums",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

/** A shortcut such as ["mod", "K"]. "mod" becomes ⌘ or Ctrl. */
export function Shortcut({ keys, className }: { keys: string[]; className?: string }) {
  const [mod, setMod] = React.useState("Ctrl");
  React.useEffect(() => setMod(modKey()), []);
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-label={keys.map((k) => (k === "mod" ? mod : k)).join("+")}>
      {keys.map((k, i) => (
        <Kbd key={i}>{k === "mod" ? mod : k}</Kbd>
      ))}
    </span>
  );
}
