import * as React from "react";
import { Check, Copy, Eye, EyeOff, Key } from "react-feather";
import { cn } from "@/lib/ad";
import { fieldBoxClass } from "@/components/ui/input";

// Roots of the passwords people pick most (with the digits and symbols stripped), including local favourites.
const COMMON = new Set(
  "password passw0rd p@ssw0rd qwerty qwertyuiop asdfgh admin administrator welcome letmein iloveyou sunshine football monkey dragon baseball superman princess master login hello shadow changeme trustno abc abcdef abcd qazwsx zxcvbn bismillah indonesia sayang rahasia jakarta".split(
    " ",
  ),
);

export interface Strength {
  /** 0–1: how far along the shape is. */
  score: number;
  strong: boolean;
  short: boolean;
  common: boolean;
}

/** Length toward the minimum, then variety (lower, upper, digit, symbol); a common root or a run caps it low. */
export function passwordStrength(pw: string, minLength = 8): Strength {
  const root = pw.toLowerCase().replace(/[^a-z0-9@]/g, "").replace(/[0-9]+$/, "");
  const common = pw.length > 0 && (COMMON.has(root) || /^(.)\1+$/.test(pw) || "01234567890123456789".includes(pw) || "98765432109876543210".includes(pw));
  const kinds = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  const long = pw.length >= minLength * 2;
  const short = pw.length < minLength;
  const strong = !common && !short && (kinds >= 3 || long);
  const score = common ? Math.min(0.2, pw.length / minLength / 4) : strong ? 1 : Math.min(0.92, (Math.min(pw.length, minLength) / minLength) * 0.65 + (kinds / 4) * 0.3);
  return { score, strong, short, common };
}

/** 12 characters from a set without look-alikes (no 0/O, 1/l/I), shown in groups of four. */
export function suggestPassword() {
  const sets = ["abcdefghjkmnpqrstuvwxyz", "ABCDEFGHJKMNPQRSTUVWXYZ", "23456789"];
  const all = sets.join("");
  const r = crypto.getRandomValues(new Uint32Array(12));
  const out = Array.from(r, (n) => all[n % all.length]);
  // Guarantee one of each kind.
  sets.forEach((s, i) => (out[i * 4 + (r[i] % 4)] = s[r[i] % s.length]));
  return [0, 4, 8].map((i) => out.slice(i, i + 4).join("")).join("-");
}

export interface PasswordInputProps extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type" | "size"> {
  value: string;
  onValueChange: (value: string) => void;
  minLength?: number;
  /** Offer a generated password while the field is empty (new passwords only). */
  suggest?: boolean;
  /** An error from outside (the server, a submit); shown under the field. */
  error?: string;
  /** Show the length error now (after a submit), without waiting for the field to lose focus. */
  submitted?: boolean;
  wrapperClassName?: string;
}

const swap = "absolute transition-[opacity,scale,filter] duration-[160ms] ease-ad";
const off = "opacity-0 scale-[0.8] blur-[2px]";

/**
 * A new-password field that rewards early and complains late: a small progress ring (a faint full track and the
 * filled part) closes as the password gets stronger, with no weak/strong label, and a check draws inside it once it is
 * strong. Nothing complains while you type: "too short" or "too common" shows once you leave the field (or submit),
 * then clears live as you fix it. A weak password never tints the field (only an `error` from outside does). Reveal turns each dot into its
 * letter in place (monospace, so nothing moves). While empty it offers a generated password in groups of four.
 */
