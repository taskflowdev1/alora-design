// The pickers after the sliding pill: Segmented for the format, ChipGroup for the filter, ToggleGroup type="single".
import { Segmented } from "@/components/ui/segmented";
import { Chip, ChipGroup } from "@/components/ui/status";
import { ToggleGroup } from "@/components/ui/toggle-group";

type P = { value: string; onValueChange: (v: string) => void };

export function Format({ value, onValueChange }: P) {
  return <Segmented aria-label="Statement format" value={value} onValueChange={onValueChange} options={["csv", "xlsx", "pdf"].map((f) => ({ value: f, label: f.toUpperCase() }))} />;
}

export function Stock({ value, onValueChange }: P) {
  return (
    <ChipGroup aria-label="Stock">
      {[["all", "All"], ["low", "Low stock"], ["out", "Out of stock"]].map(([k, l]) => (
        <Chip key={k} selected={value === k} onClick={() => onValueChange(k)}>
          {l}
        </Chip>
      ))}
    </ChipGroup>
  );
}

export function View({ value, onValueChange }: P) {
  return <ToggleGroup type="single" aria-label="View" value={value} onValueChange={onValueChange} options={[{ value: "list", label: "List" }, { value: "grid", label: "Grid" }, { value: "board", label: "Board" }]} />;
}
