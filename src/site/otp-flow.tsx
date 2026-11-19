import * as React from "react";
import { AlertCircle } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { InputOTP, otpLanded, type InputOTPCelebrate, type InputOTPStatus } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Mark } from "./mark";

const TRIES = 3;
const WAIT = 30;
const newCode = (n: number) => String(Math.floor(10 ** (n - 1) + Math.random() * 9 * 10 ** (n - 1)));

type Phase = "idle" | "checking" | "wrong" | "open" | "locked";
/** A static state for the component page's State control. */
export type OtpForce = "live" | "checking" | "wrong" | "open";

/**
 * The playable one-time code flow (site only): a WhatsApp message with the code fills the boxes on tap (or type it),
 * checking waves across the boxes, a wrong code shakes red and clears, three wrong tries lock it until a new code,
 * the right one turns the boxes green. Centred: boxes, one status line, one quiet action.
 */
export function OtpFlow({
  length = 6,
  force = "live",
  label = "Code from WhatsApp",
  done = "Till open",
  marks,
  celebrate = "join",
  className,
}: {
  length?: number;
  force?: OtpForce;
  label?: string;
  done?: string;
  marks?: boolean;
  celebrate?: InputOTPCelebrate;
  className?: string;
}) {
  const [sent, setSent] = React.useState(() => (length === 6 ? "482193" : "4821"));
  const [code, setCode] = React.useState("");
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [notice, setNotice] = React.useState<Phase | null>(null);
  const [tries, setTries] = React.useState(TRIES);
  const [wait, setWait] = React.useState(WAIT);
  const input = React.useRef<HTMLInputElement>(null);
  const timer = React.useRef<number>(undefined);
  const msgId = React.useId();

  React.useEffect(() => {
    if (!wait || force !== "live") return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait, force]);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const reset = React.useCallback(
    (n = length) => {
      window.clearTimeout(timer.current);
      setSent(newCode(n));
      setCode("");
      setPhase("idle");
      setNotice(null);
      setTries(TRIES);
      setWait(WAIT);
    },
    [length],
  );
  // A new length is a new code.
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) return void (first.current = false);
    reset(length);
  }, [length, reset]);

  const check = (v: string) => {
    window.clearTimeout(timer.current);
    setPhase("checking");
    setNotice("checking");
    timer.current = window.setTimeout(() => {
      if (v === sent) {
        setPhase("open");
        setNotice("open");
        return;
      }
      const left = tries - 1;
      setTries(left);
      // Red and a shake first; then the boxes clear (and, after the last try, fade until a new code).
      setPhase("wrong");
      setNotice(left ? "wrong" : "locked");
      timer.current = window.setTimeout(() => {
        setCode("");
        setPhase(left ? "idle" : "locked");
        if (left) input.current?.focus();
      }, 1100);
    }, 750);
  };

  // The component page's State control shows each state still.
  const shown: {
    phase: Phase;
    code: string;
    notice: Phase | null;
    tries: number;
  } =
    force === "checking"
      ? { phase: "checking", code: sent, notice: "checking", tries: TRIES }
      : force === "wrong"
        ? {
            phase: "wrong",
            code: sent.slice(0, -1) + ((Number(sent.at(-1)) + 1) % 10),
            notice: "wrong",
            tries: TRIES - 1,
          }
        : force === "open"
          ? { phase: "open", code: sent, notice: "open", tries: TRIES }
          : { phase, code, notice, tries };
  const status: InputOTPStatus = shown.phase === "checking" ? "checking" : shown.phase === "wrong" ? "invalid" : shown.phase === "open" ? "success" : "idle";
  const live = force === "live";
  const canResend = shown.phase === "locked" || (wait === 0 && shown.phase !== "open");

  return (
    <div className={cn("flex flex-col items-center gap-3 text-center", className)}>
      <Spot on={marks} name="label">
        <Label htmlFor={`${msgId}-code`}>{label}</Label>
      </Spot>
      <Spot on={marks} name="input-otp">
        <InputOTP
          id={`${msgId}-code`}
          ref={input}
          aria-label={label}
          aria-describedby={`${msgId}-msg`}
          length={length}
          group={length === 6 ? 3 : 0}
          value={shown.code}
          status={status}
          celebrate={celebrate}
          disabled={shown.phase === "locked"}
          onValueChange={(v) => {
            if (!live) return;
            setCode(v);
            if (notice === "wrong" && v) setNotice(null);
          }}
          onComplete={(v) => live && check(v)}
        />
      </Spot>
      <div id={`${msgId}-msg`} aria-live="polite" className="flex h-item items-center justify-center gap-1.5 text-body">
        {shown.notice === "checking" ? <span className="text-ink-muted">Checking</span> : null}
        {shown.notice === "wrong" ? (
          <span key={shown.tries} className="flex animate-[ad-in_220ms_var(--ad-ease)] items-center gap-1.5 text-danger">
            <AlertCircle size={16} />
            Wrong code · {shown.tries} {shown.tries === 1 ? "try" : "tries"} left
          </span>
        ) : null}
        {shown.notice === "locked" ? (
          <span className="flex animate-[ad-in_220ms_var(--ad-ease)] items-center gap-1.5 text-danger">
            <AlertCircle size={16} />
            Too many tries. Send a new code.
          </span>
        ) : null}
        {shown.notice === "open" ? <Opened delay={otpLanded(length, celebrate)} icon={celebrate !== "seal"} text={done} /> : null}
      </div>
      {shown.phase === "open" ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => live && reset()}
          className="animate-[ad-fade-in_220ms_var(--ad-ease)_both]"
          style={{ animationDelay: `${otpLanded(length, celebrate) + 200}ms` }}
        >
          Start over
        </Button>
      ) : (
        <Button
          size="sm"
          variant={shown.phase === "locked" ? "secondary" : "ghost"}
          disabled={!canResend && live}
          onClick={() => live && reset()}
          className="tabular-nums"
        >
          {canResend || !live ? "Send a new code" : `Send a new code in 0:${String(wait).padStart(2, "0")}`}
        </Button>
      )}
      {live ? (
        <button
          type="button"
          aria-label={`Fill the code from WhatsApp, ${sent}`}
          disabled={shown.phase !== "idle"}
          onClick={() => (setCode(sent), setNotice(null), check(sent))}
          className="mt-2 grid w-full max-w-80 cursor-pointer gap-0.5 rounded-control bg-fill px-3 py-2.5 text-left transition-[background-color,opacity] duration-[220ms] ease-ad hover:bg-fill-strong focus-visible:bg-fill-strong disabled:cursor-default disabled:opacity-45"
        >
          <span className="flex justify-between text-small text-ink-muted">
            <span>WhatsApp</span>
            <span>now</span>
          </span>
          <span className="text-body text-ink">
            Your Alora code is <span className="font-semibold tabular-nums">{length === 6 ? `${sent.slice(0, 3)} ${sent.slice(3)}` : sent}</span>
          </span>
        </button>
      ) : null}
    </div>
  );
}

