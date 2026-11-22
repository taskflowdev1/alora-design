import * as React from "react";
import { Lock, Unlock } from "react-feather";
import { cn, prefersReducedMotion } from "@/lib/ad";

/** Between two characters settling, and how long each one scrambles before it does. */
const STEP = 34;
const SCRAMBLE = 200;
const GLYPH_MS = 48;
const GLYPHS = "0123456789#%&$@*+=?";
/** The cipher field behind the number: its cell in px and how often it changes. */
const FIELD_W = 10;
const FIELD_H = 15;
const FIELD_MS = 70;

const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

/*
 * The cipher field only exists under the pointer: a radial mask at --mx/--my over a canvas of glyphs. It repaints only
 * while hovered or held and on screen. Each character of the number sits in a fixed 1ch slot, so a scrambling symbol
 * can never change the row's width.
 */
const CSS = `
.ad-cipher { --mx: 50%; --my: 50%; --spot: 34cqw; container-type: inline-size; touch-action: pan-y; -webkit-touch-callout: none; }
.ad-cipher-field {
  opacity: 0; transition: opacity 220ms var(--ad-ease);
  mask-image: radial-gradient(circle var(--spot) at var(--mx) var(--my), #000 0%, rgb(0 0 0 / 0.5) 45%, transparent 100%);
}
.ad-cipher[data-near="true"] .ad-cipher-field { opacity: 0.3; }
.ad-cipher[data-held="true"] { --spot: 78cqw; }
.ad-cipher[data-held="true"] .ad-cipher-field { opacity: 0.38; }
.ad-cipher-slot { display: inline-block; width: 1ch; text-align: center; }
.ad-cipher-swap { transition: opacity 160ms var(--ad-ease), scale 160ms var(--ad-ease), filter 160ms var(--ad-ease); }
.ad-cipher-swap[data-on="false"] { opacity: 0; scale: 0.9; filter: blur(2px); }
@media (prefers-reduced-motion: reduce) {
  .ad-cipher-field { display: none; }
  .ad-cipher-swap { transition: none !important; }
}`;

const maskOf = (c: string) => (/\d/.test(c) ? "•" : c);

export interface SecureNumberRevealProps extends Omit<React.HTMLAttributes<HTMLButtonElement>, "children"> {
  /** The full card number, grouped as it should read. Its last four always show. */
  number?: string;
  holder?: string;
  /** Printed as given, `MM/YY`. */
  expiry?: string;
  cvv?: string;
  /** Called as the hold starts and ends. */
  onRevealChange?: (revealed: boolean) => void;
}

/**
 * A masked card number you hold to read. Holding (pointer, finger, Space or Enter) scrambles it into the real digits
 * left to right; letting go encrypts it back from the right, character by character. Nothing stays revealed.
 */
