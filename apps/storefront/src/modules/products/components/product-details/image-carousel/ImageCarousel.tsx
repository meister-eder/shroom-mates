import { useEffect, useState } from "react";

interface OptimizedImageData {
  src: string;
  srcSet?: string;
  width: number;
  height: number;
  sizes?: string;
}

export interface OptimizedCarouselImage {
  originalUrl: string;
  main: OptimizedImageData;
  thumb: OptimizedImageData;
}

interface Props {
  images: OptimizedCarouselImage[];
  alt: string;
  /** Kartonfarbe als Bildgrund, z. B. "lavender" */
  color?: string;
}

/** Sticker image + thumbnails (desktop) or dot navigation (mobile). */
export const ImageCarousel = ({ images, alt, color = "paper" }: Props) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const currentImage = images[currentIndex];

  useEffect(() => {
    if (!isPreviewing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsPreviewing(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isPreviewing]);

  if (images.length === 0 || !currentImage) {
    return (
      <div className="gallery">
        <div className="gallery__frame">
          <div className="gallery__dots dots" aria-hidden="true" />
          <div
            className="gallery__img gallery__img--empty sticker-card__placeholder"
            style={{ ["--sticker-bg" as string]: `var(--color-${color})` }}
            role="img"
            aria-label={alt}
          />
        </div>
      </div>
    );
  }

  const renderOptimizedImg = (
    data: OptimizedImageData,
    extraProps?: React.ImgHTMLAttributes<HTMLImageElement>,
  ) => (
    <img
      src={data.src}
      srcSet={data.srcSet}
      sizes={data.sizes}
      width={data.width}
      height={data.height}
      alt={extraProps?.alt ?? alt}
      loading={extraProps?.loading ?? "lazy"}
      decoding="async"
      draggable={false}
      {...extraProps}
    />
  );

  return (
    <div className="gallery">
      {isPreviewing && (
        <div
          className="gallery__lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${alt}, vergrößert`}
          onClick={() => setIsPreviewing(false)}
        >
          {renderOptimizedImg(currentImage.main, {
            loading: "eager",
            onClick: (e) => e.stopPropagation(),
          })}
          <button
            type="button"
            className="round-btn gallery__lightbox-close"
            aria-label="Vergrößerung schließen"
            onClick={() => setIsPreviewing(false)}
            autoFocus
          >
            ×
          </button>
        </div>
      )}

      <div className="gallery__frame">
        <div className="gallery__dots dots" aria-hidden="true" />
        <button
          type="button"
          className="gallery__open"
          onClick={() => setIsPreviewing(true)}
          aria-label="Bild vergrößern"
          style={{ ["--sticker-bg" as string]: `var(--color-${color})` }}
        >
          {renderOptimizedImg(currentImage.main, {
            className: "gallery__img",
            loading: "eager",
          })}
        </button>
      </div>

      {images.length > 1 && (
        <>
          <div className="gallery__thumbs" role="group" aria-label="Bilder">
            {images.map((image, index) => (
              <button
                key={image.originalUrl}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-pressed={currentIndex === index}
                aria-label={`Bild ${index + 1} anzeigen`}
                className="gallery__thumb"
              >
                {renderOptimizedImg(image.thumb, { alt: "" })}
              </button>
            ))}
          </div>
          <div className="gallery__pager" role="group" aria-label="Bilder">
            {images.map((image, index) => (
              <button
                key={image.originalUrl}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-pressed={currentIndex === index}
                aria-label={`Bild ${index + 1}`}
                className="gallery__pager-btn"
              >
                <span />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
