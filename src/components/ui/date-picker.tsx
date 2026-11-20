import * as React from "react";
import { Popover as P } from "radix-ui";
import { Calendar as CalendarIcon, ChevronDown } from "react-feather";
import { cn, formatDate, formatSmartDate } from "@/lib/ad";
import { usePopupOpen, usePressOpen } from "@/lib/ad-hooks";
import { Calendar } from "@/components/ui/calendar";
import { triggerClass } from "@/components/ui/select";

export interface DatePickerProps {
  value: Date | null;
  onValueChange: (date: Date) => void;
  placeholder?: string;
  /** "Today, Yesterday…" in the trigger where they apply. */
  smart?: boolean;
  /** Pin "today" (for demos and tests). */
  today?: Date;
  className?: string;
}

/** Dates read "7 Nov 2026" when shown and when chosen. Never 07/11/2026. The month grid is the Calendar. */
export function DatePicker({ value, onValueChange, placeholder = "Pick a date", smart = true, today = new Date(), className }: DatePickerProps) {
  // The trigger keeps the date it had when the panel opened until the panel has left, so a longer label can't grow
  // the trigger and drag the fading panel with it.
  const [held, setHeld] = React.useState<{ d: Date | null } | null>(null);
  const [open, setOpen] = usePopupOpen({ onOpenChange: (o) => o && setHeld({ d: value }) });
  const press = usePressOpen(open, setOpen);
  const shown = held ? held.d : value;
  return (
    <P.Root open={open} onOpenChange={setOpen}>
      <P.Trigger data-ad-anchor="" {...press} className={cn(triggerClass, className)}>
        <CalendarIcon size={16} className="shrink-0 text-ink-muted" />
        {shown ? <span className="truncate">{smart ? formatSmartDate(shown, today) : formatDate(shown)}</span> : <span className="text-ink-muted">{placeholder}</span>}
        <ChevronDown size={16} className="ml-auto shrink-0 text-ink-muted" />
      </P.Trigger>
      <P.Portal>
        <P.Content
          align="start"
          sideOffset={6}
          collisionPadding={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={() => setHeld(null)}
          className={cn(
            "z-50 rounded-card bg-raised p-nest text-ink shadow-raised",
            "origin-(--radix-popover-content-transform-origin) data-[state=open]:animate-[ad-in_220ms_var(--ad-ease)] data-[state=closed]:animate-[ad-out_180ms_var(--ad-ease)]",
          )}
        >
          <Calendar
            autoFocus
            value={value}
            today={today}
            onValueChange={(d) => {
              onValueChange(d);
              setOpen(false, true);
            }}
          />
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}
