import * as React from "react";
import { cn } from "@/lib/ad";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MobileSheet } from "./mobile-sheet";
import { MobileStateButton, type MobileButtonState } from "./mobile-state-button";

/** True where this browser can sign in with a passkey (WebAuthn). Otherwise skip straight to the code. */
export const passkeysSupported = () => typeof window !== "undefined" && "PublicKeyCredential" in window;

export interface MobilePasskeySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Who is signing in. */
  name: string;
  avatar?: string;
  /** Run `navigator.credentials.get({ publicKey })` and verify it. Reject when it fails or is cancelled. */
  onAuthenticate: () => Promise<void>;
  /** Signed in: the ring has closed. */
  onDone: () => void;
  /** The way in without a passkey. Always offered. */
  onUseCode: () => void;
}

/**
 * Sign in with Face ID or a fingerprint: who, one button, and a ring that closes around their picture while the phone
 * checks. A failure opens the ring back up and keeps the same button; a one-time code is always one tap away.
 */
export function MobilePasskeySheet({ open, onOpenChange, name, avatar, onAuthenticate, onDone, onUseCode }: MobilePasskeySheetProps) {
  const [state, setState] = React.useState<MobileButtonState>("idle");
  const [failed, setFailed] = React.useState(false);
  const timer = React.useRef(0);
  React.useEffect(() => {
    if (open) {
      setState("idle");
      setFailed(false);
    }
    return () => window.clearTimeout(timer.current);
  }, [open]);
  const go = async () => {
    setFailed(false);
    setState("busy");
    try {
      await onAuthenticate();
      setState("done");
      timer.current = window.setTimeout(onDone, 520);
    } catch {
      setState("idle");
      setFailed(true);
    }
  };
  const C = 2 * Math.PI * 43;
  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      aria-label={`Sign in as ${name}`}
      footer={
        <>
          <MobileStateButton variant="primary" state={state} busyLabel="Checking" doneLabel="Signed in" onClick={go}>
            {failed ? "Try again" : "Continue with passkey"}
          </MobileStateButton>
          <Button onClick={onUseCode} disabled={state !== "idle"} className="h-touch text-[15px]">
            Use a code instead
          </Button>
        </>
      }
    >
      <div className="grid justify-items-center gap-3 pb-2 pt-2">
        <span className="relative grid size-[92px] place-items-center">
          <svg aria-hidden viewBox="0 0 92 92" className="absolute inset-0 -rotate-90">
            <circle cx="46" cy="46" r="43" fill="none" strokeWidth="3" className="stroke-fill" />
            <circle
              cx="46"
              cy="46"
              r="43"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={state === "idle" ? C : state === "busy" ? C * 0.3 : 0}
              className={cn("stroke-ink ease-ad motion-reduce:transition-none", state === "busy" ? "transition-[stroke-dashoffset] duration-[1200ms]" : "transition-[stroke-dashoffset] duration-[320ms]")}
            />
          </svg>
          <Avatar name={name} src={avatar} size="lg" className="size-[72px] text-[24px]" />
        </span>
        <h2 className="text-[20px] font-semibold text-ink">{name}</h2>
        <p role="status" className="h-5 text-[14px] text-danger">{failed ? "That didn't work" : ""}</p>
      </div>
    </MobileSheet>
  );
}
