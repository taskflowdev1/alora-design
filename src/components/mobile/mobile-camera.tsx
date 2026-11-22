import * as React from "react";

export type CameraStatus = "idle" | "starting" | "live" | "denied" | "unavailable";

interface Detector {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
}
type DetectorClass = new (options: { formats: string[] }) => Detector;

const FORMATS = ["ean_13", "ean_8", "code_128", "qr_code"];

/**
 * The back camera for scanning: `start()` from a tap, `video` goes in MobileScanner's `camera` slot. Reads codes with
 * BarcodeDetector where the browser has it; elsewhere the picture still shows and typing the code stays available
 * (bring a decoder such as ZXing through `decode`). Stops the camera on `stop()`, when hidden and on unmount.
 */
export function useCameraScan({ onCode, decode }: { onCode: (code: string) => void; decode?: (video: HTMLVideoElement) => Promise<string | null> }) {
  const [status, setStatus] = React.useState<CameraStatus>("idle");
  const ref = React.useRef<HTMLVideoElement>(null);
  const stream = React.useRef<MediaStream | null>(null);
  const timer = React.useRef(0);
  const latest = React.useRef({ onCode, decode });
  latest.current = { onCode, decode };
  const stop = React.useCallback(() => {
    window.clearInterval(timer.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setStatus("idle");
  }, []);
  const start = React.useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) return setStatus("unavailable");
    setStatus("starting");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      stream.current = s;
      const v = ref.current;
      if (v) {
        v.srcObject = s;
        await v.play().catch(() => {});
      }
      setStatus("live");
      const Native = (window as unknown as { BarcodeDetector?: DetectorClass }).BarcodeDetector;
      const detector = Native ? new Native({ formats: FORMATS }) : null;
      let last = "";
      timer.current = window.setInterval(async () => {
        if (!v || v.readyState < 2) return;
        const code = detector ? (await detector.detect(v).catch(() => []))[0]?.rawValue : await latest.current.decode?.(v);
        if (code && code !== last) {
          last = code;
          latest.current.onCode(code);
          window.setTimeout(() => (last = ""), 1500);
        }
      }, 250);
    } catch (e) {
      setStatus((e as DOMException).name === "NotAllowedError" ? "denied" : "unavailable");
    }
  }, []);
  React.useEffect(() => {
    const hide = () => document.visibilityState === "hidden" && stream.current && stop();
    document.addEventListener("visibilitychange", hide);
    return () => (document.removeEventListener("visibilitychange", hide), stop());
  }, [stop]);
  const video = <video ref={ref} muted playsInline aria-label="Camera" className="absolute inset-0 size-full object-cover" />;
  return { status, start, stop, video };
}
