import { cx } from "@/lib/classNames";

export type ProgressBarTone = "success" | "warning" | "danger" | "neutral" | "accent";

export interface ProgressBarProps {
  value: number;
  tone?: ProgressBarTone;
  size?: "sm" | "md";
  className?: string;
}

const toneClasses: Record<ProgressBarTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-muted",
  accent: "bg-accent",
};

export const ProgressBar = ({
  value,
  tone = "accent",
  size = "sm",
  className,
}: ProgressBarProps) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cx(
        "w-full rounded-full bg-surface-muted",
        size === "sm" ? "h-1.5" : "h-2",
        className
      )}
    >
      <div
        className={cx(
          "rounded-full transition-all duration-300",
          toneClasses[tone],
          size === "sm" ? "h-1.5" : "h-2"
        )}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
};
