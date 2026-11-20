import * as React from "react";
import { Hash, Zap } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { MobileTextField } from "./mobile-text-field";

export interface MobileScannerProps {
  /** A code was read (from the camera or typed). */
  onScan: (code: string) => void;
  /**
   * The camera view. Leave it out for the built-in mock (a dark viewfinder with a barcode in it: tap the frame to read
   * it, which returns `mockCode()`); pass a <video> from getUserMedia in a real app.
   */
  camera?: React.ReactNode;
  /** The code the mock reads next. */
  mockCode?: () => string;
  /** Hold the scan line and ignore reads (while a sheet is open). */
  paused?: boolean;
  className?: string;
}

const BARS = [3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 1, 1, 3, 2, 1, 1, 2, 1, 3, 1, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1, 1, 3];

/**
 * Scanning stock on a phone: a dark camera view with a frame and a scan line that sweeps while it looks. A read flashes
 * the frame and the line stops for a beat, so each scan is felt. Typing the code is always one tap away under the view
 * (a damaged label, no camera, a dark shelf). The torch button lights the view. The line pauses off screen and holds
 * still for reduced motion.
 */
export function MobileScanner({ onScan, camera, mockCode = () => "8991234500017", paused, className }: MobileScannerProps) {
  const view = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(true);
  const [read, setRead] = React.useState(false);
  const [torch, setTorch] = React.useState(false);
  const [typing, setTyping] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");
  const timer = React.useRef(0);
  React.useEffect(() => {
    const el = view.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => (io.disconnect(), window.clearTimeout(timer.current));
  }, []);
  const hit = () => {
    if (paused || read) return;
    setRead(true);
    onScan(mockCode());
    timer.current = window.setTimeout(() => setRead(false), 700);
  };
  const submit = () => {
    const c = code.replace(/\s/g, "");
    if (!/^\d{8,14}$/.test(c)) return setError("8 to 14 digits");
    setError("");
    setCode("");
    onScan(c);
  };
  const running = visible && !paused && !read;
  return (
    <div className={cn("grid gap-3", className)}>
      <div ref={view} className={cn("ad-on-dark relative aspect-[4/3.6] overflow-hidden rounded-sheet bg-side text-side-ink transition-colors duration-[200ms] ease-ad", torch && "bg-side-raised")}>
        <style href="ad-scanner" precedence="default">{`@keyframes ad-scan { from { transform: translateY(0); } to { transform: translateY(var(--ad-scan-run)); } } @media (prefers-reduced-motion: reduce) { .ad-scan-line { animation: none !important; transform: translateY(calc(var(--ad-scan-run) / 2)) !important; } }`}</style>
        {camera ?? (
          // The mock scene: a parcel label with a barcode, slightly out of the frame's centre.
          <div aria-hidden className="absolute inset-0 grid place-items-center">
            <div className={cn("grid w-[62%] gap-2 rounded-control bg-side-fill p-3 transition-opacity duration-[200ms]", torch ? "opacity-100" : "opacity-70")}>
              <span className="h-2 w-2/3 rounded-full bg-side-fill-strong" />
              <span className="flex h-[64px] items-stretch gap-[2px] px-1">
                {BARS.map((w, i) => (
                  <span key={i} className={i % 2 ? "bg-transparent" : "bg-side-ink"} style={{ flex: w }} />
                ))}
              </span>
              <span className="text-center text-[11px] tracking-[0.2em] tabular-nums text-side-muted">8 991234 500017</span>
            </div>
          </div>
        )}
        {/* The frame: four rounded corners, nothing else. Tap inside it to read (the mock's camera). */}
        <button
          type="button"
          aria-label="Read the code in the frame"
          onClick={hit}
          className="group/frame absolute inset-[14%_10%] cursor-pointer outline-none [container-type:size] [-webkit-tap-highlight-color:transparent]"
        >
          {(["left-0 top-0", "right-0 top-0 rotate-90", "right-0 bottom-0 rotate-180", "left-0 bottom-0 -rotate-90"] as const).map((pos) => (
            <svg key={pos} aria-hidden width="30" height="30" viewBox="0 0 30 30" className={cn("absolute transition-transform duration-[200ms] ease-ad group-focus-visible/frame:scale-90", pos, read && "scale-90")}>
              <path d="M2 28 V14 Q2 2 14 2 H28" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
          ))}
          <span
            aria-hidden
            className="ad-scan-line absolute inset-x-[6%] top-[12%] h-[2px] rounded-full bg-side-ink [--ad-scan-run:76cqh]"
            style={{ animation: "ad-scan 1.6s ease-in-out infinite alternate", animationPlayState: running ? "running" : "paused", opacity: read ? 0 : 1 }}
          />
          <span aria-hidden className={cn("absolute inset-0 rounded-card bg-side-ink transition-opacity", read ? "opacity-25 duration-[60ms]" : "opacity-0 duration-[280ms]")} />
        </button>
        <button
          type="button"
          aria-label={torch ? "Torch off" : "Torch on"}
          aria-pressed={torch}
          onClick={() => setTorch(!torch)}
          className={cn(
            "absolute right-2 top-2 grid size-touch cursor-pointer place-items-center rounded-full transition-[background-color,transform] duration-[150ms] ease-ad active:scale-[0.92] [-webkit-tap-highlight-color:transparent]",
            torch ? "bg-side-ink text-side focus-visible:bg-side-muted" : "bg-side-fill text-side-ink focus-visible:bg-side-fill-strong",
          )}
        >
          <Zap size={20} strokeWidth={1.75} />
        </button>
      </div>
      {typing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <MobileTextField
            label="Barcode"
            value={code}
            onValueChange={(v) => (setCode(v), error && setError(""))}
            error={error}
            inputMode="numeric"
            enterKeyHint="done"
            placeholder="8991234500017"
            trailing={
              <button type="submit" className="h-touch shrink-0 cursor-pointer rounded-control px-3.5 text-[15px] font-semibold text-ink transition-[background-color,transform] duration-[150ms] ease-ad focus-visible:bg-fill-strong active:scale-[0.95] [-webkit-tap-highlight-color:transparent]">
                Add
              </button>
            }
          />
        </form>
      ) : (
        <Button className="h-touch w-full text-[15px]" onClick={() => setTyping(true)}>
          <Hash />
          Type the code
        </Button>
      )}
    </div>
  );
}
