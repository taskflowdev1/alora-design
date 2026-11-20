import { cn } from "@/lib/ad";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";

/**
 * Overlapping circles with "+n". Each circle is cut out by a ring in the surface colour
 * (a shadow, not a border), so it reads as a gap rather than a line. The overlap stays small
 * enough that the next circle never cuts into the initials.
 */
export function AvatarGroup({
  people,
  max = 4,
  size = "md",
  className,
}: {
  people: { name: string; src?: string }[];
  max?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  const ring = "shadow-[0_0_0_2px_var(--ad-surface)]";
  return (
    <span className={cn("inline-flex items-center", size === "sm" ? "-space-x-0.5" : "-space-x-1", className)}>
      {shown.map((p) => (
        <Tooltip key={p.name} content={p.name}>
          <span data-shape="round" className="rounded-full">
            <Avatar name={p.name} src={p.src} size={size} className={ring} />
          </span>
        </Tooltip>
      ))}
      {rest > 0 ? (
        <Tooltip content={people.slice(max).map((p) => p.name).join(", ")}>
          <span
            data-shape="round"
            className={cn(
              "inline-grid shrink-0 place-items-center rounded-full bg-fill font-medium tabular-nums text-ink-muted",
              size === "sm" ? "size-[24px] text-small" : "size-8 text-small",
              ring,
            )}
          >
            +{rest}
          </span>
        </Tooltip>
      ) : null}
    </span>
  );
}
