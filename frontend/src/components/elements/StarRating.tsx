"use client";

import { cx } from "@/lib/classNames";

export interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
}

export const StarRating = ({
  rating,
  reviewCount,
  size = "md",
  showValue = true,
  className,
}: StarRatingProps) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const starSize = size === "sm" ? 14 : 18;

  return (
    <div className={cx("flex items-center gap-1.5", className)}>
      <div className="flex items-center">
        {/* Stelle piene */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <svg
            key={`full-${i}`}
            width={starSize}
            height={starSize}
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-warning"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
        {/* Mezza stella */}
        {hasHalfStar && (
          <svg
            width={starSize}
            height={starSize}
            viewBox="0 0 24 24"
            className="text-warning"
          >
            <defs>
              <linearGradient id="halfStar">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill="url(#halfStar)"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        )}
        {/* Stelle vuote */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <svg
            key={`empty-${i}`}
            width={starSize}
            height={starSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-border"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
      {showValue && (
        <span
          className={cx(
            "font-semibold text-foreground",
            size === "sm" ? "text-xs" : "text-sm"
          )}
        >
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span
          className={cx("text-muted", size === "sm" ? "text-xs" : "text-sm")}
        >
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  );
};