export function SecureNumberReveal({ number = "4556 7120 3398 4410", holder = "RIZKY HARTONO", expiry = "08/29", cvv = "382", onRevealChange, className, ...props }: SecureNumberRevealProps) {
  const root = React.useRef<HTMLButtonElement>(null);
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const slots = React.useRef<(HTMLSpanElement | null)[]>([]);
  const [held, setHeld] = React.useState(false);
  const [near, setNear] = React.useState(false);

  const digitsSeen = React.useMemo(() => number.replace(/\D/g, "").length, [number]);
  // The characters that hide: every digit but the last four, then the CVV.
  const secret = React.useMemo(() => {
    const out: { real: string; mask: string }[] = [];
    let seen = 0;
    for (const c of number) {
      if (!/\d/.test(c)) continue;
      seen++;
      if (seen <= digitsSeen - 4) out.push({ real: c, mask: "•" });
    }
    for (const c of cvv) out.push({ real: c, mask: "•" });
    return out;
  }, [number, cvv, digitsSeen]);

  const scramble = React.useRef({ raf: 0, target: false, at: [] as number[], from: [] as number[], shown: [] as string[], glyphT: 0 });

  React.useEffect(() => {
    const s = scramble.current;
    s.shown = secret.map((c) => c.mask);
    secret.forEach((c, i) => {
      const el = slots.current[i];
      if (el) el.textContent = c.mask;
    });
    return () => cancelAnimationFrame(s.raf);
  }, [secret]);

  const run = React.useCallback(
    (reveal: boolean) => {
      const s = scramble.current;
      s.target = reveal;
      cancelAnimationFrame(s.raf);
      const write = (i: number, c: string) => {
        if (s.shown[i] === c) return;
        s.shown[i] = c;
        const el = slots.current[i];
        if (el) el.textContent = c;
      };
      if (prefersReducedMotion()) {
        secret.forEach((c, i) => write(i, reveal ? c.real : c.mask));
        return;
      }
      const now = performance.now();
      const count = secret.length;
      // In from the left, back out from the right.
      s.from = secret.map((_, i) => now + (reveal ? i : count - 1 - i) * STEP);
      s.at = s.from.map((t) => t + SCRAMBLE);
      s.glyphT = 0;
      const frame = (t: number) => {
        const tick = t - s.glyphT >= GLYPH_MS;
        if (tick) s.glyphT = t;
        let busy = false;
        secret.forEach((c, i) => {
          const final = reveal ? c.real : c.mask;
          if (s.shown[i] === final && t >= s.at[i]) return;
          if (t >= s.at[i]) write(i, final);
          else {
            busy = true;
            if (t >= s.from[i] && tick) write(i, randomGlyph());
          }
        });
        if (busy) s.raf = requestAnimationFrame(frame);
      };
      s.raf = requestAnimationFrame(frame);
    },
    [secret],
  );

  // The cipher field: redrawn a few times a second, only while it can be seen.
  const active = near || held;
  React.useEffect(() => {
    const el = canvas.current;
    const host = root.current;
    if (!active || !el || !host || prefersReducedMotion()) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = 0;
    let onScreen = true;
    const style = getComputedStyle(host);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const size = () => {
      w = host.clientWidth;
      h = host.clientHeight;
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
    };
    size();
    const draw = (t: number) => {
      raf = onScreen ? requestAnimationFrame(draw) : 0;
      if (t - last < FIELD_MS) return;
      last = t;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = style.getPropertyValue("--ad-side-muted");
      ctx.font = `500 11px ${style.fontFamily}`;
      ctx.textAlign = "center";
      for (let y = FIELD_H - 3; y < h + FIELD_H; y += FIELD_H) {
        for (let x = FIELD_W / 2; x < w; x += FIELD_W) ctx.fillText(randomGlyph(), x, y);
      }
    };
    raf = requestAnimationFrame(draw);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      cancelAnimationFrame(raf);
      raf = onScreen ? requestAnimationFrame(draw) : 0;
    });
    io.observe(host);
    const ro = new ResizeObserver(size);
    ro.observe(host);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, [active]);

  const hold = (next: boolean) => {
    if (next === scramble.current.target) return;
    setHeld(next);
    run(next);
    onRevealChange?.(next);
  };

  const aim = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  const isHoldKey = (e: React.KeyboardEvent) => e.key === " " || e.key === "Enter";

  // Build the number row: each group is kept whole, the hidden digits go in the slots the scramble writes to.
  let slotIndex = 0;
  let digit = 0;
  const groups = number.split(" ").map((group) => ({
    id: group + digit,
    chars: [...group].map((c) => {
      if (!/\d/.test(c)) return { c, slot: -1 };
      digit++;
      return digit <= digitsSeen - 4 ? { c: maskOf(c), slot: slotIndex++ } : { c, slot: -1 };
    }),
  }));
  const cvvSlots = [...cvv].map(() => slotIndex++);

  return (
    <button
      ref={root}
      type="button"
      data-held={held}
      data-near={near}
      aria-pressed={held}
      aria-label={`Card number ending in ${number.slice(-4)}. Hold to reveal.`}
      translate="no"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setNear(true);
        aim(e);
      }}
      onPointerMove={aim}
      onPointerLeave={() => {
        setNear(false);
        hold(false);
      }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        aim(e);
        e.currentTarget.setPointerCapture(e.pointerId);
        hold(true);
      }}
      onPointerUp={() => hold(false)}
      onPointerCancel={() => hold(false)}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (!isHoldKey(e)) return;
        e.preventDefault();
        hold(true);
      }}
      onKeyUp={(e) => isHoldKey(e) && hold(false)}
      onBlur={() => hold(false)}
      className={cn(
        "ad-cipher ad-press relative block aspect-[85.6/53.98] w-[380px] max-w-full shrink-0 cursor-pointer select-none overflow-hidden rounded-card bg-side text-left text-side-ink shadow-raised hover:bg-side-raised focus-visible:bg-side-raised active:scale-[0.99]",
        className,
      )}
      {...props}
    >
      <style href="ad-secure-number-reveal" precedence="default">
        {CSS}
      </style>
      <canvas ref={canvas} aria-hidden className="ad-cipher-field pointer-events-none absolute inset-0 size-full" />
      <span className="relative grid h-full grid-rows-[auto_1fr_auto_auto] p-[6.4cqw]">
        <span className="flex items-center justify-between gap-3 text-[3.7cqw] font-medium leading-none">
          <span className="min-w-0 truncate">{holder}</span>
          <span className="grid justify-items-end text-side-muted">
            <span data-on={!held} className="ad-cipher-swap col-start-1 row-start-1 flex items-center gap-[1.6cqw] whitespace-nowrap">
              Hold to reveal
              <Lock size={16} strokeWidth={1.75} aria-hidden />
            </span>
            <span data-on={held} className="ad-cipher-swap col-start-1 row-start-1 flex items-center gap-[1.6cqw] whitespace-nowrap">
              Release to hide
              <Unlock size={16} strokeWidth={1.75} aria-hidden />
            </span>
          </span>
        </span>
        <span />
        <span aria-hidden className="flex justify-between whitespace-nowrap text-[6.1cqw] font-medium leading-none tabular-nums">
          {groups.map((g) => (
            <span key={g.id}>
              {g.chars.map((ch, i) =>
                ch.slot >= 0 ? (
                  <span
                    key={`s${ch.slot}`}
                    className="ad-cipher-slot"
                    ref={(el) => {
                      slots.current[ch.slot] = el;
                    }}
                  >
                    {ch.c}
                  </span>
                ) : (
                  <span key={`c${i}`} className="ad-cipher-slot">
                    {ch.c}
                  </span>
                ),
              )}
            </span>
          ))}
        </span>
        <span className="mt-[5cqw] flex items-end justify-between gap-[5cqw] text-[3.7cqw] font-medium leading-none tabular-nums">
          <span className="flex gap-[1.6cqw]">
            <span className="text-side-muted">Expires</span>
            {expiry}
          </span>
          <span className="flex gap-[1.6cqw]">
            <span className="text-side-muted">CVV</span>
            <span aria-hidden>
              {cvvSlots.map((s) => (
                <span
                  key={s}
                  className="ad-cipher-slot"
                  ref={(el) => {
                    slots.current[s] = el;
                  }}
                >
                  •
                </span>
              ))}
            </span>
          </span>
        </span>
      </span>
      <span role="status" className="sr-only">
        {held ? `${number}, CVV ${cvv}` : ""}
      </span>
    </button>
  );
}
