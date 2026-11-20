import * as React from "react";
import { useSearchParams } from "react-router";
import { Clock, ExternalLink, Filter, Play, Search as SearchIcon } from "react-feather";
import {
  ALIASES,
  CATEGORIES,
  DROPPED,
  LEVELS,
  RULES,
  SOURCES,
  aliasesOf,
  forPlatform,
  platformOf,
  resolveRuleId,
  rulesIn,
  sourceById,
  type Level,
  type Rule,
} from "@/lib/encyclopedia";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyChip } from "@/components/ui/copy-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Popover } from "@/components/ui/popover";
import { Search } from "@/components/ui/search";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { PageHeader, Toolbar } from "@/components/ui/toolbar";
import { DEMOS, DemoFrame } from "./encyclopedia-demos";

// /encyclopedia: every UI rule the library follows, searchable and filterable, with live demos for the motion and
// interaction rules. Filters live in the URL (q, cat, level, platform, demos; rule opens one rule, old ids included).
// Data: src/lib/encyclopedia.ts.

type LevelFilter = Level | "all";
type PlatformFilter = "all" | "desktop" | "mobile";

/** Inline `code` in rule text becomes a code chip. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("`").map((part, i) =>
        i % 2 ? (
          <code key={i} className="rounded-small bg-fill px-1 py-px font-mono text-[0.92em] text-ink [overflow-wrap:anywhere]">
            {part}
          </code>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}

const plain = (s: string) => s.replace(/`/g, "");
const levelTitle = (l: Level) => LEVELS.find((x) => x.id === l)!.title;

/** The text a search runs over: everything an agent or a person might type, old ids included. */
const haystack = new Map(
  RULES.map((r) => [
    r.id,
    [r.id, ...aliasesOf(r.id), r.title, r.rule, r.why, r.how, r.check, r.context ?? "", r.exempt ?? "", ...r.sources.map((s) => sourceById(s)?.name ?? "")]
      .join(" ")
      .toLowerCase(),
  ]),
);

/** Off toggles in this toolbar rest on the secondary fill, so they read as controls next to the select and segments. */
const TOOL_TOGGLE = "data-[state=off]:bg-fill data-[state=off]:hover:bg-fill-strong data-[state=off]:focus-visible:bg-fill-strong";

const ruleTitle = (id: string) => RULES.find((r) => r.id === id)?.title ?? id;

function RuleBody({ rule: r }: { rule: Rule }) {
  const Demo = DEMOS[r.id];
  const rows: [string, React.ReactNode][] = [
    ["Why", <Rich text={r.why} />],
    ["How", <Rich text={r.how} />],
    ["Check", <Rich text={r.check} />],
    ...(r.exempt ? ([["Exempt", <Rich text={r.exempt} />]] as [string, React.ReactNode][]) : []),
    ...(aliasesOf(r.id).length ? ([["Old ids", <Rich text={aliasesOf(r.id).map((a) => `\`${a}\``).join(" ")} />]] as [string, React.ReactNode][]) : []),
    [
      "Sources",
      r.sources.length ? (
        <span className="flex flex-wrap gap-x-3 gap-y-1">
          {r.sources.map((id) => {
            const s = sourceById(id);
            return s ? (
              <a key={id} href={s.url} target="_blank" rel="noreferrer" className="rounded-small text-ink underline-offset-[0.2em] hover:underline focus-visible:underline">
                {s.name}
              </a>
            ) : null;
          })}
        </span>
      ) : (
        "Alora Design"
      ),
    ],
  ];
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 text-ink">
      <p className="max-w-[880px] text-pretty">
        <Rich text={r.rule} />
      </p>
      {r.context ? (
        <p className="max-w-[880px] text-pretty text-ink-muted">
          <Rich text={r.context} />
        </p>
      ) : null}
      <dl className="grid max-w-[880px] gap-x-4 gap-y-1 sm:grid-cols-[64px_minmax(0,1fr)] sm:gap-y-2.5">
        {rows.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt className="text-ink-muted max-sm:mt-1.5">{k}</dt>
            <dd className="min-w-0 text-pretty [overflow-wrap:anywhere]">{v}</dd>
          </React.Fragment>
        ))}
      </dl>
      {Demo ? (
        <DemoFrame>
          <Demo />
        </DemoFrame>
      ) : null}
      <div className="flex flex-wrap items-center gap-gap">
        <CopyChip value={r.id} />
        <span className="text-ink-muted">{levelTitle(r.level)}</span>
        <span className="text-ink-muted">{platformOf(r) === "both" ? "Desktop and mobile" : platformOf(r) === "mobile" ? "Mobile" : "Desktop"}</span>
      </div>
    </div>
  );
}

