import * as React from "react";
import { cn } from "@/lib/ad";

export interface SandFieldProps {
  /** How strong the revealed colour is over the ground (dark theme). */
  brightness?: number;
  /** How soft the brush is, in CSS px. */
  size?: number;
  /** How far the brush runs behind the cursor, in seconds. */
  trail?: number;
  /** Delay before sand returns, in seconds. */
  hold?: number;
  /** Sand fills back in over this many seconds. */
  refill?: number;
  /** How much of the fade shows as sand grains rather than a plain dim, 0 to 1. */
  grain?: number;
  /** On a light ground the sand darkens instead of lighting up, this much. */
  lightStrength?: number;
  /** The ground: a background class, default the page colour. The field blends into it. */
  className?: string;
}

type Opts = Required<Omit<SandFieldProps, "className">>;

/** Paint is kept on a coarse grid this many cells wide; the shader smooths it and adds the grain. */
const FIELD_WIDTH = 220;
const SPOTS = 8;
const SEEDS = Array.from({ length: SPOTS }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return { a: 0.16 + r(1) * 0.22, b: 0.34 + r(2) * 0.34, c: 0.14 + r(3) * 0.2, d: 0.3 + r(4) * 0.36, e: 0.12 + r(5) * 0.2, p: [r(6), r(7), r(8), r(9), r(10)].map((v) => v * 6.283), j: [r(11), r(12), r(13)] };
});

