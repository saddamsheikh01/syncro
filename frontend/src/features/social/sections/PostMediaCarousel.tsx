"use client";

import { useRef, useState } from "react";
import type { HTMLAttributes, PointerEvent } from "react";
import { MapPostMediaSlide } from "@/features/social/lists/MapPostMediaSlide";
import type { PostMediaItem } from "@/features/social/lists/MapPostMediaThumbnail";
import { cx } from "@/lib/classNames";

export interface PostMediaCarouselProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  items: PostMediaItem[];
  aspectClassName?: string;
  showDots?: boolean;
  showCounter?: boolean;
}

export const PostMediaCarousel = ({
  className,
  items,
  aspectClassName = "aspect-[4/5]",
  showDots = true,
  showCounter = true,
  ...props
}: PostMediaCarouselProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const dragRef = useRef({
    active: false,
    startX: 0,
    scrollLeft: 0,
    pointerId: 0,
  });
  const [activeIndex, setActiveIndex] = useState(0);

  const currentIndex = Math.min(
    activeIndex,
    Math.max(items.length - 1, 0)
  );
  const hasMultiple = items.length > 1;

  const handleScroll = () => {
    if (!containerRef.current) return;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    frameRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth || 1;
      const index = Math.round(containerRef.current.scrollLeft / width);
      setActiveIndex(index);
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    dragRef.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: containerRef.current.scrollLeft,
      pointerId: event.pointerId,
    };
    containerRef.current.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || !dragRef.current.active) return;
    const delta = event.clientX - dragRef.current.startX;
    containerRef.current.scrollLeft = dragRef.current.scrollLeft - delta;
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    if (dragRef.current.pointerId === event.pointerId) {
      containerRef.current.releasePointerCapture(event.pointerId);
      dragRef.current.active = false;
    }
  };

  const scrollToIndex = (index: number) => {
    if (!containerRef.current) return;
    const width = containerRef.current.offsetWidth || 0;
    containerRef.current.scrollTo({
      left: width * index,
      behavior: "smooth",
    });
  };

  return (
    <div className={cx("space-y-3", className)} {...props}>
      <div className="relative">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerLeave={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          className={cx(
            "overflow-x-auto scroll-smooth snap-x snap-mandatory",
            "touch-pan-y cursor-grab active:cursor-grabbing"
          )}
        >
          <MapPostMediaSlide
            items={items}
            slideClassName={cx(
              "w-full shrink-0 snap-center",
              aspectClassName
            )}
          />
        </div>
        {showCounter && hasMultiple ? (
          <div className="absolute right-3 top-3 rounded-full bg-foreground/80 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
            {currentIndex + 1}/{items.length}
          </div>
        ) : null}
        {showDots && hasMultiple ? (
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToIndex(index)}
                className={cx(
                  "h-1.5 w-1.5 rounded-full transition",
                  index === currentIndex
                    ? "bg-foreground"
                    : "bg-border-strong"
                )}
                aria-label={`Vai al media ${index + 1}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};
