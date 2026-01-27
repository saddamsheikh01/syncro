import Link from "next/link";
import type { HTMLAttributes } from "react";
import { Badge } from "@/components/elements/Badge";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";

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
  title: string;
  description?: string;
  questionCount?: number;
  estimatedMinutes?: number;
  statusLabel?: string;
  href?: string;
  onPress?: () => void;
  actionLabel?: string;
  completed?: boolean;
}

export const TestListItem = ({
  className,
  title,
  description,
  questionCount,
  estimatedMinutes,
  statusLabel,
  href,
  onPress,
  actionLabel = "Inizia",
  completed = false,
  ...props
}: TestListItemProps) => {
  const badgeTone = completed ? "success" : "accent";
  const resolvedStatus = completed ? undefined : statusLabel;
  const resolvedActionLabel = completed ? "Completato" : actionLabel;
  const content = (
    <Card
      className={cx(
        "relative flex flex-col gap-4 p-4",
        completed
          ? "border-success/40 bg-success/5 shadow-[0_14px_28px_rgba(24,169,87,0.08)] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top,_rgba(24,169,87,0.16),_transparent_70%)] before:opacity-60"
          : undefined,
        className
      )}
      {...props}
    >
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-foreground">{title}</h4>
          {description ? (
            <p className="text-xs text-muted">{description}</p>
          ) : null}
        </div>
        {resolvedStatus ? <Badge tone={badgeTone}>{resolvedStatus}</Badge> : null}
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
          disabled={completed}
          className={completed ? "border-success/30 text-success" : undefined}
        >
          {completed ? <CheckIcon /> : resolvedActionLabel}
        </Button>
      </div>
    </Card>
  );

  if (href && !completed) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  if (onPress && !completed) {
    return (
      <button type="button" onClick={onPress} className="w-full text-left">
        {content}
      </button>
    );
  }

  return content;
};
