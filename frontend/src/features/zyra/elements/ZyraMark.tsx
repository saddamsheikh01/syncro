import type { HTMLAttributes } from "react";
import Image from "next/image";
import { cx } from "@/lib/classNames";
import { ZYRA_AVATAR_SRC } from "@/lib/zyraAvatar";

export type ZyraMarkSize = "xs" | "sm" | "md" | "lg";

export interface ZyraMarkProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "title"> {
  size?: ZyraMarkSize;
  label?: string;
  glow?: boolean;
}

const SIZE_CLASSES: Record<ZyraMarkSize, string> = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

export const ZyraMark = ({
  size = "md",
  label,
  glow = true,
  className,
  ...props
}: ZyraMarkProps) => {
  const ariaProps = label
    ? { role: "img", "aria-label": label }
    : { "aria-hidden": true };

  return (
    <span
      className={cx(
        "relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-zyra-start via-zyra-mid to-zyra-end p-[1px]",
        SIZE_CLASSES[size],
        glow && "shadow-[0_0_18px_var(--zyra-glow)]",
        className
      )}
      {...ariaProps}
      {...props}
    >
      <span className="relative h-full w-full overflow-hidden rounded-full border border-white/70 bg-white">
        <Image
          src={ZYRA_AVATAR_SRC}
          alt={label ?? ""}
          fill
          sizes="48px"
          className="object-cover"
        />
      </span>
    </span>
  );
};
