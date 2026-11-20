import { Image } from "react-feather";
import { cn } from "@/lib/ad";

/** Product or shop picture. Things are rounded squares; people are circles (Avatar). */
export function Thumb({ src, alt, size = 32, className }: { src?: string; alt: string; size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center overflow-hidden rounded-small bg-fill text-ink-muted group-hover/row:bg-fill-strong", className)}
      style={{ width: size, height: size }}
    >
      {src ? <img src={src} alt={alt} className="size-full object-cover" loading="lazy" decoding="sync" /> : <Image size={Math.round(size / 2)} aria-label={alt} />}
    </span>
  );
}
