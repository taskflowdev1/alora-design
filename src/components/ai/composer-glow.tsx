import * as React from "react";
import { ArrowUp, Plus, Square } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

export interface ComposerGlowProps {
  children: React.ReactNode;
  /** The agent is working: a faster pulse and a band drifting through the aura. */
  working?: boolean;
  /** Pulse while idle (the new-chat screen). Off holds the glow still. */
  breathe?: boolean;
  /** How far the aura reaches, in px. */
  halo?: number;
  /** Aura strength at the top of its pulse, 0 to 1. */
  strength?: number;
  /** One idle pulse, in seconds; working runs at 0.6 of it. */
  pulse?: number;
  /** How bright the top of the ring is, 0 to 1. */
  ring?: number;
  /** Corner radius of the box inside; defaults to the Composer's. */
  radius?: string;
  className?: string;
}

/** The composer's inset: half the card padding, so it follows the padding setting. */
const COMPOSER_PAD = "calc(var(--ad-pad) / 2)";
/**
 * Button radius plus the inset, so the corners are concentric. The min() drops the inset when the button radius is 0
 * (square corners), so square stays square.
 */
export const COMPOSER_RADIUS = `calc(var(--ad-radius-control) + min(var(--ad-radius-control) * 99, ${COMPOSER_PAD}))`;

export interface ComposerProps {
  placeholder?: string;
  /** The agent is replying: with the box empty, send turns into stop. */
  working?: boolean;
  /** Controlled text; leave out to let the box hold its own. */
  value?: string;
  onValueChange?: (value: string) => void;
  /** Enter or the send button; the box clears itself when uncontrolled. Shift+Enter is a new line. */
  onSend?: (text: string) => void;
  onStop?: () => void;
  onAttach?: () => void;
  /** Send works with no text, because files are attached. */
  canSendEmpty?: boolean;
  /** Lines the text grows to before it scrolls. */
  maxLines?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * The message box, one row: attach | text | send (an agent assistant's composer). The buttons are the control height and
 * one line of text is padded to the same height, so the placeholder and both buttons share one centre. Longer text
 * grows the box upward and the buttons stay at the bottom, level with the last line; past `maxLines` it scrolls.
 * The inset is the same on every side and the radius is the button radius plus that inset.
 */
export function Composer({ placeholder = "Ask anything", working = false, value, onValueChange, onSend, onStop, onAttach, canSendEmpty = false, maxLines = 6, disabled, className }: ComposerProps) {
  const [own, setOwn] = React.useState("");
  const text = value ?? own;
  const set = (v: string) => (value === undefined ? setOwn(v) : onValueChange?.(v));
  const ref = React.useRef<HTMLTextAreaElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);
  const empty = !text.trim() && !canSendEmpty;
  const send = () => {
    if (empty || disabled) return;
    onSend?.(text);
    if (value === undefined) setOwn("");
  };
  const style = { "--composer-pad": COMPOSER_PAD, "--composer-line": "calc(var(--ad-text-body) * 1.45)", "--composer-lines": maxLines, borderRadius: COMPOSER_RADIUS } as React.CSSProperties;
  return (
    <form
      data-composer
      style={style}
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className={cn("flex items-end gap-1 bg-surface p-[var(--composer-pad)] shadow-card max-sm:[--composer-line:23px]", className)}
    >
      <Tooltip content="Attach files">
        {/* A disabled button gets no pointer events, so the tooltip hangs on this wrapper. */}
        <span className="inline-flex">
          <Button variant="ghost" icon aria-label="Attach files" disabled={disabled} onClick={onAttach} className="text-ink-muted hover:text-ink">
            <Plus />
          </Button>
        </span>
      </Tooltip>
      <textarea
        ref={ref}
        aria-label="Message"
        rows={1}
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => set(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
          e.preventDefault();
          send();
        }}
        className="block min-h-control min-w-0 flex-1 resize-none bg-transparent px-1.5 py-[calc((var(--ad-control-h)_-_var(--composer-line))_/_2)] text-body leading-[var(--composer-line)] text-ink outline-none placeholder:text-ink-muted max-sm:text-[16px] max-h-[calc(var(--composer-line)_*_var(--composer-lines)_+_var(--ad-control-h)_-_var(--composer-line))]"
      />
      {working && empty ? (
        <Tooltip content="Stop">
          <Button icon aria-label="Stop" onClick={onStop}>
            <Square />
          </Button>
        </Tooltip>
      ) : (
        // Send stays disabled while the box is empty; the tooltip says why.
        <Tooltip content={empty && !disabled ? "Type a message first" : "Send"}>
          <span className="inline-flex">
            <Button type="submit" variant="primary" icon aria-label="Send" disabled={empty || disabled}>
              <ArrowUp />
            </Button>
          </span>
        </Tooltip>
      )}
    </form>
  );
}

