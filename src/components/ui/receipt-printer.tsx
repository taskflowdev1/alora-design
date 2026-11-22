import * as React from "react";
import { cn, formatRp, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";

export interface ReceiptItem {
  id: string;
  name: string;
  qty: number;
  /** Price of one, in rupiah. */
  price: number;
}

const ITEMS: ReceiptItem[] = [
  { id: "gelas", name: "Gelas kopi tanah liat", qty: 2, price: 89000 },
  { id: "piring", name: "Piring saji terracotta", qty: 1, price: 145000 },
  { id: "teko", name: "Teko seduh 600 ml", qty: 1, price: 252000 },
];

const BODY_H = 68;
const PAPER_W = 264;
const STRIPS = 7;
const STRIP_H = 22;
const CURL_DEG = 13; // per strip at the tip; the strips add up to a soft roll
const STEP_PX = 7; // one motor step
const STEP_MS = 54;
const TEAR_DRAG = 84; // px of finger travel before the paper rips
const TUCK = 8; // the top of the paper stays this far inside the slot until it is torn

/*
 * The paper is one flat piece plus a chain of hinged strips at its leading edge. Each strip is a child of the one above
 * and turns a little more, so together they bend like a sheet; every strip shows its slice of the same ticket. All of
 * it moves through a few variables on the sheet (--feed, --pull, --sx, --rot, --curl).
 * The paper and thermal ink are the drawn object, the one place outside the grey ramp (grey-ok).
 */
const CSS = `
.ad-rp { --hum: 0px; }
.ad-rp-body { transform: translateX(var(--hum)); }
.ad-rp-feed {
  --feed: 0px; --pull: 0px; --sx: 0px; --rot: 0deg; --curl: 0deg; --curl-u: 0; --alpha: 0; --cast: 0;
  perspective: 720px; perspective-origin: 50% 12%; clip-path: inset(0 -72px -260px -72px); opacity: var(--alpha);
}
.ad-rp-sheet {
  transform: translate3d(var(--sx), calc(var(--feed) - 100% + var(--pull)), 0) rotate(var(--rot));
  transform-origin: 50% 100%; transform-style: preserve-3d; touch-action: pan-y;
  /* grey-ok: thermal paper and its faded ink, the same in both themes */
  --rp-paper: oklch(0.972 0.007 90); --rp-ink: oklch(0.29 0.012 70); --rp-soft: oklch(0.5 0.012 70);
  color: var(--rp-ink);
}
.ad-rp[data-phase="ready"] .ad-rp-sheet { cursor: grab; }
.ad-rp[data-held="true"] .ad-rp-sheet { cursor: grabbing; }
.ad-rp-soft { color: var(--rp-soft); }
.ad-rp-face { background: var(--rp-paper); position: relative; overflow: hidden; }
.ad-rp-flat { mask: conic-gradient(from 135deg at top, #0000, #000 1deg 89deg, #0000 90deg) 50% 0 / 11px 100%; }
.ad-rp-tip { mask: conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% 100% / 11px 100%; }
.ad-rp-strip { transform-origin: 50% 0; transform-style: preserve-3d; transform: rotateX(calc(var(--curl) * var(--k))); }
/* grey-ok: the shade the curl turns away from the light, continuous from one strip into the next */
.ad-rp-shade { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(to bottom in oklab, oklch(0.32 0.012 70 / calc(var(--curl-u) * var(--k0) * 0.34)), oklch(0.32 0.012 70 / calc(var(--curl-u) * var(--k) * 0.34))); }
.ad-rp-cast { transform: translateY(calc(var(--feed) - 100%)); opacity: var(--cast); }
@keyframes ad-rp-led { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.ad-rp[data-phase="printing"] .ad-rp-led { animation: ad-rp-led 420ms ease-in-out infinite; }`;

type Phase = "empty" | "printing" | "ready" | "torn";
type Mode = "empty" | "printing" | "ready" | "held" | "free" | "falling";

const smooth = (t: number) => {
  const k = Math.max(0, Math.min(1, t));
  return k * k * (3 - 2 * k);
};

function attachPrinter(root: HTMLElement, sheet: HTMLElement, body: HTMLElement, length: () => number, onPhase: (p: Phase) => void, onTorn: () => void) {
  let mode: Mode = "empty";
  let feed = 0, started = 0, pull = 0, pullV = 0, sx = 0, rot = 0, vx = 0, vr = 0, alpha = 0, hum = 0;
  let raf = 0, last = 0, onScreen = true;
  let touchY = 0;
  let grab: { id: number; x: number; y: number; base: number; lastY: number; lastT: number; speed: number } | null = null;
  const ac = new AbortController();
  const on = <K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void, passive = true) =>
    sheet.addEventListener(type, fn, { signal: ac.signal, passive });

  const paint = () => {
    const L = length();
    const u = smooth((feed / L - 0.3) / 0.7);
    const taut = mode === "held" ? Math.min(1, pull / (TEAR_DRAG * 0.5)) : 0;
    const relaxed = mode === "free" || mode === "falling" ? 0.5 : 1;
    const curl = u * (1 - 0.72 * taut) * relaxed;
    // On the feed box, so the sheet and the shadow under it read the same numbers.
    const s = (sheet.parentElement ?? sheet).style;
    s.setProperty("--cast", mode === "free" || mode === "falling" ? "0" : "1");
    s.setProperty("--feed", `${feed.toFixed(2)}px`);
    s.setProperty("--pull", `${pull.toFixed(2)}px`);
    s.setProperty("--sx", `${sx.toFixed(2)}px`);
    s.setProperty("--rot", `${rot.toFixed(3)}deg`);
    s.setProperty("--curl", `${(curl * CURL_DEG).toFixed(3)}deg`);
    s.setProperty("--curl-u", curl.toFixed(3));
    s.setProperty("--alpha", alpha.toFixed(3));
    root.style.setProperty("--hum", `${hum.toFixed(2)}px`);
  };

  const finishFall = () => {
    mode = "empty";
    feed = pull = pullV = sx = rot = vx = vr = 0;
    alpha = 0;
    paint();
    onPhase("empty");
    onTorn();
  };

  const frame = (t: number) => {
    raf = 0;
    const dt = Math.min(Math.max(t - last, 1) / 1000, 1 / 30);
    last = t;
    const L = length();
    let more = false;
    if (mode === "printing") {
      const el = t - started;
      const n = Math.floor(el / STEP_MS);
      const f = (el % STEP_MS) / STEP_MS;
      const k = Math.min(1, f / 0.58); // moves for just over half the step, then holds: that stop is the motor
      feed = Math.min(L, (n + (1 - (1 - k) * (1 - k))) * STEP_PX);
      hum = f < 0.58 ? Math.sin(el * 0.21) * 0.45 : 0;
      if (feed >= L) {
        feed = L;
        hum = 0;
        mode = "ready";
        onPhase("ready");
      } else more = true;
    } else if (mode === "ready") {
      pullV += (320 * -pull - 30 * pullV) * dt;
      pull += pullV * dt;
      sx += -sx * (1 - Math.exp(-dt * 16));
      rot += -rot * (1 - Math.exp(-dt * 16));
      if (Math.abs(pull) < 0.2 && Math.abs(pullV) < 2 && Math.abs(sx) < 0.1 && Math.abs(rot) < 0.02) pull = pullV = sx = rot = 0;
      else more = true;
    } else if (mode === "falling") {
      pullV += 1900 * dt;
      pull += pullV * dt;
      sx += vx * dt;
      rot += vr * dt;
      if (pull > 96) alpha = Math.max(0, alpha - dt * 6.5);
      if (alpha <= 0) finishFall();
      else more = true;
    }
    paint();
    if (more) raf = requestAnimationFrame(frame);
  };

  const kick = () => {
    if (raf || !onScreen) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const jolt = () => {
    if (!prefersReducedMotion()) body.animate([{ translate: "0 0" }, { translate: "0 -1.5px" }, { translate: "0 0" }], { duration: 180, easing: "ease-out" });
  };

  const print = () => {
    if (mode === "printing" || mode === "ready" || mode === "held" || mode === "free") return;
    feed = pull = pullV = sx = rot = vx = vr = 0;
    alpha = 1;
    if (prefersReducedMotion() || !onScreen) {
      feed = length();
      mode = "ready";
      paint();
      onPhase("ready");
      return;
    }
    mode = "printing";
    started = performance.now();
    onPhase("printing");
    kick();
  };

  const letGo = (speed: number, drift: number) => {
    mode = "falling";
    pullV = Math.max(160, speed);
    vx = drift;
    vr = (drift >= 0 ? 1 : -1) * (26 + Math.min(40, Math.abs(drift) * 0.12));
    root.dataset.held = "false";
    kick();
  };

  const tear = () => {
    if (mode !== "ready") return;
    onPhase("torn");
    if (prefersReducedMotion()) {
      finishFall();
      return;
    }
    jolt();
    letGo(300, 40);
  };

  on("pointerdown", (e) => {
    if (mode !== "ready" || (e.pointerType === "mouse" && e.button !== 0)) return;
    sheet.setPointerCapture(e.pointerId);
    cancelAnimationFrame(raf);
    raf = 0;
    grab = { id: e.pointerId, x: e.clientX, y: e.clientY, base: 0, lastY: e.clientY, lastT: e.timeStamp, speed: 0 };
    pullV = 0;
    mode = "held";
    root.dataset.held = "true";
  });
  on("pointermove", (e) => {
    if (grab?.id !== e.pointerId) return;
    const dx = e.clientX - grab.x;
    const dy = e.clientY - grab.y;
    const dt = Math.max(1, e.timeStamp - grab.lastT);
    grab.speed = grab.speed * 0.6 + ((e.clientY - grab.lastY) / dt) * 1000 * 0.4;
    grab.lastY = e.clientY;
    grab.lastT = e.timeStamp;
    if (mode === "held") {
      // Taut: the paper gives half as much as the finger moves, until it rips.
      pull = Math.max(0, dy) * 0.5;
      sx = dx * 0.08;
      rot = dx * 0.025;
      if (dy > TEAR_DRAG) {
        mode = "free";
        grab.base = pull - dy;
        onPhase("torn");
        jolt();
      }
    } else if (mode === "free") {
      pull = grab.base + dy;
      sx = dx * 0.6;
      rot = dx * 0.05;
    }
    paint();
  });
  const release = (e: PointerEvent) => {
    if (grab?.id !== e.pointerId) return;
    const { speed } = grab;
    const flick = mode === "held" && e.type === "pointerup" && speed > 900 && pull > 8;
    grab = null;
    root.dataset.held = "false";
    if (mode === "free") letGo(speed, sx * 1.4);
    else if (flick) {
      onPhase("torn");
      jolt();
      letGo(speed, sx * 1.4);
    } else if (mode === "held") {
      mode = "ready";
      kick();
    }
  };
  on("pointerup", release);
  on("pointercancel", release);
  // A downward pull belongs to the paper; an upward swipe still scrolls the page.
  on("touchstart", (e) => {
    touchY = e.touches[0]?.clientY ?? 0;
  });
  on(
    "touchmove",
    (e) => {
      if (mode === "free" || (mode === "held" && (e.touches[0]?.clientY ?? 0) >= touchY)) e.preventDefault();
    },
    false,
  );

  const io = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) {
        if (entry.intersectionRatio >= 0.35) root.dispatchEvent(new CustomEvent("ad-rp-seen"));
        return;
      }
      cancelAnimationFrame(raf);
      raf = 0;
      if (mode === "printing") {
        feed = length();
        hum = 0;
        mode = "ready";
        onPhase("ready");
      } else if (mode === "falling") finishFall();
      else if (mode === "ready") pull = pullV = sx = rot = 0;
      paint();
    },
    { threshold: [0, 0.35] },
  );
  io.observe(root);
  paint();

  return {
    print,
    tear,
    destroy: () => {
      ac.abort();
      io.disconnect();
      cancelAnimationFrame(raf);
    },
  };
}

