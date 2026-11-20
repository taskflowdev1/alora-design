import { Select, type Option } from "@/components/ui/select";
import { cn } from "@/lib/ad";

/* Round flags, drawn inline so they look the same on every OS. */
function Flag({ code, className }: { code: string; className?: string }) {
  const c = "size-[16px] shrink-0 overflow-hidden rounded-full";
  // The flag's own faint inner edge (part of the image), so a white half never melts into a light trigger.
  const edge = <circle cx="8" cy="8" r="7.75" fill="none" stroke="#000" strokeOpacity=".14" strokeWidth=".5" />;
  if (code === "id")
    return (
      <svg viewBox="0 0 16 16" className={cn(c, className)} data-shape="round" aria-hidden>
        <rect width="16" height="8" fill="#e12a31" />
        <rect y="8" width="16" height="8" fill="#f4f4f4" />
        {edge}
      </svg>
    );
  if (code === "cn")
    return (
      <svg viewBox="0 0 16 16" className={cn(c, className)} data-shape="round" aria-hidden>
        <rect width="16" height="16" fill="#de2910" />
        <path fill="#ffde00" d="M5 2.6l.8 2.2h2.3L6.2 6.2l.7 2.2L5 7 3.1 8.4l.7-2.2L2 4.8h2.3z" />
        <circle cx="9.5" cy="3" r=".7" fill="#ffde00" />
        <circle cx="10.8" cy="4.8" r=".7" fill="#ffde00" />
        <circle cx="10.8" cy="7" r=".7" fill="#ffde00" />
        <circle cx="9.5" cy="8.7" r=".7" fill="#ffde00" />
        {edge}
      </svg>
    );
  return (
    <svg viewBox="0 0 16 16" className={cn(c, className)} data-shape="round" aria-hidden>
      <rect width="16" height="16" fill="#1f3c88" />
      <path d="M0 0L16 16M16 0L0 16" stroke="#fff" strokeWidth="3.2" />
      <path d="M0 0L16 16M16 0L0 16" stroke="#cf1b2b" strokeWidth="1.2" />
      <path d="M8 0v16M0 8h16" stroke="#fff" strokeWidth="5" />
      <path d="M8 0v16M0 8h16" stroke="#cf1b2b" strokeWidth="2.8" />
      {edge}
    </svg>
  );
}

export const LANGUAGES: Option[] = [
  { value: "en", label: "EN", icon: <Flag code="en" /> },
  { value: "id", label: "ID", icon: <Flag code="id" /> },
  { value: "cn", label: "CN", icon: <Flag code="cn" /> },
];

/** A flag and a short code, in the trigger and in the list. Never the full language name. */
export function LanguagePicker({
  value,
  onValueChange,
  languages = LANGUAGES,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  languages?: Option[];
  className?: string;
}) {
  return <Select aria-label="Language" value={value} onValueChange={onValueChange} options={languages} className={className} contentClassName="min-w-28" />;
}

export { Flag };
