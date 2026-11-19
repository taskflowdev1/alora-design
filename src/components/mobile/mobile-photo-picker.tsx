import * as React from "react";
import { Camera, Image as ImageIcon, Plus, X } from "react-feather";
import { cn } from "@/lib/ad";
import { Button } from "@/components/ui/button";
import { MobileSheet } from "./mobile-sheet";

export interface Photo {
  id: string;
  /** Image URL; without one a soft placeholder shows. */
  src?: string;
  alt: string;
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
          className="grid aspect-square cursor-pointer place-items-center content-center gap-1.5 bg-fill text-[13px] text-ink transition-[background-color,transform] duration-[150ms] ease-ad active:scale-[0.97] active:bg-fill-strong [-webkit-tap-highlight-color:transparent]"
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
            className="relative aspect-square cursor-pointer touch-manipulation overflow-hidden bg-fill [-webkit-tap-highlight-color:transparent] disabled:cursor-default"
          >
            <Picture p={p} className={cn("transition-[transform,opacity] duration-[180ms] ease-ad", n ? "scale-[0.9] rounded-control" : "scale-100", off && "opacity-40")} />
            <span
              aria-hidden
              data-shape="round"
              className={cn(
                "absolute right-1.5 top-1.5 grid size-[24px] place-items-center rounded-full text-[13px] font-semibold tabular-nums shadow-thumb transition-[background-color,transform] duration-[160ms] ease-ad",
                n ? "scale-100 bg-on text-on-ink" : "scale-90 bg-surface text-transparent",
                off && "opacity-0",
              )}
            >
              {n || ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export interface MobilePhotoSheetProps extends Omit<MobilePhotoGridProps, "selected" | "onSelectedChange" | "className"> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the picked ids when Add is tapped. */
  onPick: (ids: string[]) => void;
  title?: string;
}

/** The photo grid in a sheet: pick, then "Add 3 photos". Closing any other way adds nothing. */
export function MobilePhotoSheet({ open, onOpenChange, onPick, title = "Photos", photos, onAdd, max }: MobilePhotoSheetProps) {
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
  className?: string;
}

/** A product's photos on an edit screen: one row that scrolls sideways, the first marked Cover, an Add tile at the end. */
export function MobilePhotoStrip({ photos, onRemove, onAddClick, max = 9, className }: MobilePhotoStripProps) {
  return (
    <div className={cn("-mx-pad flex gap-gap overflow-x-auto px-pad [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}>
      {photos.map((p, i) => (
        <div key={p.id} className="relative size-[96px] shrink-0 overflow-hidden rounded-card bg-fill animate-[ad-fade-in_180ms_var(--ad-ease)]">
          <Picture p={p} />
          {i === 0 ? <span className="absolute bottom-1.5 left-1.5 rounded-small bg-surface px-1.5 py-0.5 text-[12px] font-medium text-ink shadow-thumb">Cover</span> : null}
          <button
            type="button"
            aria-label={`Remove ${p.alt}`}
            onClick={() => onRemove(p.id)}
            className="absolute right-0 top-0 grid size-touch cursor-pointer place-items-center [-webkit-tap-highlight-color:transparent] active:scale-[0.9] transition-transform duration-[150ms] ease-ad"
          >
            <span data-shape="round" className="grid size-[24px] place-items-center rounded-full bg-surface text-ink shadow-thumb">
              <X size={14} strokeWidth={2.25} />
            </span>
          </button>
        </div>
      ))}
      {photos.length < max ? (
        <button
          type="button"
          onClick={onAddClick}
          className="grid size-[96px] shrink-0 cursor-pointer place-items-center content-center gap-1 rounded-card bg-fill text-[13px] text-ink transition-[background-color,transform] duration-[150ms] ease-ad active:scale-[0.97] active:bg-fill-strong [-webkit-tap-highlight-color:transparent]"
        >
          <Plus size={22} strokeWidth={1.75} />
          Add
        </button>
      ) : null}
    </div>
  );
}
