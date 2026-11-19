// The motion set (number dial, password, theme switch, step form, linked highlight and the chat upgrades): the live
// pieces the Components page, the landing bands and the detail pages share, then their bento tiles.
import * as React from "react";
import { BarChart2, Database, FileText, Layers, Package, TrendingDown, TrendingUp } from "react-feather";
import { cn, formatDate, formatRp } from "@/lib/ad";
import { DEFAULTS } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { toast } from "@/components/ui/toast";
import { NumberDial, RollingNumber } from "@/components/ui/number-dial";
import { Thumb } from "@/components/ui/thumb";
import { PasswordInput, passwordStrength } from "@/components/ui/password-input";
import { ThemeSwitch, type ThemeChoice } from "@/components/ui/theme-switch";
import { StepForm } from "@/components/ui/step-form";
import { LineChart } from "@/components/ui/line-chart";
import { Table, TBody, TD, TH, THead, TRow } from "@/components/ui/table";
import { useBrush } from "@/components/ui/brush";
import { Bubble, Message } from "@/components/ui/message";
import { MessageScroller } from "@/components/ui/message-scroller";
import { Trace, type TraceStep } from "@/components/ui/trace";
import { StreamingText } from "@/components/ui/streaming-text";
import { Citation, type CitationSource } from "@/components/ui/citation";
import { PromptSuggestions } from "@/components/ui/prompt-suggestions";
import { ProposedChange } from "@/components/ui/proposed-change";
import { Reactions, type Reaction } from "@/components/ui/reactions";
import { TokenScope, useConfig } from "./config";
import { Mark, S, Tile, type TileDef } from "./mark";
import { SALES_14 } from "./showcase-more";

/* ------------------------------------------------------------ number dial */

export const DIAL_PRESETS = {
  quantity: { min: 0, max: 200, majorEvery: 10, unit: "pcs", start: 24, label: "Counted on the shelf" },
  days: { min: 0, max: 90, majorEvery: 10, unit: "days", start: 14, label: "Payment terms" },
  year: { min: 2000, max: 2040, majorEvery: 5, unit: undefined, start: 2026, label: "Financial year" },
} as const;

/** A soft tick per value, showcase only: Web Audio, created on the first tick (after a gesture), never by default. */
function useTick(on: boolean) {
  const ctx = React.useRef<AudioContext | null>(null);
  return React.useCallback(() => {
    if (!on) return;
    const a = (ctx.current ??= new AudioContext());
    const o = a.createOscillator();
    const g = a.createGain();
    o.frequency.value = 1600;
    g.gain.setValueAtTime(0.025, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.03);
    o.connect(g).connect(a.destination);
    o.start();
    o.stop(a.currentTime + 0.03);
  }, [on]);
}

export function DialDemo({ preset = "quantity", sound = false, blur = false, className }: { preset?: keyof typeof DIAL_PRESETS; sound?: boolean; blur?: boolean; className?: string }) {
  const p = DIAL_PRESETS[preset];
  const [value, setValue] = React.useState<number>(p.start);
  const tick = useTick(sound);
  return <NumberDial aria-label={p.label} value={value} onValueChange={setValue} min={p.min} max={p.max} majorEvery={p.majorEvery} unit={p.unit} blur={blur} onTick={tick} className={className} />;
}

const MUG_PRICE = 79_000;

