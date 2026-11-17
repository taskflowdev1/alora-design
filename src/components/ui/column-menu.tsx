import { Columns } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover } from "@/components/ui/popover";

export interface ColumnDef {
  key: string;
  label: string;
  /** Always shown (the row's name, money-check columns). */
  locked?: boolean;
}

export interface ColumnMenuProps {
  columns: ColumnDef[];
  visible: string[];
  onVisibleChange: (keys: string[]) => void;
  /** What "Reset" goes back to. Defaults to every column. */
  defaults?: string[];
  className?: string;
}

/** Choose which table columns show. Locked columns stay on. The trigger says how many are shown. */
export function ColumnMenu({ columns, visible, onVisibleChange, defaults, className }: ColumnMenuProps) {
  const all = columns.map((c) => c.key);
  const reset = defaults ?? all;
  const shown = columns.filter((c) => c.locked || visible.includes(c.key)).length;
  const toggle = (k: string) => onVisibleChange(visible.includes(k) ? visible.filter((v) => v !== k) : [...visible, k]);
  return (
    <Popover
      align="end"
      className="w-60"
      trigger={
        <Button className={className}>
          <Columns />
          Columns
          <span className="tabular-nums text-ink-muted">
            {shown}/{columns.length}
          </span>
        </Button>
      }
    >
      <div className="grid gap-px">
        {columns.map((c) => (
          <label
            key={c.key}
            className={cn(
              "flex h-item select-none items-center gap-2.5 rounded-control px-2 text-body",
              c.locked ? "text-ink-muted" : "cursor-pointer hover:bg-fill",
            )}
          >
            <Checkbox checked={c.locked || visible.includes(c.key)} disabled={c.locked} onCheckedChange={() => toggle(c.key)} />
            <span className="min-w-0 flex-1 truncate">{c.label}</span>
          </label>
        ))}
      </div>
      <div className="mt-2 flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => onVisibleChange(all)}>
          Show all
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onVisibleChange(reset)}>
          Reset
        </Button>
      </div>
    </Popover>
  );
}
