import Link from "next/link";
import type { HTMLAttributes } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";
import { getTestCardTheme } from "@/lib/testCardTheme";
import type { TestType } from "@/types/insights";

export interface TestListItemProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  emoji?: string;
  title: string;
  description?: string;
  questionCount?: number;
  estimatedMinutes?: number;
  statusLabel?: string;
  href?: string;
  onPress?: () => void;
  actionLabel?: string;
  completed?: boolean;
  testType?: TestType;
}

export const TestListItem = ({
  className,
  emoji,
  title,
  description,
  questionCount,
  estimatedMinutes,
  statusLabel,
  href,
  onPress,
  actionLabel = "Start",
  completed = false,
  testType,
  ...props
}: TestListItemProps) => {
  const theme = getTestCardTheme(testType);
  const isRetakeAvailable = completed && Boolean(href || onPress);
  const resolvedActionLabel = isRetakeAvailable
    ? actionLabel
    : completed
      ? "Completed"
      : actionLabel;

  const content = (
    <Card
      className={cx(
        "flex flex-col overflow-hidden p-0",
        "rounded-[var(--radius-lg)] border border-border/70 bg-card shadow-sm transition-all duration-300 hover:shadow-md",
        className
      )}
      {...props}
    >
      <div
        className={cx(
          "relative flex h-28 items-center justify-center overflow-hidden",
          theme.card
        )}
      >
        <span className={theme.pattern} aria-hidden="true" />
        <span className={theme.orb} aria-hidden="true" />
        <span className={theme.orbAlt} aria-hidden="true" />
        <div className="relative z-10 text-2xl font-semibold text-foreground">
          {emoji ?? "✨"}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h4 className="text-sm font-semibold text-foreground">
          {title}
        </h4>
        {description ? (
          <p className="line-clamp-2 text-xs text-muted">{description}</p>
        ) : null}
        <Button
          size="sm"
          variant="secondary"
          disabled={completed && !isRetakeAvailable}
          className={theme.button}
        >
          {resolvedActionLabel}
        </Button>
      </div>
    </Card>
  );

  if (href && (isRetakeAvailable || !completed)) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  if (onPress && (isRetakeAvailable || !completed)) {
    return (
      <button type="button" onClick={onPress} className="w-full text-left">
        {content}
      </button>
    );
  }

  return content;
};