// Film grain as a mask: fractal noise drives the alpha between about 45% and 100%, so the aura reads as a glow with
// fine grain, not loose speckles.
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.05' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .6 0 0 0 .45'/%3E%3C/filter%3E%3Crect width='128' height='128' filter='url(%23g)'/%3E%3C/svg%3E")`;

const CSS = `
.ad-glow { position: relative; isolation: isolate; border-radius: var(--glow-r); --glow: var(--ad-brand); --glow-hot: color-mix(in oklab, var(--ad-brand) 62%, white); --glow-halo: color-mix(in srgb, var(--ad-brand) 56%, transparent); }
.ad-glow-fx { position: absolute; inset: 0; pointer-events: none; }
.ad-glow-halo { position: absolute; inset: calc(var(--halo) * -1.8); z-index: -1; opacity: var(--halo-hi); -webkit-mask-image: ${GRAIN}; -webkit-mask-size: 128px 128px; mask-image: ${GRAIN}; mask-size: 128px 128px; transition: opacity 400ms ease-out; }
.ad-glow-halo::before, .ad-glow-halo > span { content: ""; position: absolute; inset: calc(var(--halo) * 1.35); border-radius: calc(var(--glow-r) + var(--halo) * .45); filter: blur(calc(var(--halo) * .4)); }
.ad-glow-halo::before { background: var(--glow-halo); }
.ad-glow-halo > span { display: block; overflow: hidden; opacity: 0; transition: opacity 500ms ease-out; }
.ad-glow-halo > span::before { content: ""; position: absolute; inset: 0 auto 0 0; width: 200%; background: linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--glow) 70%, transparent) 12%, transparent 25% 50%, color-mix(in srgb, var(--glow) 70%, transparent) 62%, transparent 75% 100%); animation: ad-glow-drift 4s linear infinite paused; }
.ad-glow-ring { position: absolute; inset: 0; z-index: 1; border: 1px solid transparent; border-radius: var(--glow-r); background: linear-gradient(180deg, color-mix(in srgb, var(--glow-hot) var(--ring-top), transparent), color-mix(in srgb, var(--glow) 14%, transparent) 55%, color-mix(in srgb, var(--glow) 26%, transparent)) border-box; -webkit-mask: linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0) border-box; -webkit-mask-composite: xor; mask: linear-gradient(#000 0 0) padding-box exclude, linear-gradient(#000 0 0) border-box; }
.ad-glow[data-breathe] .ad-glow-halo { animation: ad-glow-breathe var(--pulse) ease-in-out infinite alternate; }
.ad-glow[data-working] .ad-glow-halo { animation: ad-glow-breathe calc(var(--pulse) * .6) ease-in-out infinite alternate; }
.ad-glow[data-working] .ad-glow-halo > span { opacity: 1; }
.ad-glow[data-working] .ad-glow-halo > span::before { animation-play-state: running; }
.ad-glow[data-offscreen] .ad-glow-halo, .ad-glow[data-offscreen] .ad-glow-halo > span::before { animation-play-state: paused; }
@keyframes ad-glow-breathe { from { opacity: var(--halo-lo); } to { opacity: var(--halo-hi); } }
@keyframes ad-glow-drift { to { translate: -50% 0; } }
@media (prefers-reduced-motion: reduce) {
  .ad-glow .ad-glow-halo { animation: none !important; opacity: var(--halo-hi) !important; }
  .ad-glow .ad-glow-halo > span, .ad-glow .ad-glow-halo > span::before { animation: none !important; opacity: 0 !important; }
  .ad-glow[data-working] { --ring-top: 80% !important; }
}`;

/**
 * The AI composer's glow (from an agent assistant): a soft grainy aura in the accent around the box, a ring lit from
 * the top on its edge, and a slow pulse. Wrap the message box with it. Only opacity and translate animate; it pauses
 * off screen, and reduced motion keeps the glow but stops the motion.
 */
export function ComposerGlow({ children, working = false, breathe = true, halo = 20, strength = 0.52, pulse = 3.6, ring = 0.48, radius = COMPOSER_RADIUS, className }: ComposerGlowProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => el.toggleAttribute("data-offscreen", !e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const hi = Math.min(1, working ? strength * 1.15 : strength);
  const style = {
    "--glow-r": radius,
    "--halo": `${halo}px`,
    "--halo-hi": hi,
    "--halo-lo": hi * 0.65,
    "--pulse": `${pulse}s`,
    "--ring-top": `${Math.round(ring * 100)}%`,
  } as React.CSSProperties;
  return (
    <div ref={ref} className={cn("ad-glow", className)} style={style} data-working={working ? "" : undefined} data-breathe={breathe && !working ? "" : undefined}>
      <style href="ad-composer-glow" precedence="default">
        {CSS}
      </style>
      <span className="ad-glow-fx" aria-hidden="true">
        <span className="ad-glow-halo">
          <span />
        </span>
        <span className="ad-glow-ring" />
      </span>
      {children}
    </div>
  );
}
