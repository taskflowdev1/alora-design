// Detail-page demos for the motion set: each live with its controls, plus its usage snippet.
import * as React from "react";
import { toast } from "@/components/ui/toast";
import { PromptSuggestions } from "@/components/ui/prompt-suggestions";
import { Reactions, type Reaction } from "@/components/ui/reactions";
import { Message } from "@/components/ui/message";
import type { Demo } from "./demos";
import { CitedAnswer, DialInUse, LinkedSales, PasswordDemo, PriceChange, PROMPTS, PurchaseOrderForm, StreamingDemo, ThemePreview, type DIAL_PRESETS } from "./showcase-motion";

function ReactionsDemo({ fail }: { fail: boolean }) {
  const [items, setItems] = React.useState<Reaction[]>([
    { emoji: "👍", count: 4, mine: true, who: "You, Dewi, Rudi, Sari" },
    { emoji: "🎉", count: 9, who: "Dewi and 8 others" },
    { emoji: "👀", count: 1, who: "Rudi" },
  ]);
  // Where reactions belong: under a teammate's comment.
  return (
    <Message from={{ name: "Dewi" }} time="Today, 14:05" className="w-full max-w-md">
      <p>Kemang’s restock is booked for Friday, 6 mugs from Dago.</p>
      <Reactions
        className="mt-1.5"
        items={items}
        onToggle={(emoji, on) =>
          new Promise<void>((ok, no) =>
            window.setTimeout(() => {
              if (fail) return no(new Error("offline"));
              setItems((rs) => rs.map((r) => (r.emoji === emoji ? { ...r, mine: on, count: r.count + (on ? 1 : -1) } : r)));
              ok();
            }, 600),
          )
        }
        onError={() => toast("Couldn’t save your reaction. Try again", "neutral")}
      />
    </Message>
  );
}

