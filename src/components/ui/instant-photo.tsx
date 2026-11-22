import * as React from "react";
import { cn, prefersReducedMotion } from "@/lib/ad";
import { Tooltip } from "@/components/ui/tooltip";

export interface InstantPhotoShot {
  src: string;
  alt: string;
}

const CAMERA_H = 150;
const CAMERA_W = 284;
const PHOTO_TOP = 12; // room for the print's corners to swing without touching the camera
const PHOTO_W = 232;
const PHOTO_H = 282;
const REST_DEG = -1.6;
const DEVELOP_S = 11; // left alone
const EJECT_MS = 880;

/*
 * The print develops through three numbers on the photo: --d (the image gaining contrast and colour), --milk (the pale
 * coat clearing) and --blot (the uneven patches a real print has halfway). The print stock, emulsion and lens glass are
 * the drawn object, outside the grey ramp (grey-ok).
 */
const CSS = `
.ad-ip-out { clip-path: inset(0 -80px -90px -80px); }
.ad-ip-photo {
  --e: 0; --px: 0px; --py: 0px; --pr: ${REST_DEG}deg; --d: 0; --milk: 1; --blot: 0;
  transform: translate(var(--px), calc(var(--py) + (var(--e) - 1) * 104%)) rotate(var(--pr));
  transform-origin: 50% 12%; touch-action: pan-y; transition: scale 150ms var(--ad-ease);
  /* grey-ok: the print's white border */
  background: oklch(0.968 0.006 90);
}
.ad-ip-photo[data-held="true"] { scale: 0.985; cursor: grabbing; }
.ad-ip-image { filter: saturate(calc(var(--d) * 1.04)) contrast(calc(0.6 + var(--d) * 0.4)) brightness(calc(1.2 - var(--d) * 0.2)) sepia(calc((1 - var(--d)) * 0.55)); }
/* grey-ok: the undeveloped emulsion, a cool milky grey */
.ad-ip-milk { background: oklch(0.71 0.014 165); opacity: var(--milk); }
.ad-ip-blot {
  opacity: calc(var(--blot) * 0.5); mix-blend-mode: soft-light;
  /* grey-ok: uneven development */
  background: radial-gradient(60% 50% at 28% 30%, oklch(0.95 0.02 90), transparent), radial-gradient(55% 60% at 76% 70%, oklch(0.3 0.03 40), transparent);
}
/* grey-ok: the lens glass */
.ad-ip-glass { background: radial-gradient(circle at 36% 32%, oklch(0.62 0.05 250) 0, oklch(0.26 0.04 265) 34%, oklch(0.13 0.02 270) 72%); }
.ad-ip-flash { opacity: 0; background: radial-gradient(circle at 50% 42%, oklch(0.99 0.01 95), transparent 68%); } /* grey-ok: light */`;

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

type Phase = "empty" | "out" | "developing" | "done";

