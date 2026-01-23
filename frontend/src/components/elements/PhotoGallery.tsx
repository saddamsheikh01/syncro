"use client";

import { useState } from "react";
import Image from "next/image";
import { cx } from "@/lib/classNames";

export interface PhotoGalleryProps {
  photos: string[];
  alt?: string;
  className?: string;
}

export const PhotoGallery = ({
  photos,
  alt = "Foto",
  className,
}: PhotoGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});

  if (photos.length === 0) {
    return (
      <div
        className={cx(
          "flex h-48 items-center justify-center rounded-[var(--radius-lg)] bg-surface-muted",
          className
        )}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-border"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  const validPhotos = photos.filter((_, i) => !imageError[i]);
  const currentPhoto = validPhotos[selectedIndex] || photos[0];

  return (
    <div className={cx("space-y-3", className)}>
      {/* Immagine principale */}
      <div className="relative h-64 w-full overflow-hidden rounded-[var(--radius-lg)] bg-surface-muted">
        {currentPhoto && !imageError[selectedIndex] ? (
          <Image
            src={currentPhoto}
            alt={`${alt} ${selectedIndex + 1}`}
            fill
            className="object-cover"
            onError={() =>
              setImageError((prev) => ({ ...prev, [selectedIndex]: true }))
            }
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-border"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}

        {/* Navigazione frecce */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() =>
                setSelectedIndex((prev) =>
                  prev === 0 ? photos.length - 1 : prev - 1
                )
              }
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
              aria-label="Foto precedente"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() =>
                setSelectedIndex((prev) =>
                  prev === photos.length - 1 ? 0 : prev + 1
                )
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
              aria-label="Foto successiva"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

        {/* Indicatore pagina */}
        {photos.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2 py-1">
            <span className="text-xs font-medium text-white">
              {selectedIndex + 1} / {photos.length}
            </span>
          </div>
        )}
      </div>

      {/* Thumbnail */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.slice(0, 6).map((photo, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={cx(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-md)] border-2 transition",
                selectedIndex === index
                  ? "border-accent"
                  : "border-transparent hover:border-border"
              )}
            >
              {!imageError[index] ? (
                <Image
                  src={photo}
                  alt={`${alt} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  onError={() =>
                    setImageError((prev) => ({ ...prev, [index]: true }))
                  }
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface-muted">
                  <span className="text-xs text-muted">?</span>
                </div>
              )}
            </button>
          ))}
          {photos.length > 6 && (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-surface-muted">
              <span className="text-xs font-medium text-muted">
                +{photos.length - 6}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
