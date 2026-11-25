import * as React from "react";
import { Check } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export type Question =
  | { name: string; title: string; type: "single" | "multiple"; options: string[]; required?: boolean; other?: boolean }
  | { name: string; title: string; type: "text"; placeholder?: string; required?: boolean };

export type Answers = Record<string, string | string[]>;

const STEP_CSS = `
@keyframes ad-step-next { from { opacity: 0; transform: translateX(16px); } }
@keyframes ad-step-back { from { opacity: 0; transform: translateX(-16px); } }`;

export interface QuestionnaireProps {
  questions: Question[];
  onSubmit: (answers: Answers) => void;
  /** Allow skipping optional questions. */
  skippable?: boolean;
  submitLabel?: string;
  className?: string;
}

/**
 * Questions one at a time (an agent asking before it acts, a setup flow). Choices are whole-row soft cards; the chosen
 * one turns solid ink with a check. A slim segmented progress on top, Back and Next at the bottom right, Enter goes
 * on. Required questions say so only when you try to skip them.
 */
export function Questionnaire({ questions, onSubmit, skippable = true, submitLabel = "Send answers", className }: QuestionnaireProps) {
  const [i, setI] = React.useState(0);
  const [answers, setAnswers] = React.useState<Answers>({});
  const [error, setError] = React.useState(false);
  const [dir, setDir] = React.useState<1 | -1>(1);
  const go = (to: number) => (setDir(to > i ? 1 : -1), setI(to));
  const q = questions[i];
  const a = answers[q.name];
  const last = i === questions.length - 1;
  const filled = Array.isArray(a) ? a.length > 0 : !!a?.trim?.();
  const set = (v: string | string[]) => (setAnswers((o) => ({ ...o, [q.name]: v })), setError(false));
  const next = (skip = false) => {
    if (!skip && q.required && !filled) return setError(true);
    if (last) onSubmit(answers);
    else go(i + 1);
  };
  const pick = (o: string) => {
    if (q.type === "multiple") {
      const cur = Array.isArray(a) ? a : [];
      set(cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o]);
    } else set(o);
  };
  const on = (o: string) => (Array.isArray(a) ? a.includes(o) : a === o);
  return (
    <form
      className={cn("grid gap-4", className)}
      onSubmit={(e) => {
        e.preventDefault();
        next();
      }}
    >
      <div className="flex gap-1" aria-label={`Question ${i + 1} of ${questions.length}`} role="progressbar" aria-valuenow={i + 1} aria-valuemin={1} aria-valuemax={questions.length}>
        {questions.map((_, j) => (
          <span key={j} className={cn("h-1 flex-1 rounded-full transition-colors duration-[220ms] ease-ad", j <= i ? "bg-on" : "bg-fill-strong")} />
        ))}
      </div>
      <style href="ad-questionnaire" precedence="default">{STEP_CSS}</style>
      <div key={i} className={cn("grid gap-4", i > 0 || dir < 0 ? (dir > 0 ? "animate-[ad-step-next_220ms_var(--ad-ease)]" : "animate-[ad-step-back_220ms_var(--ad-ease)]") : null)}>
        <h3 className="text-title font-semibold text-ink">{q.title}</h3>
        {q.type === "text" ? (
          <Textarea rows={3} value={(a as string) ?? ""} placeholder={q.placeholder} onChange={(e) => set(e.target.value)} invalid={error} aria-label={q.title} />
        ) : (
          <div role={q.type === "single" ? "radiogroup" : "group"} aria-label={q.title} className="grid gap-1">
            {q.options.map((o) => (
              <button
                key={o}
                type="button"
                role={q.type === "single" ? "radio" : "checkbox"}
                aria-checked={on(o)}
                onClick={() => pick(o)}
                className={cn(
                  "flex h-control w-full cursor-pointer items-center gap-2.5 rounded-control px-3 text-left text-body ad-press active:scale-[0.99]",
                  on(o)
                    ? "bg-fill-strong font-medium text-ink focus-visible:brightness-[0.88] dark:focus-visible:brightness-[0.78]"
                    : "bg-fill text-ink hover:bg-fill-strong focus-visible:bg-fill-strong",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{o}</span>
                {on(o) ? <Check size={16} className="shrink-0" /> : null}
              </button>
            ))}
          </div>
        )}
        {error ? <p role="alert" className="-mt-2 text-body text-danger">{q.type === "text" ? "Answer this to go on" : q.type === "multiple" ? "Pick at least one to go on" : "Pick one to go on"}</p> : null}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-gap">
        {i > 0 ? (
          <Button variant="secondary" className="mr-auto" onClick={() => (go(i - 1), setError(false))}>
            Back
          </Button>
        ) : null}
        {skippable && !q.required && !last ? (
          <Button variant="ghost" onClick={() => next(true)}>
            Skip
          </Button>
        ) : null}
        <Button type="submit" variant={last ? "primary" : "secondary"}>
          {last ? submitLabel : "Next"}
        </Button>
      </div>
    </form>
  );
}