export const MOTION_DEMOS: Record<string, Demo> = {
  "number-dial": {
    controls: [
      { key: "preset", type: "select", label: "Use", options: ["quantity", "days", "year"], labels: ["Quantity", "Payment terms", "Year"], default: "quantity" },
      { key: "sound", type: "toggle", label: "Tick sound (showcase)", default: false },
      { key: "blur", type: "toggle", label: "Motion blur (showcase)", default: false },
    ],
    render: (p) => <DialInUse key={String(p.preset)} preset={p.preset as keyof typeof DIAL_PRESETS} sound={!!p.sound} blur={!!p.blur} className="max-w-md" />,
    usage: (p) =>
      p.preset === "year"
        ? `<NumberDial aria-label="Financial year" value={year} onValueChange={setYear} min={2000} max={2040} majorEvery={5} />`
        : `<NumberDial aria-label="${p.preset === "days" ? "Payment terms" : "Counted on the shelf"}" value={n} onValueChange={setN} min={0} max={${p.preset === "days" ? 90 : 200}} unit="${p.preset === "days" ? "days" : "pcs"}" />\n\n// Only the changed digit rolls, anywhere a number updates:\n<RollingNumber value={orders} />`,
  },
  "password-input": {
    controls: [
      { key: "suggest", type: "toggle", label: "Suggest a password", default: true },
      { key: "min", type: "select", label: "Minimum length", options: ["8", "12"], default: "8" },
    ],
    render: (p) => <PasswordDemo key={String(p.min)} suggest={!!p.suggest} minLength={Number(p.min)} className="w-full max-w-sm" />,
    usage: (p) =>
      `<Field label="Password" htmlFor="pw">\n  <PasswordInput id="pw" value={pw} onValueChange={setPw}${p.min !== "8" ? ` minLength={${p.min}}` : ""}${p.suggest ? "" : " suggest={false}"} submitted={submitted} />\n</Field>\n\npasswordStrength(pw) // { score, strong, short, common }`,
  },
  "theme-switch": {
    controls: [
      { key: "system", type: "toggle", label: "System option", default: true },
      { key: "iconOnly", type: "toggle", label: "Icons only", default: false },
    ],
    render: (p) => <ThemePreview system={!!p.system} iconOnly={!!p.iconOnly} className="w-full max-w-xs" />,
    usage: (p) =>
      `<ThemeSwitch value={theme} onValueChange={(t) => setTheme(t)}${p.system ? "" : " system={false}"}${p.iconOnly ? " iconOnly" : ""} />\n\n// Any other control can spread a theme from where it was pressed:\nswitchTheme(() => document.documentElement.classList.toggle("dark"), { x: e.clientX, y: e.clientY });`,
  },
  "step-form": {
    render: () => <PurchaseOrderForm className="w-full max-w-md" />,
    usage: () =>
      `<StepForm\n  finishLabel="Create order"\n  onFinish={create}\n  steps={[\n    { title: "Supplier", content: <SupplierField />, validate: () => (supplier ? undefined : "Choose a supplier") },\n    { title: "Items", content: <Items /> },\n    { title: "Delivery", content: <Delivery /> },\n  ]}\n/>\n\n// Just the sliding, height-easing panels:\n<StepPanels step={step}>{[<A />, <B />, <C />]}</StepPanels>`,
  },
  brush: {
    stage: "surface",
    render: () => <LinkedSales className="w-full max-w-3xl" />,
    usage: () =>
      `const brush = useBrush();\n\n<LineChart data={week} series={series} {...brush.chart} />\n<Table>\n  …\n  {week.map((d, i) => (\n    <TRow key={d.label} tabIndex={0} {...brush.row(i)}>\n      <TD>{d.label}</TD>\n      <TD align="right" className={brush.cell("now")}>{d.now}</TD>\n    </TRow>\n  ))}\n</Table>`,
  },
  "prompt-suggestions": {
    controls: [{ key: "layout", type: "select", label: "Layout", options: ["list", "chips"], labels: ["List (empty chat)", "Chips (follow-ups)"], default: "list" }],
    render: (p) => (
      <div className="grid w-full max-w-md gap-3">
        {p.layout === "list" ? <h3 className="px-2.5 text-title font-semibold">What should we look at?</h3> : null}
        <PromptSuggestions key={String(p.layout)} layout={p.layout as "list"} items={PROMPTS} onPick={(x) => toast(`Sent: ${x}`, "neutral")} />
      </div>
    ),
    usage: (p) => `<PromptSuggestions${p.layout === "chips" ? ' layout="chips"' : ""} items={[{ prompt: "Why is Kemang short on clay mugs?", icon: Package }]} onPick={send} />`,
  },
  "streaming-text": {
    controls: [{ key: "space", type: "select", label: "Space held", options: ["answer", "2", "3", "4"], labels: ["The whole answer", "2 lines ahead", "3 lines ahead", "4 lines ahead"], default: "answer" }],
    render: (p) => <StreamingDemo key={String(p.space)} space={String(p.space)} />,
    usage: (p) =>
      p.space === "answer"
        ? `// The answer is known (a replay): its shape shows as skeleton lines from the first frame.\n<StreamingText text={soFar} final={answer} streaming={!done} cite={(n) => <Citation n={n} source={sources[n]} />} />`
        : `<StreamingText text={soFar} streaming={!done}${p.space !== "3" ? ` reserve={${p.space}}` : ""} cite={(n) => <Citation n={n} source={sources[n]} />} />`,
  },
  citation: {
    render: () => <CitedAnswer />,
    usage: () =>
      `// In an answer, StreamingText keeps each number on its word's line:\n<StreamingText text={answer} cite={(n) => <Citation n={n} source={sources[n]} />} />\n\n// By hand, wrap the word, the number and its full stop:\n<span className="whitespace-nowrap">needs 3<Citation n={2} source={{ title: "Stock ledger", meta: "Dago · today 09:00", quote: "On hand 9 · reserved 3" }} />.</span>`,
  },
  "proposed-change": {
    render: () => <PriceChange className="w-full max-w-md" />,
    usage: () =>
      `<ProposedChange\n  title="Raise 3 Shopee prices to match Tokopedia?"\n  changes={[{ id: "mug", label: "Gelas kopi tanah liat", from: "Rp 79.000", to: "Rp 85.000" }]}\n  state={state}\n  onApply={apply}\n  onDismiss={() => setState("dismissed")}\n  onUndo={undo}\n/>`,
  },
  reactions: {
    controls: [{ key: "fail", type: "toggle", label: "Saving fails", default: false }],
    render: (p) => <ReactionsDemo key={String(p.fail)} fail={!!p.fail} />,
    usage: () => `<Reactions items={reactions} onToggle={(emoji, on) => api.react(messageId, emoji, on)} onError={() => toast("Couldn’t save your reaction")} />`,
  },
};