/** A fixed pattern worked out from the code, so the same receipt always prints the same barcode. */
function barcode(code: string) {
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  let seed = 7;
  for (const ch of code + code) {
    seed = (seed * 31 + ch.charCodeAt(0)) % 9973;
    for (const bit of [seed % 3, (seed >> 2) % 3, (seed >> 4) % 3]) {
      const w = 1 + bit;
      bars.push({ x, w });
      x += w + 1 + ((seed >> bit) % 2);
    }
  }
  return { bars, width: x };
}

function Ticket({ shop, place, when, items, payment, code }: { shop: string; place: string; when: string; items: ReceiptItem[]; payment: string; code: string }) {
  const total = items.reduce((sum, i) => sum + i.qty * i.price, 0);
  const { bars, width } = barcode(code);
  return (
    <div className="grid gap-4 px-5 pb-7 pt-6 text-body tabular-nums">
      <div className="grid justify-items-center gap-0.5 text-center">
        <span translate="no" className="text-title font-semibold">{shop}</span>
        <span translate="no" className="ad-rp-soft text-small">{place}</span>
        <span className="ad-rp-soft text-small">{when}</span>
      </div>
      <div className="grid gap-2">
        {items.map((i) => (
          <div key={i.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3">
            <span translate="no" className="truncate">{i.name}</span>
            <span>{formatRp(i.qty * i.price)}</span>
            <span className="ad-rp-soft text-small">{i.qty} × {formatRp(i.price)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="ad-rp-soft">{payment}</span>
        <span className="text-heading font-semibold">{formatRp(total)}</span>
      </div>
      <div className="grid justify-items-center gap-1">
        <svg viewBox={`0 0 ${width} 34`} preserveAspectRatio="none" aria-hidden className="block h-[34px] w-full" fill="currentColor">
          {bars.map((b) => (
            <rect key={b.x} x={b.x} y={0} width={b.w} height={34} />
          ))}
        </svg>
        <span translate="no" className="ad-rp-soft text-small">{code}</span>
      </div>
    </div>
  );
}

/** The hinged strips, each the child of the one before it. */
function Strips({ ticket, start, index = 0 }: { ticket: React.ReactNode; start: number; index?: number }) {
  const last = index === STRIPS - 1;
  return (
    <div className="ad-rp-strip absolute inset-x-0" style={{ top: index === 0 ? start : STRIP_H, height: STRIP_H, "--k0": (index / STRIPS).toFixed(3), "--k": ((index + 1) / STRIPS).toFixed(3) } as React.CSSProperties}>
      {/* Each face runs a little under the next, so no hairline opens at the hinge when the paper bends. */}
      <div className={cn("ad-rp-face", last && "ad-rp-tip")} style={{ height: STRIP_H + (last ? 0 : 1.5) }}>
        <div style={{ transform: `translateY(${-(start + index * STRIP_H)}px)` }}>{ticket}</div>
        <div className="ad-rp-shade" />
      </div>
      {last ? null : <Strips ticket={ticket} start={start} index={index + 1} />}
    </div>
  );
}

export interface ReceiptPrinterProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  shop?: string;
  /** The line under the shop name. */
  place?: string;
  /** Printed as given. */
  when?: string;
  items?: ReceiptItem[];
  /** How it was paid, beside the total. */
  payment?: string;
  /** Printed under the barcode, and what the barcode is drawn from. */
  code?: string;
  /** Print once the first time it scrolls into view. */
  autoPrint?: boolean;
  onPrinted?: () => void;
  onTear?: () => void;
}

/**
 * A thermal printer. The receipt feeds out in small motor steps, its end curling under its own weight. Pull it down until
 * it rips, flick it, or use the button; then print another.
 */
export function ReceiptPrinter({
  shop = "Rimba Kemang",
  place = "Jl. Kemang Raya 12, Jakarta Selatan",
  when = "21 Nov 2026, 14.32",
  items = ITEMS,
  payment = "QRIS",
  code = "RK-20261121-0418",
  autoPrint = true,
  onPrinted,
  onTear,
  className,
  ...props
}: ReceiptPrinterProps) {
  const root = React.useRef<HTMLDivElement>(null);
  const sheet = React.useRef<HTMLDivElement>(null);
  const body = React.useRef<HTMLDivElement>(null);
  const measure = React.useRef<HTMLDivElement>(null);
  const api = React.useRef<ReturnType<typeof attachPrinter> | null>(null);
  const [length, setLength] = React.useState(372);
  const lengthRef = React.useRef(length);
  lengthRef.current = length;
  const [phase, setPhase] = React.useState<Phase>("empty");
  const printed = React.useRef(onPrinted);
  const torn = React.useRef(onTear);
  printed.current = onPrinted;
  torn.current = onTear;

  React.useLayoutEffect(() => {
    const el = measure.current;
    if (!el) return;
    const set = () => setLength(Math.ceil(el.offsetHeight));
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  React.useEffect(() => {
    if (!root.current || !sheet.current || !body.current) return;
    const printer = attachPrinter(
      root.current,
      sheet.current,
      body.current,
      () => lengthRef.current - TUCK,
      (p) => {
        setPhase(p);
        if (p === "ready") printed.current?.();
      },
      () => torn.current?.(),
    );
    api.current = printer;
    return () => {
      printer.destroy();
      api.current = null;
    };
  }, []);

  React.useEffect(() => {
    const el = root.current;
    if (!el || !autoPrint) return;
    let done = false;
    const seen = () => {
      if (done) return;
      done = true;
      api.current?.print();
    };
    el.addEventListener("ad-rp-seen", seen);
    return () => el.removeEventListener("ad-rp-seen", seen);
  }, [autoPrint]);

  const ticket = React.useMemo(() => <Ticket shop={shop} place={place} when={when} items={items} payment={payment} code={code} />, [shop, place, when, items, payment, code]);
  const flat = Math.max(0, length - STRIPS * STRIP_H);
  const total = items.reduce((sum, i) => sum + i.qty * i.price, 0);
  const at = phase === "printing" ? 1 : phase === "ready" ? 2 : 0;

  return (
    <div ref={root} data-phase={phase} className={cn("ad-rp relative mx-auto w-full max-w-[340px] select-none", className)} style={{ height: BODY_H + length + 36 }} {...props}>
      <style href="ad-receipt-printer" precedence="default">
        {CSS}
      </style>

      <div ref={measure} aria-hidden className="invisible absolute left-0 top-0" style={{ width: PAPER_W }}>
        {ticket}
      </div>

      <div className="ad-rp-feed absolute inset-x-0 bottom-0" style={{ top: BODY_H - 1 }}>
        <div className="ad-rp-cast pointer-events-none absolute left-1/2 top-0 rounded-small shadow-raised" style={{ width: PAPER_W, height: length, marginLeft: -PAPER_W / 2 }} />
        <div
          ref={sheet}
          role="img"
          aria-label={`Receipt from ${shop}, ${formatRp(total)}, paid with ${payment}`}
          className="ad-rp-sheet absolute left-1/2 top-0"
          style={{ width: PAPER_W, height: length, marginLeft: -PAPER_W / 2 }}
        >
          <div className="ad-rp-face ad-rp-flat" style={{ height: flat + 1.5 }} aria-hidden>
            {ticket}
          </div>
          {/* A direct child of the sheet: any plain wrapper here would flatten the 3D bend. */}
          <Strips ticket={ticket} start={flat} />
        </div>
      </div>

      <div ref={body} className="ad-rp-body ad-on-dark absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 rounded-card bg-side-raised pl-pad pr-3 shadow-raised" style={{ height: BODY_H }}>
        <span className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden className={cn("ad-rp-led size-[7px] shrink-0 rounded-full", phase === "printing" ? "bg-brand" : "bg-success")} />
          <span translate="no" className="truncate text-body font-medium text-side-ink">{shop}</span>
        </span>
        <Button variant={phase === "ready" ? "strong" : "primary"} disabled={phase === "printing" || phase === "torn"} onClick={() => (phase === "ready" ? api.current?.tear() : api.current?.print())}>
          <span className="inline-grid">
            {["Print", "Printing…", "Tear off"].map((t, i) => (
              <span key={t} aria-hidden={i !== at} className={cn("col-start-1 row-start-1 text-center", i !== at && "invisible")}>
                {t}
              </span>
            ))}
          </span>
        </Button>
        <span aria-hidden className="absolute bottom-0 left-1/2 h-[5px] -translate-x-1/2 rounded-t-small bg-side" style={{ width: PAPER_W + 14 }} />
      </div>
    </div>
  );
}
