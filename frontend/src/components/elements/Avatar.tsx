import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";
import { resolveMediaUrl } from "@/lib/mediaUrl";

export type AvatarSize = "sm" | "md" | "lg" | "xl" | "2xl";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-14 w-14 text-base",
  "2xl": "h-20 w-20 text-lg",
};

const getInitials = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || "?";
};

export const Avatar = ({
  className,
  src,
  name,
  size = "md",
  ...props
}: AvatarProps) => {
  const initials = getInitials(name);
  const safeSrc = resolveMediaUrl(src);

  return (
    <div
      className={cx(
        "inline-flex items-center justify-center overflow-hidden rounded-full border border-border/70 bg-surface-muted font-semibold text-foreground",
        SIZE_CLASSES[size],
        className
      )}
      aria-label={name ?? "Avatar"}
      {...props}
    >
      {safeSrc ? (
        <img
          src={safeSrc}
          alt={name ?? "Avatar"}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};
