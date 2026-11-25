type Oklch = { l: number; c: number; h: number };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function srgbToLinear(v: number) {
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function linearToSrgb(v: number) {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let s = m[1];
  if (s.length === 3) s = s.split("").map((ch) => ch + ch).join("");
  const n = parseInt(s, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function hexToOklch(hex: string): Oklch {
  const rgb = parseHex(hex) ?? [0.24, 0.44, 0.88];
  const [r, g, b] = rgb.map(srgbToLinear);
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const c = Math.sqrt(A * A + B * B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}

function oklchToLinear({ l, c, h }: Oklch): [number, number, number] {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const L = l_ ** 3, M = m_ ** 3, S = s_ ** 3;
  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
}

const inGamut = (rgb: number[]) => rgb.every((v) => v >= -0.0005 && v <= 1.0005);

/** OKLCH to hex, reducing chroma until the colour fits sRGB. */
export function oklchToHex(color: Oklch): string {
  let { c } = color;
  let rgb = oklchToLinear({ ...color, c });
  for (let i = 0; i < 30 && !inGamut(rgb); i++) {
    c *= 0.9;
    rgb = oklchToLinear({ ...color, c });
  }
  return (
    "#" +
    rgb
      .map((v) => Math.round(clamp01(linearToSrgb(clamp01(v))) * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

function luminance(hex: string) {
  const [r, g, b] = (parseHex(hex) ?? [0, 0, 0]).map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Shade ramp 1 (lightest) to 9 (darkest) around the accent, chroma eased at the ends. */
export function accentShades(hex: string): string[] {
  const base = hexToOklch(hex);
  const ls = [0.97, 0.93, 0.87, 0.79, 0.7, 0.61, 0.52, 0.43, 0.34];
  const cs = [0.18, 0.35, 0.6, 0.85, 1, 1, 0.92, 0.8, 0.65];
  return ls.map((l, i) => oklchToHex({ l, c: base.c * cs[i], h: base.h }));
}
