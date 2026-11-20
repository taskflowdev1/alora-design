import * as React from "react";
import { Tooltip as RT } from "radix-ui";
import { Bold, Check, ChevronLeft, ChevronRight, Copy, Edit2, FileText, Italic, Link2, Share2, Trash2, Underline } from "react-feather";
import { cn, formatNumber, formatRp, prefersReducedMotion } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Attachment } from "@/components/ui/attachment";
import { Collapsible } from "@/components/ui/collapsible";
import { Popover } from "@/components/ui/popover";
import { Chip } from "@/components/ui/status";
import { InputOTP, type InputOTPStatus } from "@/components/ui/input-otp";
import { Skeleton } from "@/components/ui/skeleton";
import { Kbd } from "@/components/ui/kbd";
import { Menu, MenuItem, MenuSub } from "@/components/ui/menu";
import { InlineEdit, grouped } from "@/components/ui/inline-edit";
import { Table, TBody, TD, TH, THead, TRow } from "@/components/ui/table";

// Live demos for the encyclopedia: one small component per rule, keyed by rule id. Each is quiet and built from the
// library's own components; a "without / with" pair shows the difference where words can't.

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Keyframes the demos need beyond base.css. */
const DEMO_CSS = `
@keyframes enc-pop { from { opacity: 0; transform: scale(0); } }
@keyframes enc-step { from { opacity: 0; transform: translateX(calc(16px * var(--enc-dir, 1))); } }
@keyframes enc-roll { from { transform: translateY(calc(100% * var(--enc-dir, 1))); } }
@keyframes enc-fade-only { from { opacity: 0; } }`;

/** Two cells side by side (stacked on phones), each with a plain label. */
function Pair({ a, b, labels = ["Without", "With"], className }: { a: React.ReactNode; b: React.ReactNode; labels?: [string, string]; className?: string }) {
  return (
    <div className={cn("grid gap-[calc(var(--ad-nest)*2)] sm:grid-cols-2", className)}>
      <Cell label={labels[0]}>{a}</Cell>
      <Cell label={labels[1]}>{b}</Cell>
    </div>
  );
}

function Cell({ label, children, className }: { label?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid min-w-0 content-start gap-2 rounded-item bg-surface p-pad", className)}>
      {label ? <span className="text-body text-ink-muted">{label}</span> : null}
      <div className="flex min-h-14 min-w-0 flex-wrap items-center gap-gap">{children}</div>
    </div>
  );
}

/** The soft frame every demo sits in; inner cells are concentric with it. */
export function DemoFrame({ children }: { children: React.ReactNode }) {
  return (
    <div data-demo className="grid max-w-[880px] grid-cols-1 gap-[calc(var(--ad-nest)*2)] rounded-card bg-fill p-[calc(var(--ad-nest)*2)] text-ink">
      <style href="enc-demos" precedence="default">
        {DEMO_CSS}
      </style>
      {children}
    </div>
  );
}

/** A counter that remounts its children on each press, so an entrance plays again. */
function useReplay() {
  const [n, setN] = React.useState(0);
  return [n, () => setN((x) => x + 1)] as const;
}

/* ------------------------------------------------------------ motion */

function PressScale() {
  return <Pair a={<Button className="active:scale-100">Save</Button>} b={<Button>Save</Button>} />;
}