function attachPhoto(root: HTMLElement, photo: HTMLElement, flash: HTMLElement, onPhase: (p: Phase) => void, onSwap: () => void) {
  let phase: Phase = "empty";
  let eject = 0, ejectAt = 0, dev = 0, energy = 0;
  let x = 0, y = 0, r = REST_DEG, vx = 0, vy = 0, vr = 0;
  let raf = 0, last = 0, onScreen = true, leaving: Animation | null = null;
  let grab: { id: number; sx: number; sy: number; ox: number; oy: number; px: number; py: number; moved: boolean } | null = null;
  const ac = new AbortController();
  const on = <K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void) => photo.addEventListener(type, fn, { signal: ac.signal });

  const paint = () => {
    const d = dev * dev * (3 - 2 * dev);
    const s = photo.style;
    s.setProperty("--e", eject.toFixed(4));
    s.setProperty("--px", `${x.toFixed(2)}px`);
    s.setProperty("--py", `${y.toFixed(2)}px`);
    s.setProperty("--pr", `${r.toFixed(3)}deg`);
    s.setProperty("--d", d.toFixed(4));
    s.setProperty("--milk", Math.pow(1 - d, 1.5).toFixed(4));
    s.setProperty("--blot", (4 * d * (1 - d)).toFixed(4));
  };

  const set = (p: Phase) => {
    phase = p;
    onPhase(p);
  };

  const frame = (t: number) => {
    raf = 0;
    const elapsed = Math.min(Math.max(t - last, 1) / 1000, 0.25); // developing keeps real time on a slow device
    const dt = Math.min(elapsed, 1 / 30);
    last = t;
    let more = false;

    if (phase === "out") {
      const k = Math.min(1, (t - ejectAt) / EJECT_MS);
      // Rollers: a fast start that eases out, with a faint shudder from the gears.
      const base = 1 - Math.pow(1 - k, 2.4);
      eject = Math.min(1, base + Math.sin(base * Math.PI * 12) * 0.006 * (1 - k));
      if (k >= 1) {
        eject = 1;
        set("developing");
      }
      more = true;
    }
    if (phase === "developing") {
      energy *= Math.exp(-elapsed / 0.55);
      dev = Math.min(1, dev + (elapsed / DEVELOP_S) * (1 + 11 * Math.min(1, energy)));
      if (dev >= 1) {
        dev = 1;
        set("done");
      } else more = true;
    }
    if (!grab) {
      vx += (240 * -x - 25 * vx) * dt;
      vy += (240 * -y - 25 * vy) * dt;
      vr += (240 * (REST_DEG - r) - 22 * vr) * dt;
      x += vx * dt;
      y += vy * dt;
      r += vr * dt;
      if (Math.abs(x) < 0.05 && Math.abs(y) < 0.05 && Math.abs(r - REST_DEG) < 0.01 && Math.abs(vx) < 0.5 && Math.abs(vy) < 0.5 && Math.abs(vr) < 0.1) {
        x = y = vx = vy = vr = 0;
        r = REST_DEG;
      } else more = true;
    } else if (phase === "developing") more = true;
    paint();
    if (more) raf = requestAnimationFrame(frame);
  };

  const kick = () => {
    if (raf || !onScreen) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const bump = (dir: number) => {
    if (phase === "empty" || phase === "out") return;
    energy = Math.min(1.5, energy + 0.34);
    vx += 240 * dir;
    vr += 40 * dir;
    kick();
  };

  const eject_ = () => {
    onSwap();
    dev = energy = 0;
    x = y = vx = vy = vr = 0;
    r = REST_DEG;
    photo.style.opacity = "";
    if (prefersReducedMotion() || !onScreen) {
      eject = 1;
      dev = 1;
      paint();
      set("done");
      return;
    }
    eject = 0;
    ejectAt = performance.now();
    set("out");
    kick();
  };

  const shoot = () => {
    if (phase === "out" || leaving) return;
    if (!prefersReducedMotion()) flash.animate([{ opacity: 0 }, { opacity: 0.95, offset: 0.18 }, { opacity: 0 }], { duration: 260, easing: "ease-out" });
    if (phase === "empty" || prefersReducedMotion()) {
      eject_();
      return;
    }
    // The last print slides away the way it was going before the next comes out.
    leaving = photo.animate([{ opacity: 1, translate: "0 0" }, { opacity: 0, translate: "0 22px" }], { duration: 180, easing: "ease-out", fill: "forwards" });
    leaving.onfinish = () => {
      leaving?.cancel();
      leaving = null;
      eject = 0;
      paint();
      eject_();
    };
  };

  on("pointerdown", (e) => {
    if ((phase !== "developing" && phase !== "done") || (e.pointerType === "mouse" && e.button !== 0)) return;
    photo.setPointerCapture(e.pointerId);
    grab = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: x, oy: y, px: e.clientX, py: e.clientY, moved: false };
    photo.dataset.held = "true";
    vx = vy = vr = 0;
    kick();
  });
  on("pointermove", (e) => {
    if (grab?.id !== e.pointerId) return;
    const dx = e.clientX - grab.sx;
    const dy = e.clientY - grab.sy;
    if (!grab.moved && Math.hypot(dx, dy) < 4) return;
    grab.moved = true;
    const nx = clamp(grab.ox + dx, -46, 46);
    const ny = clamp(grab.oy + dy, -14, 26);
    const step = Math.hypot(e.clientX - grab.px, e.clientY - grab.py);
    grab.px = e.clientX;
    grab.py = e.clientY;
    energy = Math.min(1.5, energy + step / 340);
    r = REST_DEG + nx * 0.07;
    x = nx;
    y = ny;
    paint();
    kick();
  });
  const release = (e: PointerEvent) => {
    if (grab?.id !== e.pointerId) return;
    const tapped = !grab.moved && e.type === "pointerup";
    grab = null;
    photo.dataset.held = "false";
    if (tapped) bump(Math.random() < 0.5 ? -1 : 1);
    kick();
  };
  on("pointerup", release);
  on("pointercancel", release);
  on("keydown", (e) => {
    const dir = { ArrowLeft: -1, ArrowRight: 1, Enter: 1, " ": -1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    bump(dir);
  });

  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) kick();
    else {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  io.observe(root);
  paint();

  return {
    shoot,
    destroy: () => {
      ac.abort();
      io.disconnect();
      cancelAnimationFrame(raf);
      leaving?.cancel();
    },
  };
}

export interface InstantPhotoProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The shots it takes, in turn. Square crops read best. */
  photos: InstantPhotoShot[];
  /** A print finished developing. */
  onDeveloped?: (shot: InstantPhotoShot) => void;
}

