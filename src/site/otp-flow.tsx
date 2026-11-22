import * as React from "react";
import { AlertCircle } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { InputOTP, otpLanded, type InputOTPCelebrate, type InputOTPStatus } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Mark } from "./mark";

const TRIES = 3;
const WAIT = 30;
/** The right code is always 1, 2, 3…: shown faintly in the boxes, so anyone can play it. */
const codeOf = (n: number) => "1234567890".slice(0, n);

type Phase = "idle" | "checking" | "wrong" | "open" | "locked";
/** A static state for the component page's State control. */
export type OtpForce = "live" | "checking" | "wrong" | "open";

/**
 * The playable one-time code flow (site only): the right code (123456) shows faintly in the empty boxes; type it.
 * Checking waves across the boxes, a wrong code shakes red and clears, three wrong tries lock it until a new code,
 * the right one locks the boxes and a green check says so. Centred: the label, the boxes, and one line under them
 * that is the status when there is one and the quiet action otherwise.
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
  const sent = codeOf(length);
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
    () => {
      window.clearTimeout(timer.current);
      setCode("");
      setPhase("idle");
      setNotice(null);
      setTries(TRIES);
      setWait(WAIT);
    },
    [],
  );
  // A new length is a new code.
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) return void (first.current = false);
    reset();
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
          placeholder={sent}
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
      {/* One line under the boxes: the status when there is one, the quiet action otherwise. Its height is reserved. */}
      <div id={`${msgId}-msg`} aria-live="polite" className="flex h-control items-center justify-center gap-2 text-body">
        {shown.notice === "checking" ? <span className="text-ink-muted">Checking</span> : null}
        {shown.notice === "wrong" ? (
          <span key={shown.tries} className="flex animate-[ad-in_220ms_var(--ad-ease)] items-center gap-1.5 text-danger">
            <AlertCircle size={16} />
            Wrong code · {shown.tries} {shown.tries === 1 ? "try" : "tries"} left
          </span>
        ) : null}
        {shown.notice === "open" ? (
          <>
            <Opened delay={otpLanded(celebrate)} icon={celebrate !== "seal"} text={done} />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => live && reset()}
              className="animate-[ad-fade-in_220ms_var(--ad-ease)_both]"
              style={{ animationDelay: `${otpLanded(celebrate) + 200}ms` }}
            >
              Start over
            </Button>
          </>
        ) : null}
        {shown.notice === "locked" || !shown.notice ? (
          <Button
            size="sm"
            variant={shown.phase === "locked" ? "secondary" : "ghost"}
            disabled={!canResend && live}
            onClick={() => live && reset()}
            className="tabular-nums"
          >
            {shown.phase === "locked" ? "Too many tries · Send a new code" : canResend || !live ? "Send a new code" : `Send a new code in 0:${String(wait).padStart(2, "0")}`}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** "Till open" follows the boxes: a check circle draws itself, then the words slide in beside it. */
function Opened({ delay, icon, text }: { delay: number; icon: boolean; text: string }) {
  const draw = (at: number) => ({ animation: `ad-otp-draw 320ms var(--ad-ease) ${delay + at}ms forwards` });
  return (
    <span className="flex items-center gap-1.5 font-medium text-ink">
      {icon ? (
        <svg
          className="text-success"
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
