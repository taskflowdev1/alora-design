// The pickers as they were at 4119f2e: the format picker was a ButtonGroup with a solid pill, the stock filter plain
// chips, each painting its own fill; there was no single-choice toggle group.
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Chip } from "@/components/ui/status";

type P = { value: string; onValueChange: (v: string) => void };

export function Format({ value, onValueChange }: P) {
  return (
    <ButtonGroup aria-label="Statement format">
      {["csv", "xlsx", "pdf"].map((f) => (
        <Button key={f} size="sm" onClick={() => onValueChange(f)} className={cn(value === f && "!bg-on !text-on-ink")}>
          {f.toUpperCase()}
        </Button>
      ))}
    </ButtonGroup>
  );
}

export function Stock({ value, onValueChange }: P) {
  return (
    <div className="flex gap-1">
      {[["all", "All"], ["low", "Low stock"], ["out", "Out of stock"]].map(([k, l]) => (
        <Chip key={k} selected={value === k} onClick={() => onValueChange(k)}>
          {l}
        </Chip>
      ))}
    </div>
  );
}

export function View(_: P) {
  return <span className="text-body text-ink-muted">Not available</span>;
}