/** Eight shades around the accent (one per drifting spot), brightest channel near 1, so the spots glow without washing out. */
function palette(css: string): number[] {
  const hex = css.trim().match(/^#([0-9a-f]{6})$/i)?.[1];
  const rgb = hex ? [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) : (css.match(/[\d.]+/g) ?? ["60", "111", "224"]).slice(0, 3).map((v) => Number(v) / 255);
  const top = Math.max(...rgb, 0.001);
  const base = rgb.map((v) => v / top);
  return SEEDS.flatMap((s) => {
    const v = base.map((c, k) => Math.min(1, Math.max(0, c + (s.j[k] - 0.5) * 0.32 * (1 - c * 0.6))));
    const m = Math.max(...v, 0.001);
    const lift = 0.9 + 0.1 * s.j[0];
    return v.map((c) => (c / m) * lift);
  });
}

const VERTEX = "attribute vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }";
// The picture lives in the texture: paint is stored per cell. One canvas pixel is one grain cell; CSS scales it up
// without smoothing. The ground is the host's background, so the field blends into it. On dark the paint adds light;
// on light it takes away the colours the accent lacks.
const FRAGMENT = `precision highp float;
  uniform vec2 uRes; uniform vec3 uGround; uniform float uStrength, uGrain, uLight;
  uniform sampler2D uField;
  float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  void main() {
    vec4 paint = texture2D(uField, gl_FragCoord.xy / uRes);
    vec2 cell = floor(gl_FragCoord.xy);
    float n = hash(cell), f = paint.a;
    float grains = smoothstep(n - .08, n + .08, f) * mix(.5, 1., f);
    vec3 ink = mix(paint.rgb, max(paint.r, max(paint.g, paint.b)) - .7 * paint.rgb, uLight);
    vec3 color = ink * mix(1., grains / max(f, .004), uGrain) * (.86 + .28 * hash(cell + 17.));
    gl_FragColor = vec4(uGround + color * uStrength + (hash(gl_FragCoord.xy) - .5) / 255., 1.);
  }`;

type Point = { t: number; x: number; y: number; gap: boolean };

// Sets up the field on `canvas` and paints as the pointer moves over `area`. Returns the cleanup and a refresh for
// new settings (uniforms) or a new theme.
function startSand(host: HTMLElement, canvas: HTMLCanvasElement, area: HTMLElement, gl: WebGLRenderingContext, opts: { current: Opts }) {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("No shader");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "Shader failed");
    return shader;
  };
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  const texture = gl.createTexture();
  const shaders = [compile(gl.VERTEX_SHADER, VERTEX), compile(gl.FRAGMENT_SHADER, FRAGMENT)];
  for (const shader of shaders) gl.attachShader(program, shader);
  gl.bindAttribLocation(program, 0, "a");
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "Link failed");
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const u = (name: string) => gl.getUniformLocation(program, name);
  const loc = { res: u("uRes"), ground: u("uGround"), strength: u("uStrength"), grain: u("uGrain"), light: u("uLight") };
  gl.bindTexture(gl.TEXTURE_2D, texture);
  for (const [key, value] of [
    [gl.TEXTURE_MIN_FILTER, gl.LINEAR],
    [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
    [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE],
    [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE],
  ])
    gl.texParameteri(gl.TEXTURE_2D, key, value);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

  let colors = palette("");
  const spots = new Float32Array(SPOTS * 3);
  const fw = FIELD_WIDTH;
  let W = 1;
  let H = 1;
  let fh = 16;
  let clock = 0;
  let wasEmpty = false;
  let frame = 0;
  let onScreen = true;
  // Per cell: paint colour, how much paint, and when it was painted. Each patch fades on its own clock, oldest first.
  let color = new Float32Array(3);
  let cover = new Float32Array(1);
  let stamp = new Float64Array(1);
  let bytes = new Uint8Array(4);
  let gradient = new Float32Array(3);
  const history: Point[] = [];
  let brush: (Point & { jumped: boolean }) | null = null;

  function draw() {
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, fw, fh, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // The ground is the host's background and the paint is the accent, read again on every theme or setting change.
  function readTheme() {
    const s = getComputedStyle(host);
    const [r, g, b] = (s.backgroundColor.match(/[\d.]+/g) ?? []).map(Number);
    const light = r + g + b > 382;
    colors = palette(s.getPropertyValue("--ad-brand"));
    gl.uniform3f(loc.ground, r / 255, g / 255, b / 255);
    gl.uniform1f(loc.strength, light ? -opts.current.lightStrength : opts.current.brightness);
    gl.uniform1f(loc.light, light ? 1 : 0);
    gl.uniform1f(loc.grain, opts.current.grain);
  }

  // A resize clears the paint and draws the plain ground at once, so the canvas never shows black. One canvas pixel is
  // one grain cell (about 1.3 CSS px), sized so each cell covers whole device pixels, pinned to the bottom left.
  function resize() {
    const box = host.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cell = Math.max(1, Math.round(1.3 * dpr));
    W = Math.max(1, box.width);
    H = Math.max(1, box.height);
    canvas.width = Math.ceil((W * dpr) / cell);
    canvas.height = Math.ceil((H * dpr) / cell);
    canvas.style.width = `${(canvas.width * cell) / dpr}px`;
    canvas.style.height = `${(canvas.height * cell) / dpr}px`;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(loc.res, (W * dpr) / cell, (H * dpr) / cell);
    fh = Math.max(16, Math.round((fw * H) / W));
    color = new Float32Array(fw * fh * 3);
    cover = new Float32Array(fw * fh);
    stamp = new Float64Array(fw * fh);
    bytes = new Uint8Array(fw * fh * 4);
    gradient = new Float32Array(fw * fh * 3);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fw, fh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    wasEmpty = true;
    draw();
  }

  // Where the brush is at time t, and whether the pointer left and came back since the last brush point.
  function brushAt(t: number, since: number) {
    let i = -1;
    while (i + 1 < history.length && history[i + 1].t <= t) i++;
    if (i < 0) return null;
    const jumped = history.some((h, k) => k <= i && h.gap && h.t > since);
    if (i > 0) history.splice(0, i);
    const a = history[0];
    const b = history[1];
    if (!b || b.gap) return { x: a.x, y: a.y, t, gap: false, jumped };
    const k = (t - a.t) / Math.max(1, b.t - a.t);
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, t, gap: false, jumped };
  }

  // The gradient at this moment, only over the cells the brush is about to paint: soft coloured spots, brighter at
  // their centres, never black between them.
  function sampleGradient(x0: number, x1: number, y0: number, y1: number) {
    const aspect = W / H;
    SEEDS.forEach((s, i) => {
      spots[i * 3] = aspect * (0.5 + 0.42 * Math.sin(clock * s.a + s.p[0]) + 0.1 * Math.sin(clock * s.b + s.p[1]));
      spots[i * 3 + 1] = 0.5 + 0.42 * Math.sin(clock * s.c + s.p[2]) + 0.1 * Math.cos(clock * s.d + s.p[3]);
      spots[i * 3 + 2] = 0.2 + 0.09 * Math.sin(clock * s.e + s.p[4]);
    });
    const i0 = Math.max(0, Math.floor(x0));
    const i1 = Math.min(fw - 1, Math.ceil(x1));
    const j0 = Math.max(0, Math.floor(y0));
    const j1 = Math.min(fh - 1, Math.ceil(y1));
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) {
        let x = (i / (fw - 1)) * aspect;
        let y = j / (fh - 1);
        const wx = Math.sin(y * 3.1 + clock * 0.31) + 0.5 * Math.sin(y * 6.7 - clock * 0.23);
        const wy = Math.cos(x * 2.7 - clock * 0.27) + 0.5 * Math.cos(x * 5.9 + clock * 0.19);
        x += 0.07 * wx;
        y += 0.07 * wy;
        let r = 0;
        let g = 0;
        let b = 0;
        let total = 0;
        let level = 0;
        let dark = 1;
        for (let k = 0; k < SPOTS; k++) {
          const dx = x - spots[k * 3];
          const dy = y - spots[k * 3 + 1];
          const z = spots[k * 3 + 2];
          const d = (dx * dx + dy * dy) / (z * z);
          let w = 1 / (d + 0.35);
          w *= w;
          r += colors[k * 3] * w;
          g += colors[k * 3 + 1] * w;
          b += colors[k * 3 + 2] * w;
          level += Math.max(colors[k * 3], colors[k * 3 + 1], colors[k * 3 + 2]) * w;
          total += w;
          dark *= 1 - Math.exp(-d * 0.9);
        }
        const scale = ((0.34 + 0.62 * (1 - dark)) * (level / total)) / Math.max(r, g, b, 0.0001);
        const out = (j * fw + i) * 3;
        gradient[out] = r * scale;
        gradient[out + 1] = g * scale;
        gradient[out + 2] = b * scale;
      }
  }

  const life = (age: number) => {
    const { hold, refill } = opts.current;
    return age <= hold ? 1 : Math.max(0, 1 - (age - hold) / Math.max(0.01, refill));
  };

  // The cell's clock moves toward now by how much of it is new paint.
  function dab(x: number, y: number, sigma: number, amount: number, now: number) {
    const scale = fw / W;
    const cx = x * scale;
    const cy = (H - y) * scale;
    const s = sigma * scale;
    const reach = Math.ceil(s * 2.5);
    const x0 = Math.max(0, Math.floor(cx - reach));
    const x1 = Math.min(fw - 1, Math.ceil(cx + reach));
    const y0 = Math.max(0, Math.floor(cy - reach));
    const y1 = Math.min(fh - 1, Math.ceil(cy + reach));
    for (let j = y0; j <= y1; j++)
      for (let i = x0; i <= x1; i++) {
        const dx = i - cx;
        const dy = j - cy;
        const a = Math.min(0.85, Math.exp(-(dx * dx + dy * dy) / (2 * s * s)) * amount);
        if (a < 0.002) continue;
        const at = j * fw + i;
        const c = at * 3;
        const was = cover[at] * life((now - stamp[at]) / 1000);
        const next = a + was * (1 - a);
        const keepOld = (was * (1 - a)) / next;
        color[c] = gradient[c] * (a / next) + color[c] * keepOld;
        color[c + 1] = gradient[c + 1] * (a / next) + color[c + 1] * keepOld;
        color[c + 2] = gradient[c + 2] * (a / next) + color[c + 2] * keepOld;
        stamp[at] = cover[at] > 0 ? stamp[at] + (now - stamp[at]) * (a / next) : now;
        cover[at] = Math.min(1, next / Math.max(0.001, life((now - stamp[at]) / 1000)));
      }
  }

  // Moves the brush along the pointer's path, a little behind it, and returns the strongest paint left.
  function stepPaint(now: number) {
    const { trail, size } = opts.current;
    const next = brushAt(now - trail * 1000, brush ? brush.t : -Infinity);
    if (next) {
      if (brush && !next.jumped) {
        const dist = Math.hypot(next.x - brush.x, next.y - brush.y);
        if (dist > 0.5) {
          const scale = fw / W;
          const reach = size * scale * 2.5 + 1;
          sampleGradient(Math.min(brush.x, next.x) * scale - reach, Math.max(brush.x, next.x) * scale + reach, (H - Math.max(brush.y, next.y)) * scale - reach, (H - Math.min(brush.y, next.y)) * scale + reach);
          const spacing = size / 4;
          const steps = Math.min(16, Math.max(1, Math.ceil(dist / spacing)));
          const length = dist / steps;
          const amount = 0.22 * Math.min(1.5, length / spacing);
          for (let n = 1; n <= steps; n++) dab(brush.x + ((next.x - brush.x) * n) / steps, brush.y + ((next.y - brush.y) * n) / steps, size, amount, now);
        }
      }
      brush = next;
    }
    let top = 0;
    for (let at = 0; at < cover.length; at++) {
      const c = at * 3;
      const o = at * 4;
      const alpha = cover[at] ? cover[at] * life((now - stamp[at]) / 1000) : 0;
      if (alpha < 0.002) {
        cover[at] = 0;
        bytes[o] = bytes[o + 1] = bytes[o + 2] = bytes[o + 3] = 0;
        continue;
      }
      if (alpha > top) top = alpha;
      bytes[o] = color[c] * alpha * 255;
      bytes[o + 1] = color[c + 1] * alpha * 255;
      bytes[o + 2] = color[c + 2] * alpha * 255;
      bytes[o + 3] = alpha * 255;
    }
    return top;
  }

  // Runs only while there is paint on screen or the brush has not caught up with the pointer.
  function loop(now: number) {
    frame = 0;
    clock = 20 + now / 1000;
    const empty = stepPaint(now) <= 0.002;
    if (!(empty && wasEmpty)) draw();
    wasEmpty = empty;
    const caughtUp = history.length <= 1 && (!history.length || history[0].t <= now - opts.current.trail * 1000);
    if (onScreen && (!empty || !caughtUp)) frame = requestAnimationFrame(loop);
  }

  const clearPaint = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    history.length = 0;
    brush = null;
    cover.fill(0);
    bytes.fill(0);
    wasEmpty = true;
    draw();
  };
  const record = (event: PointerEvent, gap: boolean) => {
    if (event.pointerType === "touch") return;
    if (!onScreen || document.hidden) {
      history.length = 0;
      brush = null;
      return;
    }
    const box = host.getBoundingClientRect();
    history.push({ t: performance.now(), x: event.clientX - box.left, y: event.clientY - box.top, gap });
    if (!frame) frame = requestAnimationFrame(loop);
  };
  const onEnter = (event: PointerEvent) => record(event, true);
  const onMove = (event: PointerEvent) => record(event, false);
  // A hidden tab or a field scrolled out of view stops the loop and clears the paint, so nothing stale shows on return.
  const onVisibility = () => {
    if (document.hidden) clearPaint();
  };
  const seen = new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    if (!onScreen) clearPaint();
  });
  const onTheme = () => {
    readTheme();
    if (!frame) draw();
  };
  const theme = new MutationObserver(onTheme);
  const scheme = window.matchMedia("(prefers-color-scheme: dark)");
  const sizes = new ResizeObserver(resize);
  // A new pixel ratio (zoom, another monitor) resizes too; the query is re-armed for the new ratio.
  let ratio: MediaQueryList | null = null;
  const watchRatio = () => {
    ratio?.removeEventListener("change", onRatio);
    ratio = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    ratio.addEventListener("change", onRatio);
  };
  function onRatio() {
    watchRatio();
    resize();
  }
  const detach = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    theme.disconnect();
    seen.disconnect();
    scheme.removeEventListener("change", onTheme);
    ratio?.removeEventListener("change", onRatio);
    sizes.disconnect();
    area.removeEventListener("pointerenter", onEnter);
    area.removeEventListener("pointermove", onMove);
    document.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("webglcontextlost", onLost);
  };
  // A lost context (a GPU reset) ends the effect: the plain ground shows and the pointer is no longer followed.
  function onLost() {
    detach();
    canvas.remove();
  }

  theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });
  scheme.addEventListener("change", onTheme);
  watchRatio();
  sizes.observe(host);
  seen.observe(host);
  readTheme();
  resize();
  area.addEventListener("pointerenter", onEnter);
  area.addEventListener("pointermove", onMove);
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onLost);

  return {
    refresh: onTheme,
    stop: () => {
      detach();
      for (const shader of shaders) gl.deleteShader(shader);
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      gl.deleteTexture(texture);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/**
 * An agent assistant's new-chat background: the plain ground at rest; moving the mouse paints soft drifting
 * accent colour a moment behind the cursor, which holds, then sand fills back in. Light on dark grounds, deeper on
 * light ones. It fills its parent (give the parent `position: relative`), listens there, never takes the pointer and
 * draws nothing while idle or off screen. No WebGL, reduced motion or touch-only devices leave the plain ground.
 */
export function SandField({ brightness = 0.21, size = 89, trail = 0.2, hold = 1, refill = 1.5, grain = 0.11, lightStrength = 0.39, className }: SandFieldProps) {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const opts = React.useRef<Opts>({ brightness, size, trail, hold, refill, grain, lightStrength });
  const refresh = React.useRef<() => void>(undefined);
  React.useEffect(() => {
    opts.current = { brightness, size, trail, hold, refill, grain, lightStrength };
    refresh.current?.();
  }, [brightness, size, trail, hold, refill, grain, lightStrength]);
  React.useEffect(() => {
    const host = hostRef.current;
    const area = host?.parentElement;
    if (!host || !area || typeof window.matchMedia !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(any-hover: hover)").matches) return;
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;left:0;bottom:0;image-rendering:pixelated";
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
    if (!gl) return;
    host.append(canvas);
    let run: ReturnType<typeof startSand> | undefined;
    try {
      run = startSand(host, canvas, area, gl, opts);
      refresh.current = run.refresh;
    } catch {
      canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
    return () => {
      refresh.current = undefined;
      run?.stop();
      canvas.remove();
    };
  }, []);
  return <div ref={hostRef} aria-hidden="true" data-sand-field className={cn("pointer-events-none absolute inset-0 overflow-hidden bg-page", className)} />;
}
