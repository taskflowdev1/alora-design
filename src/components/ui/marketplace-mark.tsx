import { cn } from "@/lib/ad";

export type Market = "shopee" | "tiktok" | "tokopedia" | "offline";

const MARKS: Record<Market, { bg: string; label: string }> = {
  shopee: { bg: "#ee4d2d", label: "Shopee" },
  tiktok: { bg: "color-mix(in oklab, #111111, var(--ad-ink) 14%)", label: "TikTok Shop" },
  tokopedia: { bg: "#03ac0e", label: "Tokopedia" },
  offline: { bg: "var(--ad-fill-strong)", label: "Shop" },
};

/** Simplified marketplace marks: a rounded square in the market's colour with a white glyph. */
export function MarketMark({ market, size = 16, className }: { market: Market; size?: number; className?: string }) {
  const m = MARKS[market];
  return (
    <span
      role="img"
      aria-label={m.label}
      className={cn("inline-grid shrink-0 place-items-center rounded-[calc(var(--ad-radius-small)*0.8)]", className)}
      style={{ width: size, height: size, background: m.bg }}
    >
      <svg viewBox="0 0 16 16" width={size * 0.72} height={size * 0.72} fill="none" stroke="none" aria-hidden>
        {market === "shopee" ? (
          <>
            <path d="M3.2 5.4h9.6l-.7 7.4a1 1 0 0 1-1 .9H4.9a1 1 0 0 1-1-.9z" fill="#fff" />
            <path d="M5.6 5.6V4.8a2.4 2.4 0 0 1 4.8 0v.8" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M9.4 8.1c-.4-.4-.9-.5-1.4-.5-.7 0-1.2.4-1.2.9 0 1.2 2.6.7 2.6 2 0 .6-.6 1-1.4 1-.6 0-1.1-.2-1.5-.6" stroke={m.bg} strokeWidth="0.9" strokeLinecap="round" />
          </>
        ) : market === "tiktok" ? (
          <>
            <path d="M9.6 2.5v7.6a2.4 2.4 0 1 1-2.4-2.4" stroke="#25f4ee" strokeWidth="1.6" strokeLinecap="round" transform="translate(-0.6 -0.4)" />
            <path d="M9.6 2.5c.2 1.6 1.3 2.6 2.9 2.7" stroke="#25f4ee" strokeWidth="1.6" strokeLinecap="round" transform="translate(-0.6 -0.4)" />
            <path d="M9.6 2.5v7.6a2.4 2.4 0 1 1-2.4-2.4" stroke="#fe2c55" strokeWidth="1.6" strokeLinecap="round" transform="translate(0.5 0.4)" />
            <path d="M9.6 2.5c.2 1.6 1.3 2.6 2.9 2.7" stroke="#fe2c55" strokeWidth="1.6" strokeLinecap="round" transform="translate(0.5 0.4)" />
            <path d="M9.6 2.5v7.6a2.4 2.4 0 1 1-2.4-2.4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M9.6 2.5c.2 1.6 1.3 2.6 2.9 2.7" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          </>
        ) : market === "tokopedia" ? (
          <>
            <path d="M3 6h10v6.4a1.2 1.2 0 0 1-1.2 1.2H4.2A1.2 1.2 0 0 1 3 12.4z" fill="#fff" />
            <path d="M5.8 6V5a2.2 2.2 0 0 1 4.4 0v1" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="6.4" cy="9.4" r="1" fill={m.bg} />
            <circle cx="9.6" cy="9.4" r="1" fill={m.bg} />
          </>
        ) : (
          <path d="M3 7l5-4 5 4v6H3z" stroke="var(--ad-ink)" strokeWidth="1.4" strokeLinejoin="round" />
        )}
      </svg>
    </span>
  );
}

export const marketLabel = (m: Market) => MARKS[m].label;