/**
 * An instant camera. The shutter slides a blank print out, and it develops from pale grey to full colour on its own;
 * shake it (drag it around, tap it, or press the arrow keys) and it develops faster.
 */
export function InstantPhoto({ photos, onDeveloped, className, ...props }: InstantPhotoProps) {
  const root = React.useRef<HTMLDivElement>(null);
  const photo = React.useRef<HTMLDivElement>(null);
  const flash = React.useRef<HTMLDivElement>(null);
  const api = React.useRef<ReturnType<typeof attachPhoto> | null>(null);
  const shots = React.useRef(photos);
  shots.current = photos;
  const nextIndex = React.useRef(0);
  const shown = React.useRef(0);
  const developed = React.useRef(onDeveloped);
  developed.current = onDeveloped;
  const [index, setIndex] = React.useState(0);
  const [phase, setPhase] = React.useState<Phase>("empty");

  React.useEffect(() => {
    for (const p of photos) new Image().src = p.src;
  }, [photos]);

  React.useEffect(() => {
    if (!root.current || !photo.current || !flash.current) return;
    const camera = attachPhoto(
      root.current,
      photo.current,
      flash.current,
      (p) => {
        setPhase(p);
        if (p === "done") developed.current?.(shots.current[shown.current]);
      },
      () => {
        const n = shots.current.length || 1;
        shown.current = nextIndex.current % n;
        nextIndex.current = shown.current + 1;
        setIndex(shown.current);
      },
    );
    api.current = camera;
    return () => {
      camera.destroy();
      api.current = null;
    };
  }, []);

  const shot = photos[index] ?? photos[0];
  const out = phase !== "empty";

  return (
    <div ref={root} className={cn("ad-ip relative mx-auto w-full max-w-[340px] select-none", className)} style={{ height: CAMERA_H + PHOTO_TOP + PHOTO_H + 26 }} {...props}>
      <style href="ad-instant-photo" precedence="default">
        {CSS}
      </style>

      <div className="ad-ip-out absolute inset-x-0 bottom-0" style={{ top: CAMERA_H - 2 }}>
        <div
          ref={photo}
          role="button"
          tabIndex={phase === "developing" || phase === "done" ? 0 : -1}
          aria-label={phase === "developing" ? `${shot?.alt ?? "Photo"}, developing. Shake it` : (shot?.alt ?? "Photo")}
          aria-hidden={!out || undefined}
          className={cn(
            "ad-ip-photo absolute left-1/2 rounded-small p-[13px] pb-[43px] shadow-raised focus-visible:shadow-dialog",
            (phase === "developing" || phase === "done") && "cursor-grab",
          )}
          style={{ top: PHOTO_TOP, width: PHOTO_W, height: PHOTO_H, marginLeft: -PHOTO_W / 2 }}
        >
          <div className="relative size-full overflow-hidden rounded-small">
            {shot ? <img src={shot.src} alt="" draggable={false} className="ad-ip-image size-full object-cover" /> : null}
            <div className="ad-ip-milk absolute inset-0" />
            <div className="ad-ip-blot absolute inset-0" />
          </div>
        </div>
      </div>

      <div className="ad-on-dark absolute left-1/2 top-0 z-10 -translate-x-1/2 overflow-hidden rounded-card bg-side-raised shadow-raised" style={{ width: CAMERA_W, height: CAMERA_H }}>
        <div className="relative flex h-full items-center justify-between px-pad">
          <div aria-hidden className="grid justify-items-start gap-2">
            <span className="block h-[24px] w-[42px] rounded-small bg-side-fill-strong" />
            <span className="block size-[14px] rounded-small bg-side" />
          </div>
          <div aria-hidden className="absolute left-1/2 top-1/2 grid size-[92px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-side">
            <span className="grid size-[70px] place-items-center rounded-full bg-side-fill">
              <span className="ad-ip-glass block size-[50px] rounded-full" />
            </span>
          </div>
          <Tooltip content={phase === "empty" ? "Take a photo" : "Take another"}>
            <button
              type="button"
              aria-label={phase === "empty" ? "Take a photo" : "Take another"}
              disabled={phase === "out"}
              onClick={() => api.current?.shoot()}
              className="ad-press relative grid size-[44px] cursor-pointer place-items-center rounded-full bg-brand hover:bg-brand-hover focus-visible:bg-brand-hover active:scale-[0.93] disabled:cursor-default disabled:opacity-60"
            >
              <span aria-hidden className="block size-[26px] rounded-full bg-brand-hover" />
            </button>
          </Tooltip>
        </div>
        <div ref={flash} aria-hidden className="ad-ip-flash pointer-events-none absolute inset-0" />
        <span aria-hidden className="absolute bottom-0 left-1/2 h-[5px] -translate-x-1/2 rounded-t-small bg-side" style={{ width: PHOTO_W + 14 }} />
      </div>
    </div>
  );
}
