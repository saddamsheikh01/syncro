import Link from "next/link";
import type { HTMLAttributes } from "react";
import { Badge } from "@/components/elements/Badge";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";
import { getTestCardTheme } from "@/lib/testCardTheme";
import type { TestType } from "@/types/tests";

const CheckIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

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
  actionLabel = "Inizia",
  completed = false,
  testType,
  ...props
}: TestListItemProps) => {
  const badgeTone = completed ? "success" : "accent";
  const isRetakeAvailable = completed && Boolean(href || onPress);
  const theme = getTestCardTheme(testType);
  const resolvedStatus = completed ? "Completato" : statusLabel;
  const resolvedActionLabel = isRetakeAvailable
    ? actionLabel
    : completed
      ? "Completato"
      : actionLabel;
  const badgeClass = completed ? undefined : theme.badge;
  const actionClass =
    completed && !isRetakeAvailable ? "border-success/30 text-success" : theme.button;
  const content = (
    <Card
      className={cx(
        "flex flex-col gap-4 p-4",
        theme.card,
        completed
          ? "border-success/30 shadow-[0_14px_28px_rgba(24,169,87,0.08)] ring-1 ring-success/30 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,_rgba(24,169,87,0.16),_transparent_70%)] before:opacity-40"
          : undefined,
        className
      )}
      {...props}
    >
      <span className={theme.pattern} aria-hidden="true" />
      <span className={theme.orb} aria-hidden="true" />
      <span className={theme.orbAlt} aria-hidden="true" />
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <span className={theme.chip}>{theme.label}</span>
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-foreground">
                {emoji ? `${emoji} ${title}` : title}
              </h4>
              {description ? (
                <p className="text-xs text-muted">{description}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            {resolvedStatus ? (
              <Badge tone={badgeTone} className={badgeClass}>
                {resolvedStatus}
              </Badge>
            ) : null}
            {isRetakeAvailable ? (
              <span className="text-[10px] font-medium text-success">
                Puoi rifare il test
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-subtle">
            {typeof questionCount === "number" ? (
              <span>{questionCount} domande</span>
            ) : null}
            {typeof estimatedMinutes === "number" ? (
              <span>{estimatedMinutes} min</span>
            ) : null}
          </div>
          <Button
            size="sm"
            variant="secondary"
            disabled={completed && !isRetakeAvailable}
            className={actionClass}
          >
            {completed && !isRetakeAvailable ? <CheckIcon /> : resolvedActionLabel}
          </Button>
        </div>
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
