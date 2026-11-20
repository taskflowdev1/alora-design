import * as React from "react";
import { Camera, Image as ImageIcon, Plus, RotateCw, X } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { MobileSheet } from "./mobile-sheet";

export interface Photo {
  id: string;
  /** Image URL; without one a soft placeholder shows. */
  src?: string;
  alt: string;
  /** While it uploads (MobilePhotoStrip): 0 to 1. */
  progress?: number;
  /** Upload state in a MobilePhotoStrip; leave out for a photo that is already there. */
  state?: "uploading" | "done" | "failed";
}

function Picture({ p, className }: { p: Photo; className?: string }) {
  return p.src ? (
    <img src={p.src} alt={p.alt} draggable={false} className={cn("size-full object-cover", className)} />
  ) : (
    <span role="img" aria-label={p.alt} className={cn("grid size-full place-items-center bg-fill text-ink-muted", className)}>
      <ImageIcon size={24} strokeWidth={1.5} />
    </span>
  );
}

/** Reads picked files (camera or library) as photos with object URLs. */
function useFileInput(onAdd?: (photos: Photo[]) => void) {
  const input = React.useRef<HTMLInputElement>(null);
  const el = onAdd ? (
    <input
      ref={input}
      type="file"
      accept="image/*"
      multiple
      hidden
      onChange={(e) => {
        const files = [...(e.target.files ?? [])];
        e.target.value = "";
        if (files.length) onAdd(files.map((f, i) => ({ id: `file-${Date.now()}-${i}`, src: URL.createObjectURL(f), alt: f.name })));
      }}
    />
  ) : null;
  return { el, open: () => input.current?.click() };
}

export interface MobilePhotoGridProps {
  photos: Photo[];
  /** Picked photo ids, in the order they were picked (the first is the cover). */
  selected: string[];
  onSelectedChange: (ids: string[]) => void;
  max?: number;
  /** Adds a camera tile first; picked files come back as photos (add them to `photos` and select them). */
  onAdd?: (photos: Photo[]) => void;
  className?: string;
}

/**
 * Pick photos the way the phone's own picker does: a grid of square tiles, tap to pick and the tile shows its number in
 * the order you picked (1 is the cover); tap again to drop it and the rest renumber. At the limit the other tiles fade.
 * The first tile opens the camera or the library.
 */
// Unpicked tiles show a hollow white circle on a soft dark scrim, as the system pickers do: image chrome over a photo,
// not a UI grey (a solid surface disc reads as a hole on a light photo in dark mode).
const UNPICKED = "bg-black/20 text-transparent"; // grey-ok: image chrome over photos

