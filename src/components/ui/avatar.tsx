import { cn } from "@/lib/ad";

const sizes = { sm: "size-[24px] text-small", md: "size-8 text-small", lg: "size-10 text-body" };

/** People are always circles. The initials are trimmed to their cap height, so they sit in the true middle in any font. */
export function Avatar({ name, src, size = "md", className }: { name: string; src?: string; size?: keyof typeof sizes; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <span
      data-shape="round"
      className={cn("inline-grid shrink-0 select-none place-items-center overflow-hidden rounded-full bg-fill-strong font-medium text-ink", sizes[size], className)}
    >
      {src ? <img src={src} alt={name} className="size-full object-cover" /> : <span aria-label={name} className="leading-none [text-box:trim-both_cap_alphabetic]">{initials}</span>}
    </span>
  );
}
