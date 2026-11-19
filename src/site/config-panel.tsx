import * as React from "react";
import { Check, Moon, RotateCcw, Sun } from "react-feather";
import { cn } from "@/lib/ad";
import { DEFAULTS, LIMITS, type Config } from "@/lib/config";
import { Segmented } from "@/components/ui/segmented";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Accent choices, not UI greys (the last is a slate accent). grey-ok
export const SWATCHES = ["#3c6fe0", "#dc467d", "#5b5bd6", "#7c4ddb", "#0f8a8a", "#2f8a57", "#d9622b", "#3f4450"]; // grey-ok

export type Field = keyof Config;
export const ALL_FIELDS: Field[] = ["corner", "smoothing", "radius", "padding", "height", "accent", "tone", "shadow", "font", "theme"];
export const COMPONENT_FIELDS: Field[] = ["corner", "smoothing", "radius", "padding", "height", "accent", "shadow"];

type ControlProps = { value: Config; onChange: (p: Partial<Config>) => void };

/** A 14 px corner drawn in the shape it names: sharp, circular arc, continuous curve. */
function CornerGlyph({ shape }: { shape: Config["corner"] }) {
  const d = shape === "square" ? "M2 13V2h11" : shape === "round" ? "M2 13V8a6 6 0 0 1 6-6h5" : "M2 13V7.5C2 3.4 3.4 2 7.5 2H13";
  return (
    <svg aria-hidden width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const withIcon = (icon: React.ReactNode, label: string) => (
  <span className="inline-flex items-center gap-1.5">
    {icon}
    {label}
  </span>
);

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-body text-ink-muted">{label}</span>
      {children}
    </div>
  );
}

export function CornerControl({ value, onChange }: ControlProps) {
  return (
    <Labelled label="Corner shape">
      <Segmented
        aria-label="Corner shape"
        value={value.corner}
        onValueChange={(corner) => onChange({ corner })}
        options={(["square", "round", "squircle"] as const).map((c) => ({ value: c, label: withIcon(<CornerGlyph shape={c} />, c[0].toUpperCase() + c.slice(1)) }))}
        className="w-full [&>button]:flex-1"
      />
    </Labelled>
  );
}

export function SmoothingControl({ value, onChange }: ControlProps) {
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

export function RadiusControl({ value, onChange, label = "Radius" }: ControlProps & { label?: string }) {
  const off = value.corner === "square";
  return (
    <div className={cn("transition-opacity duration-[220ms]", off && "pointer-events-none opacity-40")} aria-disabled={off}>
      <Slider label={label} value={value.radius} min={LIMITS.radius[0]} max={LIMITS.radius[1]} onValueChange={(radius) => onChange({ radius })} display={`${value.radius} px`} />
    </div>
  );
}

const PaddingControl = ({ value, onChange }: ControlProps) => (
  <Slider label="Padding" value={value.padding} min={LIMITS.padding[0]} max={LIMITS.padding[1]} onValueChange={(padding) => onChange({ padding })} display={`${value.padding} px`} />
);
const HeightControl = ({ value, onChange }: ControlProps) => (
  <Slider label="Height" value={value.height} min={LIMITS.height[0]} max={LIMITS.height[1]} step={2} onValueChange={(height) => onChange({ height })} display={`${value.height} px`} />
);
const ShadowControl = ({ value, onChange }: ControlProps) => (
  <Slider label="Shadow" value={value.shadow} min={0} max={100} step={5} onValueChange={(shadow) => onChange({ shadow })} display={`${value.shadow}%`} />
);
const FontControl = ({ value, onChange }: ControlProps) => (
  <Slider label="Text size" value={value.font} min={LIMITS.font[0]} max={LIMITS.font[1]} onValueChange={(font) => onChange({ font })} display={`${value.font} px`} />
);

function AccentControl({ value, onChange, large }: ControlProps & { large?: boolean }) {
  return (
    <Labelled label="Accent">
      <div className={cn("flex flex-wrap items-center", large ? "gap-2" : "gap-1.5")}>
        {SWATCHES.map((s) => (
          <button
            key={s}
            type="button"
            aria-label={s}
            aria-pressed={value.accent === s}
            onClick={() => onChange({ accent: s })}
            data-shape="round"
            className={cn("grid cursor-pointer place-items-center rounded-full text-thumb transition-transform duration-[160ms] ease-ad active:scale-95", large ? "size-7" : "size-6")}
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
    </Labelled>
  );
}

function ToneControl({ value, onChange }: ControlProps) {
  return (
    <Labelled label="Greys">
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
    </Labelled>
  );
}

function ThemeControl({ value, onChange }: ControlProps) {
  return (
    <Labelled label="Theme">
      <Segmented
        aria-label="Theme"
        value={value.theme}
        onValueChange={(theme) => onChange({ theme })}
        options={[
          { value: "light", label: withIcon(<Sun size={14} />, "Light") },
          { value: "dark", label: withIcon(<Moon size={14} />, "Dark") },
        ]}
        className="w-full [&>button]:flex-1"
      />
    </Labelled>
  );
}

const CONTROLS: Partial<Record<Field, (p: ControlProps) => React.ReactNode>> = {
  corner: CornerControl,
  smoothing: SmoothingControl,
  radius: RadiusControl,
  padding: PaddingControl,
  height: HeightControl,
  accent: AccentControl,
  tone: ToneControl,
  shadow: ShadowControl,
  font: FontControl,
  theme: ThemeControl,
};

/** The flat list: gallery overrides and the phone popover. */
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
  return (
    <div className={cn("grid gap-4", className)}>
      {fields.map((f) => {
        const C = CONTROLS[f];
        return C ? <C key={f} value={value} onChange={onChange} /> : null;
      })}
      {onReset ? (
        <Button variant="ghost" onClick={onReset} className="justify-self-start">
          <RotateCcw />
          Reset
        </Button>
      ) : null}
    </div>
  );
}

/** The same controls, grouped on soft cards: the customize flap's panel. */
export function ConfigGroups({ value, onChange }: ControlProps) {
  const groups: [string, React.ReactNode][] = [
    [
      "Shape",
      <>
        <CornerControl value={value} onChange={onChange} />
        <SmoothingControl value={value} onChange={onChange} />
        <RadiusControl value={value} onChange={onChange} />
      </>,
    ],
    [
      "Size",
      <>
        <PaddingControl value={value} onChange={onChange} />
        <HeightControl value={value} onChange={onChange} />
        <FontControl value={value} onChange={onChange} />
      </>,
    ],
    ["Colour", <AccentControl large value={value} onChange={onChange} />],
    [
      "Surface",
      <>
        <ThemeControl value={value} onChange={onChange} />
        <ToneControl value={value} onChange={onChange} />
        <ShadowControl value={value} onChange={onChange} />
      </>,
    ],
  ];
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(296px,1fr))] content-start gap-[calc(var(--ad-nest)*2)]">
      {groups.map(([title, body]) => (
        <section key={title} aria-label={title} className="grid content-start gap-3 rounded-sheet bg-fill p-pad">
          <h3 className="text-title font-semibold text-ink">{title}</h3>
          {body}
        </section>
      ))}
    </div>
  );
}

export const resetPatch = (fields: Field[]) => Object.fromEntries(fields.map((f) => [f, DEFAULTS[f]])) as Partial<Config>;
