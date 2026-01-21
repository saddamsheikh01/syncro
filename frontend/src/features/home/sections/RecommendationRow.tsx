"use client";

import { useRef, useState, useEffect, type HTMLAttributes, type ReactNode } from "react";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { cx } from "@/lib/classNames";

export interface RecommendationRowProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
  children: ReactNode;
}

export const RecommendationRow = ({
  className,
  title,
  subtitle,
  actionLabel,
  actionHref,
  onActionClick,
  children,
  ...props
}: RecommendationRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [children]);

  return (
    <section className={cx("space-y-4", className)} {...props}>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        actionLabel={actionLabel}
        actionHref={actionHref}
        onActionClick={onActionClick}
      />
      <div className="relative">
        {/* Left fade mask */}
        <div
          className={cx(
            "pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-background to-transparent transition-opacity duration-300",
            canScrollLeft ? "opacity-100" : "opacity-0"
          )}
        />
        {/* Right fade mask */}
        <div
          className={cx(
            "pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-background to-transparent transition-opacity duration-300",
            canScrollRight ? "opacity-100" : "opacity-0"
          )}
        />

        <div
          ref={scrollRef}
          className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
        >
          <div className="flex min-w-full flex-nowrap gap-4 sm:min-w-0">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
};
