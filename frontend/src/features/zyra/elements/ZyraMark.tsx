import type { HTMLAttributes } from "react";
import { NavIcon } from "@/components/ui/NavIcon";
import { cx } from "@/lib/classNames";

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

const ICON_CLASSES: Record<ZyraMarkSize, string> = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const INNER_RING: Record<ZyraMarkSize, string> = {
  xs: "inset-[1px]",
  sm: "inset-[1.5px]",
  md: "inset-[2px]",
  lg: "inset-[2.5px]",
};

const CORE_RING: Record<ZyraMarkSize, string> = {
  xs: "inset-[3px]",
  sm: "inset-[3.5px]",
  md: "inset-[4px]",
  lg: "inset-[5px]",
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
        "relative inline-flex items-center justify-center rounded-full",
        SIZE_CLASSES[size],
        glow && "shadow-[0_0_18px_var(--zyra-glow)]",
        className
      )}
      {...ariaProps}
      {...props}
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "linear-gradient(135deg, var(--zyra-gradient-start), var(--zyra-gradient-mid), var(--zyra-gradient-end))",
        }}
      />
      <span
        className={cx("absolute rounded-full", INNER_RING[size])}
        style={{
          background:
            "linear-gradient(135deg, rgba(139, 92, 246, 0.35), rgba(59, 130, 246, 0.2))",
        }}
      />
      <span
        className={cx("absolute rounded-full", CORE_RING[size])}
        style={{
          background:
            "linear-gradient(135deg, var(--zyra-gradient-start), var(--zyra-gradient-end))",
        }}
      />
      <NavIcon name="spark" className={cx("relative text-white", ICON_CLASSES[size])} />
      <span
        className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full"
        style={{
          background: "var(--zyra-gradient-start)",
          boxShadow: "0 0 6px var(--zyra-glow)",
        }}
      />
    </span>
  );
};