/** The dial where an ERP would use it: a line on a purchase order, a supplier's payment terms, a report's year. */
export function DialInUse({ preset = "quantity", sound = false, blur = false, className }: { preset?: keyof typeof DIAL_PRESETS; sound?: boolean; blur?: boolean; className?: string }) {
  const p = DIAL_PRESETS[preset];
  const [value, setValue] = React.useState<number>(p.start);
  const tick = useTick(sound);
  const due = new Date();
  due.setDate(due.getDate() + value);
  const head =
    preset === "quantity"
      ? { title: "Gelas kopi tanah liat", meta: `${formatRp(MUG_PRICE)} each` }
      : preset === "days"
        ? { title: "Keramik Plered", meta: "Pays by bank transfer" }
        : { title: "Sales report", meta: "All shops" };
  const foot =
    preset === "quantity"
      ? { label: "Line total", value: <RollingNumber value={value * MUG_PRICE} format={formatRp} />, action: "Add to order", done: `${value} pcs added to PO-0418` }
      : preset === "days"
        ? { label: "First invoice due", value: formatDate(due), action: "Save terms", done: `Keramik Plered pays within ${value} days` }
        : { label: "Covers", value: `1 Jan to 31 Dec ${value}`, action: "Open report", done: `Sales report for ${value}` };
  return (
    <div className={cn("grid w-full gap-4", className)}>
      <div className="flex min-w-0 items-center gap-3">
        <Thumb alt={head.title} size={40} />
        <div className="grid min-w-0">
          <span className="truncate text-body font-medium text-ink">{head.title}</span>
          <span className="truncate text-small text-ink-muted">{head.meta}</span>
        </div>
      </div>
      <NumberDial aria-label={p.label} value={value} onValueChange={setValue} min={p.min} max={p.max} majorEvery={p.majorEvery} unit={p.unit} blur={blur} onTick={tick} />
      <div className="flex items-end justify-between gap-gap">
        <div className="grid min-w-0">
          <span className="text-small text-ink-muted">{foot.label}</span>
          <span className="truncate text-title font-semibold tabular-nums text-ink">{foot.value}</span>
        </div>
        <Button variant="primary" onClick={() => toast(foot.done)}>
          {foot.action}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ password */

export function PasswordDemo({ suggest = true, minLength = 8, className }: { suggest?: boolean; minLength?: number; className?: string }) {
  const [pw, setPw] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const id = React.useId();
  return (
    <form
      noValidate
      className={cn("grid gap-3", className)}
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        if (!passwordStrength(pw, minLength).strong) return document.getElementById(id)?.focus();
        toast("Account created");
        setPw("");
        setSubmitted(false);
      }}
    >
      <Field label="Password" htmlFor={id}>
        <PasswordInput id={id} value={pw} onValueChange={setPw} minLength={minLength} suggest={suggest} submitted={submitted} />
      </Field>
      <Button type="submit" variant="primary" className="w-full">
        Create account
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------ theme switch */

/** A small screen in its own theme: the switch re-themes only this preview, spreading from the option you picked. */
export function ThemePreview({ system = true, iconOnly = false, className }: { system?: boolean; iconOnly?: boolean; className?: string }) {
  const [global] = useConfig();
  const [choice, setChoice] = React.useState<ThemeChoice>(global.theme);
  const theme = choice === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : choice;
  const config = React.useMemo(() => ({ ...DEFAULTS, ...global, theme }), [global, theme]);
  return (
    <div className={cn("grid gap-3", className)}>
      <TokenScope config={config} className="grid gap-2 rounded-card bg-page p-[calc(var(--ad-nest)*3)] text-ink">
        <div className="grid gap-1 rounded-item bg-surface p-3 shadow-card">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-body font-medium">Today</span>
            <span className="text-small text-ink-muted">18 Nov</span>
          </div>
          <span className="text-number font-semibold tabular-nums">{formatRp(12_480_000)}</span>
          <span className="flex items-center gap-1.5 text-small text-ink-muted">
            <TrendingUp size={14} />
            12% on last Tuesday
          </span>
        </div>
      </TokenScope>
      <ThemeSwitch value={choice} onValueChange={setChoice} system={system} iconOnly={iconOnly} className="justify-self-start" />
    </div>
  );
}

/* ------------------------------------------------------------ step form */

export function PurchaseOrderForm({ className }: { className?: string }) {
  const [step, setStep] = React.useState(0);
  const [supplier, setSupplier] = React.useState("");
  const [error, setError] = React.useState<string | undefined>();
  const [qty, setQty] = React.useState({ mug: 24, plate: 12 });
  const [via, setVia] = React.useState("courier");
  return (
    <StepForm
      className={className}
      step={step}
      onStepChange={setStep}
      finishLabel="Create order"
      onFinish={() => {
        toast(`PO-0418 created for ${supplier}`);
        setStep(0);
        setSupplier("");
      }}
      steps={[
        {
          title: "Supplier",
          validate: () => {
            const e = supplier.trim() ? undefined : "Choose who you’re ordering from";
            setError(e);
            return e;
          },
          content: (
            <Field label="Supplier" error={error} htmlFor="po-supplier">
              <Input id="po-supplier" placeholder="Keramik Plered" value={supplier} invalid={!!error} onChange={(e) => (setSupplier(e.target.value), error && setError(undefined))} autoComplete="off" />
            </Field>
          ),
        },
        {
          title: "Items",
          content: (
            <ul className="grid gap-px">
              {(
                [
                  ["mug", "Gelas kopi tanah liat"],
                  ["plate", "Piring keramik 24 cm"],
                ] as const
              ).map(([k, name]) => (
                <li key={k} className="flex min-h-row items-center justify-between gap-3 rounded-item px-2 text-body">
                  <span className="min-w-0 truncate">{name}</span>
                  <QuantityStepper size="sm" aria-label={`${name} quantity`} value={qty[k]} min={1} onValueChange={(v) => setQty((q) => ({ ...q, [k]: v }))} />
                </li>
              ))}
            </ul>
          ),
        },
        {
          title: "Delivery",
          content: (
            <div className="grid gap-3">
              <Segmented
                aria-label="Delivery"
                value={via}
                onValueChange={setVia}
                options={[
                  { value: "courier", label: "Courier" },
                  { value: "pickup", label: "We pick up" },
                ]}
                className="justify-self-start"
              />
              <Textarea aria-label="Note for the supplier" placeholder="Pack the mugs in pairs" className="min-h-16" />
            </div>
          ),
        },
      ]}
    />
  );
}

/* ------------------------------------------------------------ linked highlight */

const WEEK_SERIES = [
  { key: "now", label: "This week" },
  { key: "before", label: "Last week" },
];

export function LinkedSales({ className }: { className?: string }) {
  const brush = useBrush();
  // Read inside the component: showcase-more imports this file too, so its data isn't ready at module load.
  const WEEK = SALES_14.slice(-7);
  const jt = (n: number) => `${(n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  return (
    <div className={cn("grid min-w-0 gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]", className)}>
      <LineChart aria-label="Sales this week and last" data={WEEK} series={WEEK_SERIES} height={200} dots {...brush.chart} />
      <Table className="-mx-1">
        <THead>
          <tr>
            <TH>Day</TH>
            {WEEK_SERIES.map((s) => (
              <TH key={s.key} align="right">
                <span {...brush.head(s.key)} className={cn("cursor-default", brush.cell(s.key))}>
                  {s.label}
                </span>
              </TH>
            ))}
          </tr>
        </THead>
        <TBody>
          {WEEK.map((d, i) => (
            <TRow key={d.label} tabIndex={0} {...brush.row(i)}>
              <TD>{d.label}</TD>
              {WEEK_SERIES.map((s) => (
                <TD key={s.key} align="right" className={brush.cell(s.key)}>
                  {jt(Number(d[s.key]))}
                </TD>
              ))}
            </TRow>
          ))}
        </TBody>
      </Table>
    </div>
  );
}

/* ------------------------------------------------------------ chat */

interface Script {
  prompt: string;
  icon: typeof Package;
  steps: { title: string; icon: typeof Package; time: string }[];
  answer: string;
  sources: Record<number, CitationSource>;
}

const SCRIPTS: Script[] = [
  {
    prompt: "Why is Kemang short on clay mugs?",
    icon: Package,
    steps: [
      { title: "Read sales by shop", icon: BarChart2, time: "0,6 s" },
      { title: "Checked stock at Dago and Kemang", icon: Database, time: "0,4 s" },
      { title: "Looked up open purchase orders", icon: FileText, time: "0,5 s" },
    ],
    answer:
      "Kemang sold 18 clay mugs this week, twice its usual pace, since the weekend bundle went live [1]. It has 2 left against 5 open orders, so it runs out tomorrow.\n\nDago has 9 and needs 3 for its own orders [2]. Moving 6 to Kemang covers it until the supplier delivers on Friday [3].",
    sources: {
      1: { title: "Sales by shop", meta: "Kemang · last 7 days", quote: "Gelas kopi tanah liat: 18 sold (usually 9)." },
      2: { title: "Stock ledger", meta: "Dago · today 09:00", quote: "On hand 9 · reserved for orders 3" },
      3: { title: "Purchase order PO-0412", meta: "Keramik Plered", quote: "Delivery Friday 21 Nov, 48 pcs." },
    },
  },
  {
    prompt: "Which products are selling slowest?",
    icon: TrendingDown,
    steps: [
      { title: "Read 30 days of sales", icon: BarChart2, time: "0,7 s" },
      { title: "Compared with last December", icon: Layers, time: "0,3 s" },
    ],
    answer:
      "Three products haven’t sold in 30 days: the rattan tray, the large batik runner and the teak coaster set [1]. Together they hold Rp 4,2 jt of stock.\n\nThe teak coasters sold well last December [2], so I’d keep those and mark the other two down 20%.",
    sources: {
      1: { title: "Sales by product", meta: "All shops · last 30 days", quote: "0 sold: Nampan rotan, Taplak batik besar, Tatakan jati (set of 4)." },
      2: { title: "Sales by product", meta: "All shops · December 2025", quote: "Tatakan jati (set of 4): 31 sold." },
    },
  },
  {
    prompt: "How did this week compare to last?",
    icon: BarChart2,
    steps: [{ title: "Read sales for both weeks", icon: BarChart2, time: "0,5 s" }],
    answer: "Sales are up 12% on last week, Rp 46 jt against Rp 41 jt [1]. Shopee carried most of the rise.\n\nReturns stayed flat at 1,4% [2].",
    sources: {
      1: { title: "Sales summary", meta: "All channels · weeks 46 and 47", quote: "Week 47: Rp 46,1 jt · week 46: Rp 41,2 jt" },
      2: { title: "Returns", meta: "All channels · week 47", quote: "6 returns of 431 orders" },
    },
  },
];

/** A scripted answer: the work steps arrive one by one with live timers, then the text streams in with its sources. */
function useScript(script: Script, run: number, skipSteps = false) {
  const [state, setState] = React.useState({ steps: script.steps.length, text: script.answer.length, running: false });
  React.useEffect(() => {
    if (!run) return;
    const ids: number[] = [];
    let at = 0;
    setState({ steps: 0, text: 0, running: true });
    if (!skipSteps) {
      script.steps.forEach((_, i) => ids.push(window.setTimeout(() => setState((s) => ({ ...s, steps: i + 1 })), (at += i ? 600 : 150))));
      at += 700;
    }
    const words = script.answer.split(/(?<=\s)/);
    let shown = 0;
    words.forEach((_, i) => {
      if (i % 3) return;
      ids.push(
        window.setTimeout(() => {
          shown = words.slice(0, i + 3).join("").length;
          setState((s) => ({ ...s, steps: script.steps.length + 1, text: shown }));
        }, (at += 70)),
      );
    });
    ids.push(window.setTimeout(() => setState({ steps: script.steps.length + 1, text: script.answer.length, running: false }), at + 120));
    return () => ids.forEach(window.clearTimeout);
  }, [run, script, skipSteps]);
  return state;
}

export function AskThread({ className, failReactions = false }: { className?: string; failReactions?: boolean }) {
  const [pick, setPick] = React.useState({ i: 0, run: 0 });
  const script = SCRIPTS[pick.i];
  const s = useScript(script, pick.run);
  const started = React.useRef<number[]>([]);
  const [reactions, setReactions] = React.useState<Reaction[]>([
    { emoji: "👍", count: 2, who: "Dewi, Rudi" },
    { emoji: "🙏", count: 1, who: "Dewi" },
  ]);
  const thinking = s.steps <= script.steps.length && s.running;
  const steps: TraceStep[] = script.steps.slice(0, Math.min(s.steps, script.steps.length)).map((st, i) => {
    const running = s.running && i === s.steps - 1 && s.steps <= script.steps.length;
    if (running && !started.current[i]) started.current[i] = Date.now();
    return { id: `${pick.run}-${i}`, title: st.title, icon: running ? undefined : st.icon, status: running ? "running" : "done", startedAt: started.current[i], time: running ? undefined : st.time };
  });
  return (
    <MessageScroller watch={`${pick.run}-${s.steps}-${s.text}`} className={cn("h-[420px]", className)}>
      <div className="grid content-start gap-4 pb-1">
        <Bubble align="end">{script.prompt}</Bubble>
        <Message from={{ name: "Alora", agent: true }} time={thinking ? "Thinking…" : "now"}>
          {steps.length ? <Trace live={s.running} steps={steps} className="mb-2 -ml-2" /> : null}
          {s.steps > script.steps.length || !s.running ? (
            <StreamingText
              text={script.answer.slice(0, s.text)}
              streaming={s.running}
              cite={(n) =>
                script.sources[n] ? (
                  n === 1 ? (
                    <Mark name="citation" className="inline-block">
                      <Citation n={n} source={script.sources[n]} />
                    </Mark>
                  ) : (
                    <Citation n={n} source={script.sources[n]} />
                  )
                ) : null
              }
            />
          ) : null}
          {!s.running ? (
            <div className="mt-2 grid gap-3 animate-[ad-fade-in_200ms_var(--ad-ease)]">
              <Mark name="reactions" className="w-fit">
                <Reactions
                  items={reactions}
                  onToggle={(emoji, on) =>
                    new Promise<void>((ok, fail) =>
                      window.setTimeout(() => {
                        if (failReactions) return fail(new Error("offline"));
                        setReactions((rs) => rs.map((r) => (r.emoji === emoji ? { ...r, mine: on, count: r.count + (on ? 1 : -1) } : r)));
                        ok();
                      }, 500),
                    )
                  }
                  onError={() => toast("Couldn’t save your reaction. Try again", "neutral")}
                />
              </Mark>
              <Mark name="prompt-suggestions">
                <PromptSuggestions
                  layout="chips"
                  items={SCRIPTS.map((x, i) => ({ prompt: x.prompt, icon: x.icon, i })).filter((x) => x.i !== pick.i)}
                  onPick={(prompt) => {
                    started.current = [];
                    setPick((p) => ({ i: SCRIPTS.findIndex((x) => x.prompt === prompt), run: p.run + 1 }));
                  }}
                />
              </Mark>
            </div>
          ) : null}
        </Message>
      </div>
    </MessageScroller>
  );
}

/** One question and Alora's answer, at a chat's width: the frame the streaming and citation demos sit in. */
function AnswerFrame({ children, footer, writing }: { children: React.ReactNode; footer?: React.ReactNode; writing?: boolean }) {
  return (
    <div className="grid w-full max-w-2xl content-start gap-4">
      <Bubble align="end">{SCRIPTS[0].prompt}</Bubble>
      <Message from={{ name: "Alora", agent: true }} time={writing ? "Writing…" : "now"}>
        {children}
      </Message>
      {footer}
    </div>
  );
}

const cite0 = (n: number) => (SCRIPTS[0].sources[n] ? <Citation n={n} source={SCRIPTS[0].sources[n]} /> : null);

/**
 * `space` "answer": the answer is known (a replay), so its whole shape shows as skeleton lines from the first frame.
 * A number holds that many lines open ahead of the words instead, as for a live model.
 */
export function StreamingDemo({ space = "answer" }: { space?: string }) {
  const [run, setRun] = React.useState(0);
  const s = useScript(SCRIPTS[0], run, true);
  const known = space === "answer";
  return (
    <AnswerFrame
      writing={s.running}
      footer={
        <Button variant="secondary" className="ml-8 justify-self-start" onClick={() => setRun((r) => r + 1)} disabled={s.running}>
          Write it again
        </Button>
      }
    >
      <StreamingText text={SCRIPTS[0].answer.slice(0, s.text)} streaming={s.running} final={known ? SCRIPTS[0].answer : undefined} reserve={known ? undefined : Number(space)} cite={cite0} />
    </AnswerFrame>
  );
}

/** The finished answer with its sources: point at (or tap) a number to see the passage behind the claim. */
export function CitedAnswer() {
  return (
    <AnswerFrame>
      <StreamingText text={SCRIPTS[0].answer} cite={cite0} />
    </AnswerFrame>
  );
}

export const PROMPTS = SCRIPTS.map((s) => ({ prompt: s.prompt, icon: s.icon }));

const PRICES = [
  { id: "mug", label: "Gelas kopi tanah liat", from: 79_000, to: 85_000 },
  { id: "plate", label: "Piring keramik 24 cm", from: 115_000, to: 125_000 },
  { id: "bowl", label: "Mangkuk saji besar", from: 98_000, to: 105_000 },
];

export function PriceChange({ className }: { className?: string }) {
  const [state, setState] = React.useState<"pending" | "applying" | "applied" | "dismissed">("pending");
  const t = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(t.current), []);
  return (
    <ProposedChange
      className={className}
      title="Raise 3 Shopee prices to match Tokopedia?"
      state={state}
      changes={PRICES.map((p) => ({ id: p.id, label: p.label, from: formatRp(p.from), to: formatRp(p.to) }))}
      onApply={() => {
        setState("applying");
        t.current = window.setTimeout(() => setState("applied"), 700);
      }}
      onDismiss={() => setState("dismissed")}
      onUndo={() => setState("pending")}
    />
  );
}

/* ------------------------------------------------------------ the tiles */

function StockCountTile({ className }: { className?: string }) {
  return (
    <Tile inset="pad" className={className}>
      <div className="flex items-center justify-between gap-gap">
        <h3 className="min-w-0 truncate text-title font-semibold">Gelas kopi tanah liat at Dago</h3>
        <Button variant="primary" size="sm" onClick={() => toast("Count saved")}>
          Save count
        </Button>
      </div>
      <Mark name="number-dial" className="flex-1 content-center">
        <DialDemo preset="quantity" />
      </Mark>
    </Tile>
  );
}

function AppearanceTile({ className }: { className?: string }) {
  return (
    <Tile inset="pad" className={className}>
      <h3 className="text-title font-semibold">Appearance</h3>
      <Mark name="theme-switch" className="flex-1">
        <ThemePreview />
      </Mark>
    </Tile>
  );
}

function NewStaffTile({ className }: { className?: string }) {
  return (
    <Tile inset="pad" className={className}>
      <h3 className="text-title font-semibold">New staff account</h3>
      <Mark name="password-input">
        <PasswordDemo />
      </Mark>
    </Tile>
  );
}

function PurchaseOrderTile({ className }: { className?: string }) {
  return (
    <Tile inset="pad" className={className}>
      <h3 className="text-title font-semibold">New purchase order</h3>
      <Mark name="step-form">
        <PurchaseOrderForm />
      </Mark>
    </Tile>
  );
}

function LinkedSalesTile({ className }: { className?: string }) {
  return (
    <Tile inset="pad" className={className}>
      <h3 className="text-title font-semibold">This week against last</h3>
      <Mark name="brush">
        <LinkedSales />
      </Mark>
    </Tile>
  );
}

function AskTile({ className }: { className?: string }) {
  return (
    <Tile inset="pad" className={className}>
      <h3 className="text-title font-semibold">Ask Alora</h3>
      <Mark name="streaming-text" className="flex-1">
        <AskThread />
      </Mark>
    </Tile>
  );
}

function PriceChangeTile({ className }: { className?: string }) {
  return (
    <Tile inset="pad" className={className}>
      <h3 className="text-title font-semibold">Before Alora changes prices</h3>
      <Mark name="proposed-change">
        <PriceChange />
      </Mark>
    </Tile>
  );
}

export const MOTION_TILES: Partial<Record<"Inputs" | "Charts" | "Chat", TileDef[]>> = {
  Inputs: [
    { items: ["step-form"], render: () => <PurchaseOrderTile className={S[7]} /> },
    { items: ["password-input"], render: () => <NewStaffTile className={cn(S[5], "md:col-span-2 lg:col-span-5")} /> },
    { items: ["number-dial"], render: () => <StockCountTile className={S[8]} /> },
    { items: ["theme-switch"], render: () => <AppearanceTile className={cn(S[4], "md:col-span-2 lg:col-span-4")} /> },
  ],
  Charts: [{ items: ["brush"], render: () => <LinkedSalesTile className={S[12]} /> }],
  Chat: [
    { items: ["streaming-text", "citation", "reactions", "prompt-suggestions"], render: () => <AskTile className={S[7]} /> },
    { items: ["proposed-change"], render: () => <PriceChangeTile className={cn(S[5], "md:col-span-2 lg:col-span-5")} /> },
  ],
};
