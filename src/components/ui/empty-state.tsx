import { cn } from "@/lib/ad";

/** One big Feather icon and a short title. No sentence, no button. */
export function EmptyState({
  icon: Icon,
  title,
  className,
}: {
  icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties; className?: string }>;
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-10 text-center", className)}>
      <Icon size={40} style={{ strokeWidth: 1.5 }} className="text-ink-muted" />
      <p className="text-title font-medium text-ink-muted">{title}</p>
    </div>
  );
}
