import { useEffect, useRef, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, ImageOff, Images, X } from "lucide-react";

const MAX_PHOTOS = 4;
const MAX_BYTES = 10 * 1024 * 1024;

type PickerProps = {
  photos: string[];
  onChange: (photos: string[]) => void;
  onError: (message: string) => void;
};

/** Up to four photos of the batch: crates as packed, and a close-up of the produce. */
export function PhotoPicker({ photos, onChange, onError }: PickerProps) {
  const add = (files: FileList | null) => {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const picked = [...files];
    const images = picked.filter((file) => file.type.startsWith("image/") && file.size <= MAX_BYTES);
    if (images.length < picked.length) onError("Only image files up to 10 MB can be added.");
    else if (images.length > room) onError(`A batch can have at most ${MAX_PHOTOS} photos.`);
    onChange([...photos, ...images.slice(0, room).map((file) => URL.createObjectURL(file))]);
  };

  const remove = (url: string) => {
    URL.revokeObjectURL(url);
    onChange(photos.filter((photo) => photo !== url));
  };

  return (
    <div className="ph-photo-picker">
      {photos.map((url, index) => (
        <figure key={url} className="ph-photo-thumb">
          <img src={url} alt={`Batch photo ${index + 1}`} />
          {index === 0 && <figcaption>Cover</figcaption>}
          <button type="button" onClick={() => remove(url)} aria-label={`Remove photo ${index + 1}`}>
            <X size={14} />
          </button>
        </figure>
      ))}
      {photos.length < MAX_PHOTOS && (
        <label className="ph-photo-add">
          <Camera size={20} />
          <span>{photos.length === 0 ? "Add photos" : "Add more"}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="ph-sr-only"
            onChange={(event) => {
              add(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}

type CoverProps = {
  photos?: string[];
  alt: string;
  className?: string;
  /** False inside a card that links elsewhere: the cover is only a picture there. */
  interactive?: boolean;
};

function EmptyPhoto({ className }: { className: string }) {
  return (
    <div className={`ph-photo-cover ph-photo-cover--empty ${className}`}>
      <ImageOff size={22} aria-hidden="true" />
      <span>No photo yet</span>
    </div>
  );
}

function PhotoCount({ count }: { count: number }) {
  if (count < 2) return null;
  return (
    <span className="ph-photo-count">
      <Images size={13} aria-hidden="true" /> {count}
    </span>
  );
}

/** First photo as a cover; opens the full set. Shows a placeholder when the producer added none. */
export function PhotoCover({ photos = [], alt, className = "", interactive = true }: CoverProps) {
  const [open, setOpen] = useState<number | null>(null);

  if (photos.length === 0) return <EmptyPhoto className={className} />;

  if (!interactive) {
    return (
      <div className={`ph-photo-cover ph-photo-cover--static ${className}`}>
        <img src={photos[0]} alt="" loading="lazy" />
        <PhotoCount count={photos.length} />
      </div>
    );
  }

  return (
    <>
      <button type="button" className={`ph-photo-cover ${className}`} onClick={() => setOpen(0)} aria-label={`View ${photos.length} ${photos.length === 1 ? "photo" : "photos"} of ${alt}`}>
        <img src={photos[0]} alt="" loading="lazy" />
        <PhotoCount count={photos.length} />
      </button>
      {open !== null && <PhotoViewer photos={photos} start={open} alt={alt} onClose={() => setOpen(null)} />}
    </>
  );
}

/** Large first photo with the rest as thumbnails; any of them opens the viewer. */
export function PhotoGallery({ photos = [], alt }: { photos?: string[]; alt: string }) {
  const [open, setOpen] = useState<number | null>(null);

  if (photos.length === 0) return <EmptyPhoto className="ph-gallery-main" />;

  return (
    <div className="ph-gallery">
      <button type="button" className="ph-photo-cover ph-gallery-main" onClick={() => setOpen(0)} aria-label={`View photos of ${alt}`}>
        <img src={photos[0]} alt={`${alt}, photo 1`} />
      </button>
      {photos.length > 1 && (
        <ul className="ph-gallery-thumbs">
          {photos.slice(1).map((url, index) => (
            <li key={url}>
              <button type="button" className="ph-photo-cover" onClick={() => setOpen(index + 1)} aria-label={`View photo ${index + 2}`}>
                <img src={url} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {open !== null && <PhotoViewer photos={photos} start={open} alt={alt} onClose={() => setOpen(null)} />}
    </div>
  );
}

type ViewerProps = {
  photos: string[];
  start: number;
  alt: string;
  onClose: () => void;
};

export function PhotoViewer({ photos, start, alt, onClose }: ViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(start);
  const step = (delta: number) => setIndex((current) => (current + delta + photos.length) % photos.length);

  // No close() in cleanup, because StrictMode re-runs effects.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="ph-photo-viewer"
      aria-label={`Photos of ${alt}`}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") step(-1);
        if (event.key === "ArrowRight") step(1);
      }}
    >
      <img src={photos[index]} alt={`${alt}, photo ${index + 1} of ${photos.length}`} />
      <button type="button" className="ph-photo-viewer-close" onClick={onClose} aria-label="Close">
        <X size={18} />
      </button>
      {photos.length > 1 && (
        <>
          <button type="button" className="ph-photo-viewer-nav ph-photo-viewer-nav--prev" onClick={() => step(-1)} aria-label="Previous photo">
            <ChevronLeft size={22} />
          </button>
          <button type="button" className="ph-photo-viewer-nav ph-photo-viewer-nav--next" onClick={() => step(1)} aria-label="Next photo">
            <ChevronRight size={22} />
          </button>
          <p className="ph-photo-viewer-count">{index + 1} / {photos.length}</p>
        </>
      )}
    </dialog>
  );
}
