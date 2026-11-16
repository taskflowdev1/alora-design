import { Check, RotateCcw } from "react-feather";
import { cn } from "@/lib/ad";
import { DEFAULTS, LIMITS, type Config } from "@/lib/config";
import { Segmented } from "@/components/ui/segmented";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const SWATCHES = ["#3c6fe0", "#5b5bd6", "#7c4ddb", "#0f8a8a", "#2f8a57", "#d9622b", "#d23f6b", "#3f4450"];

export type Field = keyof Config;
export const ALL_FIELDS: Field[] = ["corner", "smoothing", "radius", "padding", "height", "accent", "tone", "shadow", "font", "theme"];
export const COMPONENT_FIELDS: Field[] = ["corner", "smoothing", "radius", "padding", "height", "accent", "shadow"];

export function CornerControl({ value, onChange }: { value: Config; onChange: (p: Partial<Config>) => void }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-body text-ink-muted">Corner shape</span>
      <Segmented
        aria-label="Corner shape"
        value={value.corner}
        onValueChange={(corner) => onChange({ corner })}
        options={[
          { value: "square", label: "Square" },
          { value: "round", label: "Round" },
          { value: "squircle", label: "Squircle" },
        ]}
        className="w-full [&>button]:flex-1"
      />
    </div>
  );
}

export function SmoothingControl({ value, onChange }: { value: Config; onChange: (p: Partial<Config>) => void }) {
  if (value.corner !== "squircle") return null;
  return (
    <Slider
      label="Smoothing"
      value={value.smoothing}
      min={LIMITS.smoothing[0]}
      max={LIMITS.smoothing[1]}
      step={0.1}
      onValueChange={(smoothing) => onChange({ smoothing: Math.round(smoothing * 10) / 10 })}
      display={`superellipse(${value.smoothing.toFixed(1)})`}
    />
  );
}

export function RadiusControl({ value, onChange, label = "Radius" }: { value: Config; onChange: (p: Partial<Config>) => void; label?: string }) {
  const off = value.corner === "square";
  return (
    <div className={cn("transition-opacity duration-[220ms]", off && "pointer-events-none opacity-40")} aria-disabled={off}>
      <Slider label={label} value={value.radius} min={LIMITS.radius[0]} max={LIMITS.radius[1]} onValueChange={(radius) => onChange({ radius })} display={`${value.radius} px`} />
    </div>
  );
}

export function ConfigPanel({
  value,
  onChange,
  fields = ALL_FIELDS,
  onReset,
  className,
}: {
  value: Config;
  onChange: (patch: Partial<Config>) => void;
  fields?: Field[];
  onReset?: () => void;
  className?: string;
}) {
  const has = (f: Field) => fields.includes(f);
  return (
    <div className={cn("grid gap-4", className)}>
      {has("corner") ? <CornerControl value={value} onChange={onChange} /> : null}
      {has("smoothing") ? <SmoothingControl value={value} onChange={onChange} /> : null}
      {has("radius") ? <RadiusControl value={value} onChange={onChange} /> : null}
      {has("padding") ? (
        <Slider label="Padding" value={value.padding} min={LIMITS.padding[0]} max={LIMITS.padding[1]} onValueChange={(padding) => onChange({ padding })} display={`${value.padding} px`} />
      ) : null}
      {has("height") ? (
        <Slider label="Height" value={value.height} min={LIMITS.height[0]} max={LIMITS.height[1]} step={2} onValueChange={(height) => onChange({ height })} display={`${value.height} px`} />
      ) : null}
      {has("accent") ? (
        <div className="grid gap-1.5">
          <span className="text-body text-ink-muted">Accent</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {SWATCHES.map((s) => (
              <button
                key={s}
                type="button"
                aria-label={s}
                aria-pressed={value.accent === s}
                onClick={() => onChange({ accent: s })}
                data-shape="round"
                className="grid size-6 cursor-pointer place-items-center rounded-full text-white transition-transform duration-[160ms] ease-ad active:scale-95"
                style={{ background: s }}
              >
                {value.accent === s ? <Check size={14} /> : null}
              </button>
            ))}
          </div>
          <Input
            aria-label="Accent hex"
            value={value.accent}
            onChange={(e) => {
              const v = e.target.value.trim();
              if (/^#?[0-9a-f]{6}$/i.test(v)) onChange({ accent: v.startsWith("#") ? v.toLowerCase() : `#${v.toLowerCase()}` });
            }}
            wrapperClassName="h-item w-32"
            icon={() => <span data-shape="round" className="size-3.5 shrink-0 rounded-full" style={{ background: value.accent }} />}
          />
        </div>
      ) : null}
      {has("tone") ? (
        <div className="grid gap-1.5">
          <span className="text-body text-ink-muted">Greys</span>
          <Segmented
            aria-label="Grey tone"
            value={value.tone}
            onValueChange={(tone) => onChange({ tone })}
            options={[
              { value: "cool", label: "Cool" },
              { value: "neutral", label: "Neutral" },
              { value: "warm", label: "Warm" },
            ]}
            className="w-full [&>button]:flex-1"
          />
        </div>
      ) : null}
      {has("shadow") ? (
        <Slider label="Shadow" value={value.shadow} min={0} max={100} step={5} onValueChange={(shadow) => onChange({ shadow })} display={`${value.shadow}%`} />
      ) : null}
      {has("font") ? (
        <Slider label="Text size" value={value.font} min={LIMITS.font[0]} max={LIMITS.font[1]} onValueChange={(font) => onChange({ font })} display={`${value.font} px`} />
      ) : null}
      {has("theme") ? (
        <div className="grid gap-1.5">
          <span className="text-body text-ink-muted">Theme</span>
          <Segmented
            aria-label="Theme"
            value={value.theme}
            onValueChange={(theme) => onChange({ theme })}
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
            className="w-full [&>button]:flex-1"
          />
        </div>
      ) : null}
      {onReset ? (
        <Button variant="ghost" onClick={onReset} className="justify-self-start">
          <RotateCcw />
          Reset
        </Button>
      ) : null}
    </div>
  );
}

export const resetPatch = (fields: Field[]) => Object.fromEntries(fields.map((f) => [f, DEFAULTS[f]])) as Partial<Config>;