/** "Till open" follows the boxes: a check circle draws itself, then the words slide in beside it. */
function Opened({ delay, icon, text }: { delay: number; icon: boolean; text: string }) {
  const draw = (at: number) => ({ animation: `ad-otp-draw 320ms var(--ad-ease) ${delay + at}ms forwards` });
  return (
    <span className="flex items-center gap-1.5 font-medium text-success">
      {icon ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="9.5" pathLength={1} strokeDasharray={1} strokeDashoffset={1} transform="rotate(-90 12 12)" style={draw(0)} />
          <path d="M8 12.5l2.75 2.75L16.25 9.5" pathLength={1} strokeDasharray={1} strokeDashoffset={1} style={draw(220)} />
        </svg>
      ) : null}
      <span className="animate-[ad-otp-rise_260ms_var(--ad-ease)_both]" style={{ animationDelay: `${delay + (icon ? 120 : 0)}ms` }}>
        {text}
      </span>
    </span>
  );
}

/** On the landing, the parts carry their component marks; on the component page they don't. */
const Spot = ({ on, name, children }: { on?: boolean; name: string; children: React.ReactNode }) =>
  on ? (
    <Mark name={name} className="w-fit max-w-full">
      {children}
    </Mark>
  ) : (
    <>{children}</>
  );