function PopIn({ animation, label = "Open" }: { animation: string; label?: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="grid w-full gap-gap">
      <Button className="justify-self-start" onClick={() => setOpen((o) => !o)}>
        {open ? "Close" : label}
      </Button>
      <div className="h-[68px]">
        {open ? (
          <div className="w-fit origin-top-left rounded-card bg-surface p-pad shadow-raised" style={{ animation }}>
            <p className="font-medium">Filters</p>
            <p className="text-ink-muted">3 shops, this month</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EnterScale() {
  return <Pair labels={["From 0", "From 0.97"]} a={<PopIn animation={`enc-pop 220ms ${EASE}`} />} b={<PopIn animation={`ad-in 220ms ${EASE}`} />} />;
}

function Under300() {
  return <Pair labels={["500 ms", "220 ms"]} a={<PopIn animation={`ad-in 500ms ${EASE}`} />} b={<PopIn animation={`ad-in 220ms ${EASE}`} />} />;
}

function Travel({ easing }: { easing: string }) {
  const [end, setEnd] = React.useState(false);
  return (
    <div className="grid w-full gap-gap">
      <div className="@container relative h-6 rounded-item bg-fill">
        <span
          data-shape="round"
          className="absolute left-1 top-1 size-4 rounded-full bg-ink"
          style={{ transform: end ? "translateX(calc(100cqw - 24px))" : "none", transition: `transform 300ms ${easing}` }}
        />
      </div>
      <Button className="justify-self-start" onClick={() => setEnd((e) => !e)}>
        Play
      </Button>
    </div>
  );
}

function EaseOut() {
  return <Pair labels={["Ease in", "Ease out"]} a={<Travel easing="cubic-bezier(0.55, 0, 1, 0.45)" />} b={<Travel easing={EASE} />} />;
}

function OriginAware() {
  const body = (
    <div className="grid gap-gap p-1">
      <p className="font-medium">Shops</p>
      <div className="flex gap-gap">
        <Chip selected>All</Chip>
        <Chip>Dago</Chip>
        <Chip>Riau</Chip>
      </div>
    </div>
  );
  return (
    <Pair
      labels={["From the centre", "From the trigger"]}
      a={
        <Popover trigger={<Button>Filter</Button>} className="origin-center">
          {body}
        </Popover>
      }
      b={<Popover trigger={<Button>Filter</Button>}>{body}</Popover>}
    />
  );
}

const STEPS = ["Shop", "Products", "Prices", "Review"];

function Stepper({ slide }: { slide: boolean }) {
  const [state, setState] = React.useState({ i: 0, dir: 1 });
  const go = (d: number) => setState((s) => ({ i: Math.min(STEPS.length - 1, Math.max(0, s.i + d)), dir: d }));
  return (
    <div className="grid w-full gap-gap">
      <div className="overflow-hidden rounded-item bg-fill px-3 py-2.5">
        <div
          key={state.i}
          style={{ "--enc-dir": state.dir, animation: `${slide ? "enc-step" : "enc-fade-only"} 220ms ${EASE}` } as React.CSSProperties}
          className="flex items-baseline justify-between gap-2"
        >
          <span className="font-medium">{STEPS[state.i]}</span>
          <span className="text-ink-muted tabular-nums">
            {state.i + 1} of {STEPS.length}
          </span>
        </div>
      </div>
      <div className="flex gap-gap">
        <Button icon aria-label="Back" disabled={state.i === 0} onClick={() => go(-1)}>
          <ChevronLeft />
        </Button>
        <Button icon aria-label="Next" disabled={state.i === STEPS.length - 1} onClick={() => go(1)}>
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

function DirectionalSteps() {
  return <Pair labels={["Cross-fade", "Slide by direction"]} a={<Stepper slide={false} />} b={<Stepper slide />} />;
}

function IconSwapButton({ blur }: { blur: boolean }) {
  const [done, setDone] = React.useState(false);
  const t = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(t.current), []);
  const icon = (on: boolean) =>
    blur ? cn("absolute transition-[opacity,scale,filter] duration-[180ms] ease-ad", !on && "scale-[0.8] opacity-0 blur-[2px]") : cn("absolute", !on && "opacity-0");
  return (
    <Button
      onClick={() => {
        setDone(true);
        window.clearTimeout(t.current);
        t.current = window.setTimeout(() => setDone(false), 1500);
      }}
    >
      <span className="relative grid size-4 place-items-center">
        <Copy className={icon(!done)} />
        <Check className={icon(done)} />
      </span>
      Copy link
    </Button>
  );
}

function IconSwap() {
  return <Pair a={<IconSwapButton blur={false} />} b={<IconSwapButton blur />} />;
}

function HeightAuto() {
  const [open, setOpen] = React.useState(false);
  const lines = (
    <div className="grid gap-1 text-ink-muted">
      <span>JNE Reguler, 2–3 days</span>
      <span>Jl. Riau 12, Bandung</span>
      <span>Rp 18.000</span>
    </div>
  );
  return (
    <Pair
      labels={["Jumps open", "Eases to its height"]}
      a={
        <div className="grid w-full">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex h-row cursor-pointer items-center rounded-item px-2.5 text-left font-medium hover:bg-fill focus-visible:bg-fill"
          >
            Shipping
          </button>
          {open ? <div className="px-2.5 pb-2 pt-1">{lines}</div> : null}
        </div>
      }
      b={
        <Collapsible title="Shipping" className="w-full">
          {lines}
        </Collapsible>
      }
    />
  );
}

function ThemeCard({ off }: { off: boolean }) {
  const [dark, setDark] = React.useState(false);
  const [switching, setSwitching] = React.useState(false);
  React.useEffect(() => {
    if (!switching) return;
    let b = 0;
    const a = requestAnimationFrame(() => (b = requestAnimationFrame(() => setSwitching(false))));
    return () => (cancelAnimationFrame(a), cancelAnimationFrame(b));
  }, [switching]);
  return (
    <div className="grid w-full gap-gap">
      <div className={cn("grid gap-1.5 rounded-item bg-surface p-3 shadow-card transition-colors duration-[400ms]", dark && "ad-on-dark", switching && "ad-theme-switch")}>
        <span className="font-medium text-ink transition-colors duration-[120ms]">Order 1042</span>
        <span className="text-ink-muted transition-colors duration-[700ms]">Paid, Today 14:05</span>
        <span className="w-fit rounded-item bg-fill px-2 text-ink transition-colors duration-[250ms]">Rp 248.000</span>
      </div>
      <Button
        className="justify-self-start"
        onClick={() => {
          if (off) setSwitching(true);
          setDark((d) => !d);
        }}
      >
        Switch theme
      </Button>
    </div>
  );
}

function ThemeSwitch() {
  return <Pair labels={["Transitions on", "Transitions off"]} a={<ThemeCard off={false} />} b={<ThemeCard off />} />;
}

function Entrance({ reduced }: { reduced: boolean }) {
  const [n, replay] = useReplay();
  return (
    <div className="grid w-full gap-gap">
      <div className="h-[52px]">
        {n > 0 ? (
          <div
            key={n}
            className="w-fit rounded-item bg-fill px-3 py-2 font-medium"
            style={{ animation: reduced ? `ad-fade-in 180ms ${EASE}` : `ad-up 220ms ${EASE}` }}
          >
            Saved
          </div>
        ) : null}
      </div>
      <Button className="justify-self-start" onClick={replay}>
        Play
      </Button>
    </div>
  );
}

function ReducedMotion() {
  const [reduce, setReduce] = React.useState(prefersReducedMotion);
  React.useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduce(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return (
    <>
      <Pair labels={["Full motion", "Reduced motion"]} a={<Entrance reduced={false} />} b={<Entrance reduced />} />
      <p className="px-1 text-ink-muted">Your device: reduce motion {reduce ? "on, so both only fade" : "off"}</p>
    </>
  );
}

function Digits({ value, roll }: { value: number; roll: boolean }) {
  const text = formatNumber(value);
  if (!roll)
    return (
      <span key={value} className="inline-block text-heading font-semibold tabular-nums" style={{ animation: `ad-up 220ms ${EASE}` }}>
        {text}
      </span>
    );
  const chars = [...text];
  return (
    <span className="inline-flex text-heading font-semibold tabular-nums" aria-label={text}>
      {chars.map((c, i) => (
        <span key={chars.length - i} aria-hidden className="inline-block overflow-hidden">
          <span key={c} className="inline-block" style={{ animation: `enc-roll 220ms ${EASE}` }}>
            {c}
          </span>
        </span>
      ))}
    </span>
  );
}

function Counter({ roll }: { roll: boolean }) {
  const [v, setV] = React.useState(1234);
  return (
    <div className="flex w-full items-center justify-between gap-gap">
      <Digits value={v} roll={roll} />
      <Button onClick={() => setV((x) => x + 1)}>Add one</Button>
    </div>
  );
}

function DeltaDigits() {
  return <Pair labels={["Whole number moves", "Only the changed digit"]} a={<Counter roll={false} />} b={<Counter roll />} />;
}

function Ticker({ tabular }: { tabular: boolean }) {
  const [v, setV] = React.useState(1481200);
  React.useEffect(() => {
    const id = window.setInterval(() => setV((x) => x + Math.round(Math.random() * 900) * 1000 - 300000), 450);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className="text-heading font-semibold" style={{ fontVariantNumeric: tabular ? "tabular-nums" : "proportional-nums" }}>
      {formatRp(v)}
    </span>
  );
}

function TabularNums() {
  return <Pair labels={["Proportional", "Tabular"]} a={<Ticker tabular={false} />} b={<Ticker tabular />} />;
}

/* ------------------------------------------------------------ interaction and type */

function TooltipRow() {
  const items = [
    { icon: Bold, label: "Bold" },
    { icon: Italic, label: "Italic" },
    { icon: Underline, label: "Underline" },
    { icon: Link2, label: "Link" },
  ];
  return (
    <div className="flex gap-1">
      {items.map(({ icon: Icon, label }) => (
        <Tooltip key={label} content={label}>
          <Button variant="ghost" icon aria-label={label}>
            <Icon />
          </Button>
        </Tooltip>
      ))}
    </div>
  );
}

function TooltipDelay() {
  return (
    <Pair
      labels={["Every tooltip waits", "Only the first waits"]}
      a={
        <div className="flex gap-1">
          {[Bold, Italic, Underline, Link2].map((Icon, i) => (
            <RT.Provider key={i} delayDuration={300} skipDelayDuration={0}>
              <Tooltip content={["Bold", "Italic", "Underline", "Link"][i]}>
                <Button variant="ghost" icon aria-label={["Bold", "Italic", "Underline", "Link"][i]}>
                  <Icon />
                </Button>
              </Tooltip>
            </RT.Provider>
          ))}
        </div>
      }
      b={
        <RT.Provider delayDuration={300} skipDelayDuration={200}>
          <TooltipRow />
        </RT.Provider>
      }
    />
  );
}

const TAB_LABELS = ["Orders", "Returns", "Payouts"];

function ShiftingTabs() {
  const [v, setV] = React.useState(TAB_LABELS[0]);
  return (
    <div role="tablist" className="inline-flex items-center gap-1">
      {TAB_LABELS.map((t) => (
        <button
          key={t}
          type="button"
          role="tab"
          aria-selected={v === t}
          onClick={() => setV(t)}
          className={cn(
            "h-control cursor-pointer rounded-control px-bubble",
            v === t ? "bg-fill-strong font-semibold text-ink" : "text-ink-muted hover:text-ink focus-visible:bg-fill focus-visible:text-ink",
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function NoWeightShift() {
  return (
    <Pair
      labels={["Bold shifts the row", "Width reserved"]}
      a={<ShiftingTabs />}
      b={
        <Tabs defaultValue={TAB_LABELS[0]}>
          <TabsList>
            {TAB_LABELS.map((t) => (
              <TabsTrigger key={t} value={t}>
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      }
    />
  );
}

const LONG_NAME = "Laporan penjualan Toko Dago November 2026 final revisi.xlsx";

function TruncateMiddle() {
  return (
    <Pair
      labels={["Cut at the end", "Cut in the middle"]}
      a={
        <div className="flex w-full max-w-[240px] items-center gap-2 rounded-item bg-fill px-3 py-2">
          <FileText size={16} className="shrink-0 text-ink-muted" />
          <span className="min-w-0 truncate">{LONG_NAME}</span>
        </div>
      }
      b={<Attachment name={LONG_NAME} meta="48 KB" className="w-full max-w-[240px]" />}
    />
  );
}

function ListNav({ instant }: { instant: boolean }) {
  const rows = ["Dago", "Riau", "Braga", "Cihampelas", "Setiabudi"];
  const [active, setActive] = React.useState(0);
  return (
    <div
      role="listbox"
      tabIndex={0}
      aria-label="Shops"
      aria-activedescendant={`enc-${instant}-${active}`}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          setActive((a) => (a + (e.key === "ArrowDown" ? 1 : rows.length - 1)) % rows.length);
        }
      }}
      className="grid w-full gap-px rounded-item focus-visible:bg-fill"
    >
      {rows.map((r, i) => (
        <div
          key={r}
          id={`enc-${instant}-${i}`}
          role="option"
          aria-selected={i === active}
          onPointerMove={() => setActive(i)}
          className={cn("flex h-7 cursor-pointer items-center rounded-item px-2.5", i === active && "bg-fill-strong", !instant && "transition-colors duration-[300ms] ease-ad")}
        >
          {r}
        </div>
      ))}
    </div>
  );
}

function KeyboardInstant() {
  return (
    <>
      <Pair labels={["Highlight animates", "Highlight is instant"]} a={<ListNav instant={false} />} b={<ListNav instant />} />
      <p className="flex items-center gap-1.5 px-1 text-ink-muted">
        Click a list, then hold <Kbd>↓</Kbd>
      </p>
    </>
  );
}

function SaveButton({ hold }: { hold: boolean }) {
  const [busy, setBusy] = React.useState(false);
  const t = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(t.current), []);
  const save = () => {
    if (busy) return;
    setBusy(true);
    t.current = window.setTimeout(() => setBusy(false), 1400);
  };
  return (
    <div className="flex items-center gap-gap">
      <Button aria-busy={busy} onClick={save}>
        {hold ? (
          <span className="grid">
            <span className={cn("[grid-area:1/1]", busy && "invisible")}>Save</span>
            <span className={cn("[grid-area:1/1]", !busy && "invisible")}>Saving…</span>
          </span>
        ) : busy ? (
          "Saving…"
        ) : (
          "Save"
        )}
      </Button>
      <Button variant="secondary">Cancel</Button>
    </div>
  );
}

function LoadingButton() {
  return <Pair labels={["Width jumps", "Width kept"]} a={<SaveButton hold={false} />} b={<SaveButton hold />} />;
}

const PEOPLE = [
  ["Dewi Lestari", "Rp 1.240.000"],
  ["Budi Santoso", "Rp 860.000"],
  ["Rina Wijaya", "Rp 2.105.000"],
];

function LoadList({ matched }: { matched: boolean }) {
  const [loading, setLoading] = React.useState(false);
  const t = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(t.current), []);
  return (
    <div className="grid w-full gap-gap">
      <div className="grid gap-1">
        {loading && !matched ? (
          <>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </>
        ) : (
          PEOPLE.map(([name, amount]) => (
            <div key={name} className="flex h-7 items-center gap-2">
              {loading ? <Skeleton className="size-5 rounded-full" /> : <span data-shape="round" className="grid size-5 place-items-center rounded-full bg-fill text-[10px] font-semibold">{name[0]}</span>}
              {loading ? <Skeleton className="h-3.5 w-24" /> : <span className="min-w-0 flex-1 truncate">{name}</span>}
              {loading ? <Skeleton className="ml-auto h-3.5 w-20" /> : <span className="tabular-nums">{amount}</span>}
            </div>
          ))
        )}
      </div>
      <Button
        className="justify-self-start"
        onClick={() => {
          setLoading(true);
          window.clearTimeout(t.current);
          t.current = window.setTimeout(() => setLoading(false), 1100);
        }}
      >
        Reload
      </Button>
    </div>
  );
}

function SkeletonMatches() {
  return <Pair labels={["Generic blocks", "Same shape as the rows"]} a={<LoadList matched={false} />} b={<LoadList matched />} />;
}

function EdgeScroller({ fade }: { fade: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [ends, setEnds] = React.useState({ start: true, end: false });
  const measure = React.useCallback(() => {
    const el = ref.current;
    if (el) setEnds({ start: el.scrollLeft < 2, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 2 });
  }, []);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);
  // Mask stops (alpha only, never painted): grey-ok
  const l = ends.start ? "#000" : "transparent";
  const r = ends.end ? "#000" : "transparent"; // mask stop, grey-ok
  return (
    <div
      ref={ref}
      onScroll={measure}
      className="flex w-full gap-gap overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={fade ? { maskImage: `linear-gradient(90deg, ${l}, #000 24px, #000 calc(100% - 24px), ${r})` } : undefined}
    >
      {["All shops", "Dago", "Riau", "Braga", "Cihampelas", "Setiabudi", "Pasteur", "Buah Batu", "Antapani"].map((s, i) => (
        <Chip key={s} selected={i === 0}>
          {s}
        </Chip>
      ))}
    </div>
  );
}

function EdgeFade() {
  return <Pair labels={["Hard cut", "Faded edge"]} a={<EdgeScroller fade={false} />} b={<EdgeScroller fade />} />;
}

function ErrorShake() {
  const [code, setCode] = React.useState("");
  const [status, setStatus] = React.useState<InputOTPStatus>("idle");
  const t = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(t.current), []);
  return (
    <Cell>
      <div className="grid gap-gap">
        <InputOTP
          aria-label="Code"
          length={4}
          value={code}
          status={status}
          onValueChange={(v) => {
            setCode(v);
            if (status !== "idle") setStatus("idle");
          }}
          onComplete={(v) => {
            setStatus(v === "2580" ? "success" : "invalid");
            window.clearTimeout(t.current);
            if (v !== "2580")
              t.current = window.setTimeout(() => {
                setCode("");
                setStatus("idle");
              }, 900);
          }}
        />
        <p className="text-ink-muted">{status === "success" ? "Right code" : status === "invalid" ? "Wrong code, try 2580" : "Type any four digits"}</p>
      </div>
    </Cell>
  );
}

function SafeTriangle() {
  return (
    <Cell>
      <Menu trigger={<Button>Actions</Button>} showSafeArea>
        <MenuItem icon={Edit2}>Rename…</MenuItem>
        <MenuSub label="Share" icon={Share2}>
          <MenuItem>Copy link</MenuItem>
          <MenuItem>WhatsApp</MenuItem>
          <MenuItem>Email</MenuItem>
        </MenuSub>
        <MenuItem icon={Copy}>Duplicate</MenuItem>
        <MenuItem icon={Trash2}>Delete…</MenuItem>
      </Menu>
      <span className="text-ink-muted">Open Share, then move down to it diagonally</span>
    </Cell>
  );
}

/** Rule id → demo. Only rules where trying it teaches more than reading it. */
/** Click a price: the box, the text and the right edge stay put; "Rp" stays fixed and the dots regroup as you type. */
function EditInPlace() {
  const [rows, setRows] = React.useState([
    { name: "Linen shirt, sand", price: 189000, stock: 24 },
    { name: "Canvas tote, olive", price: 99000, stock: 7 },
  ]);
  const set = (i: number, patch: Partial<(typeof rows)[number]>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const digits = (v: string) => (/^\d+$/.test(v) ? null : "Numbers only");
  return (
    <Cell className="w-full">
      <Table className="w-full">
        <THead>
          <tr>
            <TH>Product</TH>
            <TH align="right">Price</TH>
            <TH align="right">Stock</TH>
          </tr>
        </THead>
        <TBody>
          {rows.map((r, i) => (
            <TRow key={r.name}>
              <TD>{r.name}</TD>
              <TD align="right" className="w-36">
                <InlineEdit align="right" aria-label={`${r.name} price`} inputMode="numeric" value={String(r.price)} prefix="Rp" {...grouped} validate={digits} onSave={(v) => set(i, { price: Number(v) })} />
              </TD>
              <TD align="right" className="w-24">
                <InlineEdit align="right" aria-label={`${r.name} stock`} inputMode="numeric" value={String(r.stock)} validate={digits} onSave={(v) => set(i, { stock: Number(v) })} />
              </TD>
            </TRow>
          ))}
        </TBody>
      </Table>
    </Cell>
  );
}

export const DEMOS: Record<string, () => React.ReactNode> = {
  "motion.press-scale": PressScale,
  "motion.enter-scale": EnterScale,
  "motion.under-300ms": Under300,
  "motion.ease-out-default": EaseOut,
  "motion.origin-aware": OriginAware,
  "motion.directional-steps": DirectionalSteps,
  "motion.icon-swap-blur": IconSwap,
  "motion.height-auto": HeightAuto,
  "motion.theme-switch-no-transition": ThemeSwitch,
  "motion.reduced-motion": ReducedMotion,
  "motion.animate-delta-only": DeltaDigits,
  "motion.no-keyboard-animation": KeyboardInstant,
  "ix.tooltip-delay-once": TooltipDelay,
  "ix.safe-triangle": SafeTriangle,
  "type.tabular-nums": TabularNums,
  "type.no-weight-shift": NoWeightShift,
  "type.truncate-middle-filenames": TruncateMiddle,
  "state.loading-button": LoadingButton,
  "state.skeleton-matches": SkeletonMatches,
  "layout.edge-fade": EdgeFade,
  "form.error-shake": ErrorShake,
  "form.edit-in-place": EditInPlace,
};