export function PasswordInput({ value, onValueChange, minLength = 8, suggest = true, error, submitted, className, wrapperClassName, onBlur, onFocus, ...props }: PasswordInputProps) {
  const [shown, setShown] = React.useState(false);
  const [left, setLeft] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [filled, setFilled] = React.useState<{ value: string; n: number } | null>(null);
  const [copied, setCopied] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  const layer = React.useRef<HTMLSpanElement>(null);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const id = React.useId();
  const s = passwordStrength(value, minLength);
  // Only once you're done with the field (left it with something in it, or submitted); then it re-checks live.
  const done = left || submitted;
  const short = `Use ${minLength} or more characters`;
  const message = error ?? (!done ? null : !value ? (submitted ? short : null) : s.common ? "This password is too common" : s.short ? short : null);
  const suggested = filled?.value === value && value !== "";
  const sync = () => {
    if (layer.current && input.current) layer.current.style.transform = `translateX(${-input.current.scrollLeft}px)`;
  };
  React.useLayoutEffect(sync);

  return (
    <div className={cn("grid gap-1.5", wrapperClassName)}>
      <label className={cn(fieldBoxClass(!!error), "cursor-text")}>
        <span className="relative flex h-full min-w-0 flex-1 items-center overflow-hidden font-mono">
          <input
            ref={input}
            type={shown ? "text" : "password"}
            value={value}
            minLength={minLength}
            autoComplete="new-password"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={!!message || undefined}
            aria-describedby={message ? id : undefined}
            onChange={(e) => onValueChange(e.target.value)}
            onScroll={sync}
            onSelect={sync}
            onFocus={(e) => (setFocused(true), onFocus?.(e))}
            onBlur={(e) => (setFocused(false), setLeft((l) => l || e.target.value !== ""), onBlur?.(e))}
            className={cn("h-full w-full min-w-0 bg-transparent text-body pointer-coarse:text-[16px] text-transparent caret-ink outline-none selection:bg-brand-soft placeholder:font-sans placeholder:text-ink-muted", className)}
            {...props}
          />
          {/* What you see: one cell per character holding its dot and its letter, crossfading in place. */}
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 flex items-center whitespace-pre text-body pointer-coarse:text-[16px] text-ink">
            <span ref={layer} className="flex">
              {value.split("").map((c, i) => (
                <span
                  key={`${filled && suggested ? filled.n : 0}-${i}`}
                  className={cn("inline-grid", suggested && "animate-[ad-pw-in_180ms_var(--ad-ease)_backwards]")}
                  style={{ animationDelay: `${Math.min(i * 16, 200)}ms`, ["--d" as string]: `${Math.min(i * 10, 160)}ms` }}
                >
                  <span className={cn("[grid-area:1/1] transition-[opacity,scale,filter] delay-(--d) duration-[160ms] ease-ad", shown ? off : "")}>•</span>
                  <span className={cn("[grid-area:1/1] transition-[opacity,scale,filter] delay-(--d) duration-[160ms] ease-ad", shown ? "" : off)}>{c}</span>
                </span>
              ))}
            </span>
          </span>
          {suggest && !value && focused ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const p = suggestPassword();
                setFilled((f) => ({ value: p, n: (f?.n ?? 0) + 1 }));
                setShown(true);
                onValueChange(p);
              }}
              className="absolute inset-y-1 left-0 inline-flex cursor-pointer items-center gap-1.5 rounded-item bg-surface px-bubble-sm font-sans text-small font-medium text-ink shadow-sel transition-transform duration-[150ms] ease-ad active:scale-[0.97] animate-[ad-in_180ms_var(--ad-ease)] [&_svg]:size-3.5"
            >
              <Key />
              Use a suggested password
            </button>
          ) : null}
        </span>
        <style href="ad-password" precedence="default">{`@keyframes ad-pw-in { from { opacity: 0; transform: translateY(0.3em); filter: blur(2px); } }`}</style>
        <span className="flex shrink-0 items-center gap-0.5">
          {suggested ? (
            <button
              type="button"
              aria-label="Copy password"
              onClick={(e) => {
                e.stopPropagation();
                void navigator.clipboard?.writeText(value);
                setCopied(true);
                window.clearTimeout(timer.current);
                timer.current = window.setTimeout(() => setCopied(false), 1400);
              }}
              className="relative grid size-6 cursor-pointer place-items-center rounded-item text-ink-muted transition-[background-color,transform] duration-[150ms] ease-ad hover:bg-fill focus-visible:bg-fill active:scale-[0.97]"
            >
              <Copy size={14} className={cn(swap, copied && off)} />
              <Check size={14} className={cn(swap, !copied && off)} />
            </button>
          ) : null}
          <button
            type="button"
            aria-label={shown ? "Hide password" : "Show password"}
            aria-pressed={shown}
            onClick={(e) => (e.stopPropagation(), setShown((x) => !x))}
            className="relative grid size-6 cursor-pointer place-items-center rounded-item text-ink-muted transition-[background-color,transform] duration-[150ms] ease-ad hover:bg-fill focus-visible:bg-fill active:scale-[0.97]"
          >
            <Eye size={14} className={cn(swap, shown && off)} />
            <EyeOff size={14} className={cn(swap, !shown && off)} />
          </button>
          {/* Strength as progress that closes: a faint full track, the filled part running round, then a check drawn inside. */}
          <span role="img" aria-label={!value ? "Password strength" : s.strong ? "Strong password" : `Password strength ${Math.round(s.score * 100)}%`} className="ml-1 grid size-4 place-items-center">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
              <circle cx="12" cy="12" r="9.5" className="stroke-ink-muted" opacity={0.4} />
              <circle
                cx="12"
                cy="12"
                r="9.5"
                pathLength={1}
                strokeDasharray={`${value ? s.score : 0} 1`}
                transform="rotate(-90 12 12)"
                opacity={value ? 1 : 0}
                className="stroke-ink transition-[stroke-dasharray] duration-[220ms] ease-ad"
              />
              <path
                d="M8 12.25l2.75 2.75L16 9.75"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={s.strong ? 0 : 1}
                opacity={s.strong ? 1 : 0}
                className={cn("stroke-ink transition-[stroke-dashoffset,opacity] ease-ad", s.strong ? "delay-[120ms] duration-[160ms]" : "duration-[120ms]")}
              />
            </svg>
          </span>
        </span>
      </label>
      {message ? (
        <span id={id} role="status" className="animate-[ad-fade-in_160ms_var(--ad-ease)] px-1 text-small text-danger">
          {message}
        </span>
      ) : null}
    </div>
  );
}