/** While on, every running animation and transition on the page plays at a quarter speed. */
function useSlowMotion(on: boolean) {
  React.useEffect(() => {
    if (!on || typeof document.getAnimations !== "function") return;
    let id = 0;
    const tick = () => {
      for (const a of document.getAnimations()) if (a.playbackRate === 1) a.playbackRate = 0.25;
      id = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(id);
      for (const a of document.getAnimations()) a.playbackRate = 1;
    };
  }, [on]);
}

export function EncyclopediaPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const cat = CATEGORIES.some((c) => c.id === params.get("cat")) ? params.get("cat")! : "all";
  const level: LevelFilter = LEVELS.some((l) => l.id === params.get("level")) ? (params.get("level") as Level) : "all";
  const demosOnly = params.get("demos") === "1";
  const platform: PlatformFilter = params.get("platform") === "desktop" || params.get("platform") === "mobile" ? (params.get("platform") as PlatformFilter) : "all";
  const [openRule, setOpenRule] = React.useState(() => resolveRuleId(params.get("rule") ?? "") ?? null);
  const [slow, setSlow] = React.useState(false);
  useSlowMotion(slow);

  const set = (key: string, value: string | null) =>
    setParams(
      (p) => {
        const next = new URLSearchParams(p);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );

  const deferredQ = React.useDeferredValue(q);
  const terms = deferredQ.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = RULES.filter(
    (r) =>
      (cat === "all" || r.category === cat) &&
      (level === "all" || r.level === level) &&
      (platform === "all" || forPlatform(r, platform)) &&
      (!demosOnly || DEMOS[r.id]) &&
      terms.every((t) => haystack.get(r.id)!.includes(t)),
  );
  const sections = CATEGORIES.map((c) => ({ ...c, rules: rulesIn(c.id, shown) })).filter((c) => c.rules.length);
  const filtered = shown.length !== RULES.length;

  React.useEffect(() => {
    if (openRule) document.querySelector(`[data-rule="${CSS.escape(openRule)}"]`)?.scrollIntoView({ block: "center" });
  }, [openRule]);

  /** Opens a rule from the old-id list: clears filters that would hide it, then opens and scrolls to it. */
  const goTo = (id: string) => {
    setParams(
      (p) => {
        const next = new URLSearchParams();
        for (const [k, v] of p) if (!["q", "cat", "level", "platform", "demos", "rule"].includes(k)) next.set(k, v);
        next.set("rule", id);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
    setOpenRule(id);
  };

  const levelFilter = (
    <Segmented<LevelFilter>
      aria-label="Level"
      value={level}
      onValueChange={(v) => set("level", v === "all" ? null : v)}
      options={[{ value: "all", label: "All" }, ...LEVELS.map((l) => ({ value: l.id, label: l.title }))]}
    />
  );
  const platformFilter = (
    <Segmented<PlatformFilter>
      aria-label="Platform"
      value={platform}
      onValueChange={(v) => set("platform", v === "all" ? null : v)}
      options={[
        { value: "all", label: "Any" },
        { value: "desktop", label: "Desktop" },
        { value: "mobile", label: "Mobile" },
      ]}
    />
  );
  const demosToggle = (
    <Toggle pressed={demosOnly} onPressedChange={(on) => set("demos", on ? "1" : null)} className={TOOL_TOGGLE}>
      <Play />
      Demos
    </Toggle>
  );
  const narrowed = (level !== "all" ? 1 : 0) + (platform !== "all" ? 1 : 0) + (demosOnly ? 1 : 0);

  return (
    <main data-encyclopedia className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-6 px-4 pb-24 pt-2 sm:px-6">
      <PageHeader
        title={
          <>
            Encyclopedia{" "}
            <span data-rule-count className="font-normal tabular-nums text-ink-muted">
              {filtered ? `${shown.length} of ${RULES.length}` : RULES.length}
            </span>
          </>
        }
      />
      <Toolbar>
        <Search value={q} onValueChange={(v) => set("q", v || null)} placeholder="Search rules" aria-label="Search rules" wrapperClassName="w-full sm:w-64" />
        <Select
          aria-label="Category"
          value={cat}
          onValueChange={(v) => set("cat", v === "all" ? null : v)}
          options={[{ value: "all", label: "All categories" }, ...CATEGORIES.map((c) => ({ value: c.id, label: c.title }))]}
        />
        {/* Phones: level, platform and demos fold into one Filter popover, so the toolbar is two rows, not five. */}
        <div className="contents max-sm:hidden">
          {levelFilter}
          {platformFilter}
          {demosToggle}
        </div>
        <div className="sm:hidden">
          <Popover
            trigger={
              <Button>
                <Filter />
                Filter
                {narrowed ? <span className="tabular-nums text-ink-muted">{narrowed}</span> : null}
              </Button>
            }
          >
            <div className="grid justify-items-start gap-gap">
              {levelFilter}
              {platformFilter}
              {demosToggle}
            </div>
          </Popover>
        </div>
        <Toggle pressed={slow} onPressedChange={setSlow} className={TOOL_TOGGLE}>
          <Clock />
          Slow motion
        </Toggle>
      </Toolbar>

      {sections.length ? (
        sections.map((c) => (
          <section key={c.id} aria-labelledby={`cat-${c.id}`} className="grid min-w-0 grid-cols-1 gap-3">
            <h2 id={`cat-${c.id}`} className="text-balance px-1 text-title font-semibold text-ink">
              {c.title} <span className="font-normal tabular-nums text-ink-muted">{c.rules.length}</span>
            </h2>
            <Card inset="nest">
              <Accordion
                key={openRule && c.rules.some((r) => r.id === openRule) ? openRule : undefined}
                type="multiple"
                className="grid-cols-1"
                defaultValue={openRule && c.rules.some((r) => r.id === openRule) ? [openRule] : undefined}
                items={c.rules.map((r) => ({
                  value: r.id,
                  title: (
                    <span data-rule={r.id}>
                      <span className="text-ink">{r.title}</span>
                      <span className="ml-2 font-normal text-ink-muted group-data-[state=open]:hidden max-sm:hidden">{plain(r.rule)}</span>
                    </span>
                  ),
                  meta: (
                    <span className="flex items-center gap-3">
                      {DEMOS[r.id] ? <span>Demo</span> : null}
                      {platformOf(r) !== "both" ? <span data-platform={platformOf(r)}>{platformOf(r) === "mobile" ? "Mobile" : "Desktop"}</span> : null}
                      {r.level !== "should" ? <span>{levelTitle(r.level)}</span> : null}
                    </span>
                  ),
                  content: <RuleBody rule={r} />,
                }))}
              />
            </Card>
          </section>
        ))
      ) : (
        <Card>
          <EmptyState icon={SearchIcon} title="No rules match" />
        </Card>
      )}

      <section aria-labelledby="old-ids" className="grid min-w-0 grid-cols-1 gap-3 pt-6">
        <h2 id="old-ids" className="px-1 text-title font-semibold text-ink">
          Old ids <span className="font-normal tabular-nums text-ink-muted">{Object.keys(ALIASES).length + Object.keys(DROPPED).length}</span>
        </h2>
        <Card inset="nest">
          <Accordion
            type="multiple"
            className="grid-cols-1"
            items={[
              {
                value: "merged",
                title: "Merged or renamed",
                meta: <span className="tabular-nums">{Object.keys(ALIASES).length}</span>,
                content: (
                  <ul className="grid max-w-[880px] gap-px">
                    {Object.entries(ALIASES).map(([from, to]) => (
                      <li key={from}>
                        <button
                          type="button"
                          onClick={() => goTo(to)}
                          className="flex min-h-row w-full cursor-pointer flex-wrap items-baseline gap-x-3 rounded-item px-2.5 py-1.5 text-left hover:bg-fill focus-visible:bg-fill"
                        >
                          <code className="font-mono text-[0.92em] text-ink-muted">{from}</code>
                          <span className="text-ink">{ruleTitle(to)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ),
              },
              {
                value: "dropped",
                title: "Dropped",
                meta: <span className="tabular-nums">{Object.keys(DROPPED).length}</span>,
                content: (
                  <dl className="grid max-w-[880px] items-baseline gap-x-4 gap-y-1 px-2.5 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-y-2.5">
                    {Object.entries(DROPPED).map(([id, why]) => (
                      <React.Fragment key={id}>
                        <dt className="font-mono text-[0.92em] text-ink-muted max-sm:mt-1.5">{id}</dt>
                        <dd className="min-w-0 text-pretty text-ink">
                          <Rich text={why} />
                        </dd>
                      </React.Fragment>
                    ))}
                  </dl>
                ),
              },
            ]}
          />
        </Card>
      </section>

      <section aria-labelledby="sources" className="grid min-w-0 grid-cols-1 gap-3 pt-6">
        <h2 id="sources" className="px-1 text-title font-semibold text-ink">
          Sources
        </h2>
        <Card inset="nest">
          <ul className="grid gap-px">
            {SOURCES.map((s) => {
              const n = RULES.filter((r) => r.sources.includes(s.id)).length;
              return (
                <li key={s.id}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-row items-center gap-3 rounded-item px-2.5 py-1.5 hover:bg-fill focus-visible:bg-fill"
                  >
                    <span className="grid min-w-0 flex-1 gap-x-3 sm:flex sm:items-baseline">
                      <span className="font-medium text-ink">{s.name}</span>
                      <span className="text-ink-muted">{s.licence}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-ink-muted">{n === 1 ? "1 rule" : `${n} rules`}</span>
                    <ExternalLink size={16} className="shrink-0 text-ink-muted" />
                  </a>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>
    </main>
  );
}
