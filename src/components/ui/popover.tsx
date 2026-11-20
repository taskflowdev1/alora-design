import * as React from "react";
import { Popover as P } from "radix-ui";
import { cn } from "@/lib/ad";
import { usePopupOpen } from "@/lib/ad-hooks";

const Group = React.createContext<{ open: string | null; setOpen: (id: string | null) => void } | null>(null);

/** Popovers inside one group never stack: opening one closes the other. Wrap a toolbar in it. */
export function PopoverGroup({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState<string | null>(null);
  const value = React.useMemo(() => ({ open, setOpen }), [open]);
  return <Group.Provider value={value}>{children}</Group.Provider>;
}

export interface PopoverProps {
  trigger: React.ReactElement;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  /** "dark" when opened from the dark sidebar. */
  tone?: "light" | "dark";
}

export function Popover({ trigger, children, align = "start", side = "bottom", open: openProp, onOpenChange, className, tone }: PopoverProps) {
  const id = React.useId();
  const group = React.useContext(Group);
  // A close within 300 ms of opening is the second click of a double click: ignored, so the panel stays open instead of
  // flashing. Escape closes at once. In a group the group holds the state.
  const [open, setOpen] = usePopupOpen({
    open: openProp ?? (group ? group.open === id : undefined),
    onOpenChange: (o) => {
      if (group) group.setOpen(o ? id : group.open === id ? null : group.open);
      onOpenChange?.(o);
    },
  });
  // Mouse: open (or close) on pointer down, like Menu and the pickers; touch and pen keep the click. The click that
  // follows is cancelled so Radix doesn't toggle it back.
  const pressed = React.useRef(false);
  const press = {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0 || e.ctrlKey) return;
      pressed.current = true;
      e.preventDefault();
      setOpen(!open);
    },
    onClick: (e: React.MouseEvent) => {
      if (!pressed.current) return;
      pressed.current = false;
      e.preventDefault();
    },
  };
  return (
    <P.Root open={open} onOpenChange={setOpen}>
      <P.Trigger asChild data-ad-anchor="" {...press}>
        {trigger}
      </P.Trigger>
      <P.Portal>
        <P.Content
          align={align}
          side={side}
          sideOffset={6}
          collisionPadding={8}
          onEscapeKeyDown={() => setOpen(false, true)}
          className={cn(
            "z-50 rounded-card bg-raised p-[calc(var(--ad-nest)*2)] text-ink shadow-raised",
            "origin-(--radix-popover-content-transform-origin) data-[state=open]:animate-[ad-in_220ms_var(--ad-ease)] data-[state=closed]:animate-[ad-out_180ms_var(--ad-ease)]",
            tone === "dark" && "ad-on-dark",
            className,
          )}
        >
          {children}
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}