export function MobilePhotoGrid({ photos, selected, onSelectedChange, max = 9, onAdd, className }: MobilePhotoGridProps) {
  const file = useFileInput(onAdd);
  const full = selected.length >= max;
  return (
    <div role="group" aria-label="Photos" className={cn("grid grid-cols-3 gap-[3px] overflow-hidden rounded-card", className)}>
      {file.el}
      {onAdd ? (
        <button
          type="button"
          onClick={file.open}
          className="grid aspect-square cursor-pointer place-items-center content-center gap-1.5 bg-fill text-[13px] text-ink ad-press focus-visible:bg-fill-strong active:scale-[0.97] data-pressed:scale-[0.97] active:bg-fill-strong data-pressed:bg-fill-strong"
        >
          <Camera size={24} strokeWidth={1.75} />
          Camera
        </button>
      ) : null}
      {photos.map((p) => {
        const n = selected.indexOf(p.id) + 1;
        const off = !n && full;
        return (
          <button
            key={p.id}
            type="button"
            role="checkbox"
            aria-checked={!!n}
            aria-label={n ? `${p.alt}, photo ${n}` : p.alt}
            disabled={off}
            onClick={() => onSelectedChange(n ? selected.filter((x) => x !== p.id) : [...selected, p.id])}
            className="relative aspect-square cursor-pointer touch-manipulation overflow-hidden bg-fill outline-none focus-visible:[&_img]:brightness-75 disabled:cursor-default"
          >
            <Picture p={p} className={cn("transition-[scale,opacity,border-radius] duration-[180ms] ease-ad", n ? "scale-[0.9] rounded-control" : "scale-100", off && "opacity-40")} />
            <span
              aria-hidden
              data-shape="round"
              className={cn(
                "absolute right-1.5 top-1.5 grid size-[24px] place-items-center rounded-full text-[13px] font-semibold tabular-nums transition-[background-color,scale] duration-[160ms] ease-ad",
                n ? "scale-100 bg-on text-on-ink shadow-thumb" : cn("scale-90", UNPICKED),
                off && "opacity-0",
              )}
            >
              {n ? n : (
                // grey-ok: the hollow circle is image chrome (white over the photo in both themes)
                <svg aria-hidden viewBox="0 0 24 24" className="size-full" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="12" cy="12" r="11" />
                </svg>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export interface MobilePhotoSheetProps extends Omit<MobilePhotoGridProps, "selected" | "onSelectedChange"> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the picked ids when Add is tapped. */
  onPick: (ids: string[]) => void;
  title?: string;
}

/** The photo grid in a sheet: pick, then "Add 3 photos". Closing any other way adds nothing. */
export function MobilePhotoSheet({ open, onOpenChange, onPick, title = "Photos", photos, onAdd, max, className }: MobilePhotoSheetProps) {
  const [picked, setPicked] = React.useState<string[]>([]);
  React.useEffect(() => {
    if (open) setPicked([]);
  }, [open]);
  return (
    <MobileSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      detents={[0.62, 0.92]}
      className={className}
      footer={
        <Button variant="primary" disabled={!picked.length} onClick={() => (onPick(picked), onOpenChange(false))}>
          {picked.length ? `Add ${picked.length} ${picked.length === 1 ? "photo" : "photos"}` : "Pick photos"}
        </Button>
      }
    >
      <MobilePhotoGrid
        photos={photos}
        selected={picked}
        onSelectedChange={setPicked}
        max={max}
        onAdd={
          onAdd &&
          ((ps) => {
            onAdd(ps);
            setPicked((x) => [...x, ...ps.map((p) => p.id)]);
          })
        }
      />
    </MobileSheet>
  );
}

export interface MobilePhotoStripProps {
  /** In order; the first is the cover. */
  photos: Photo[];
  onRemove: (id: string) => void;
  onAddClick: () => void;
  max?: number;
  /** Label the first photo "Cover" (product photos). Off for photos that aren't a product's (proof of delivery). */
  cover?: boolean;
  /** A failed upload's Retry. */
  onRetry?: (id: string) => void;
  className?: string;
}

// Upload chrome sits over the photo itself, in white on a dark scrim, in both themes.
const SCRIM = "bg-black/40 text-white"; // grey-ok: image chrome over photos
const BAR = "bg-white/35"; // grey-ok: image chrome over photos
const BAR_FILL = "bg-white"; // grey-ok: image chrome over photos
const RETRY_FOCUS = "focus-visible:bg-black/25"; // grey-ok: image chrome over photos

/**
 * A product's photos on an edit screen: one row that scrolls sideways, the first marked Cover, an Add tile at the end.
 * A photo that is still uploading is a tile from the start, with its progress drawn over it (and Retry if it fails),
 * so nothing below the strip moves as uploads start and finish.
 */
export function MobilePhotoStrip({ photos, onRemove, onAddClick, max = 9, cover = true, onRetry, className }: MobilePhotoStripProps) {
  return (
    <div className={cn("-mx-pad flex gap-gap overflow-x-auto px-pad [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}>
      {photos.map((p, i) => (
        <div key={p.id} className="relative size-[96px] shrink-0 overflow-hidden rounded-card bg-fill animate-[ad-fade-in_180ms_var(--ad-ease)]">
          <Picture p={p} />
          {cover && i === 0 && (p.state ?? "done") === "done" ? <span className="absolute bottom-1.5 left-1.5 rounded-small bg-surface px-1.5 py-0.5 text-[12px] font-medium text-ink shadow-thumb">Cover</span> : null}
          {p.state ? (
            <span aria-hidden={p.state === "done"} className={cn("absolute inset-0 transition-opacity duration-[200ms] ease-ad", SCRIM, p.state === "done" && "pointer-events-none opacity-0")}>
              {p.state === "failed" ? (
                <button type="button" aria-label={`Retry ${p.alt}`} onClick={() => onRetry?.(p.id)} className={cn("grid size-full cursor-pointer place-content-center justify-items-center gap-1 text-[13px] font-medium", RETRY_FOCUS)}>
                  <RotateCw size={20} strokeWidth={1.75} />
                  Retry
                </button>
              ) : (
                <span
                  role="progressbar"
                  aria-label={`${p.alt} upload`}
                  aria-valuenow={Math.round((p.progress ?? 0) * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className={cn("absolute inset-x-2.5 bottom-2.5 h-[4px] overflow-hidden rounded-full", BAR)}
                >
                  <span className={cn("block h-full rounded-full transition-[width] duration-[200ms] ease-linear", BAR_FILL)} style={{ width: `${Math.round(Math.max(0, Math.min(1, p.progress ?? 0)) * 100)}%` }} />
                </span>
              )}
            </span>
          ) : null}
          <button
            type="button"
            aria-label={p.state === "uploading" ? `Cancel ${p.alt}` : `Remove ${p.alt}`}
            onClick={() => onRemove(p.id)}
            className="group/rm absolute right-0 top-0 grid size-touch cursor-pointer place-items-center outline-none ad-press active:scale-[0.92] data-pressed:scale-[0.92]"
          >
            <span data-shape="round" className="grid size-[24px] place-items-center rounded-full bg-surface text-ink shadow-thumb transition-colors duration-[150ms] group-focus-visible/rm:bg-fill-strong">
              <X size={14} strokeWidth={2.25} />
            </span>
          </button>
        </div>
      ))}
      {photos.length < max ? (
        <button
          type="button"
          onClick={onAddClick}
          className="grid size-[96px] shrink-0 cursor-pointer place-items-center content-center gap-1 rounded-card bg-fill text-[13px] text-ink ad-press focus-visible:bg-fill-strong active:scale-[0.97] data-pressed:scale-[0.97] active:bg-fill-strong data-pressed:bg-fill-strong"
        >
          <Plus size={22} strokeWidth={1.75} />
          Add
        </button>
      ) : null}
    </div>
  );
}
