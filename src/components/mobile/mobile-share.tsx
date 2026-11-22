import * as React from "react";
import { Link2, Mail, MessageCircle } from "react-feather";
import { MobileList, MobileListRow } from "./mobile-list";
import { MobileSheet } from "./mobile-sheet";
import { MobileStateButton, type MobileButtonState } from "./mobile-state-button";

export interface ShareData {
  title: string;
  text?: string;
  url: string;
}

/**
 * Share through the phone's own sheet when it has one. Resolves "shared", "cancelled", or "fallback" (no Web Share here:
 * open MobileShareSheet). Call it straight from a tap.
 */
export async function shareNative(data: ShareData): Promise<"shared" | "cancelled" | "fallback"> {
  if (typeof navigator === "undefined" || !navigator.share || (navigator.canShare && !navigator.canShare(data))) return "fallback";
  try {
    await navigator.share(data);
    return "shared";
  } catch (e) {
    return (e as DOMException).name === "AbortError" ? "cancelled" : "fallback";
  }
}

export interface MobileShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ShareData;
}

/** The fallback for browsers without Web Share: WhatsApp, email, and the link with a Copy button that confirms in place. */
export function MobileShareSheet({ open, onOpenChange, data }: MobileShareSheetProps) {
  const [copy, setCopy] = React.useState<MobileButtonState>("idle");
  const timer = React.useRef(0);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const body = [data.text, data.url].filter(Boolean).join(" ");
  const go = (href: string) => {
    window.open(href, "_blank", "noopener");
    onOpenChange(false);
  };
  const doCopy = async () => {
    setCopy("busy");
    try {
      await navigator.clipboard.writeText(data.url);
      setCopy("done");
      timer.current = window.setTimeout(() => setCopy("idle"), 1600);
    } catch {
      setCopy("idle");
    }
  };
  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      title={data.title}
      footer={
        <MobileStateButton state={copy} doneLabel="Copied" onClick={doCopy}>
          <Link2 />
          Copy link
        </MobileStateButton>
      }
    >
      <MobileList>
        <MobileListRow media={<MessageCircle />} title="WhatsApp" chevron onClick={() => go(`https://wa.me/?text=${encodeURIComponent(body)}`)} />
        <MobileListRow media={<Mail />} title="Email" chevron onClick={() => go(`mailto:?subject=${encodeURIComponent(data.title)}&body=${encodeURIComponent(body)}`)} />
      </MobileList>
    </MobileSheet>
  );
}
