import Link from "next/link";
import Image from "next/image";
import type { HTMLAttributes } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";
import { getTestCardTheme } from "@/lib/testCardTheme";
import { getInsightCardImage } from "@/lib/insightCardImage";
import type { TestType } from "@/types/insights";

export interface TestListItemProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  title: string;
  description?: string;
  questionCount?: number;
  estimatedMinutes?: number;
  statusLabel?: string;
  href?: string;
  onPress?: () => void;
  onOpen?: () => void;
  actionLabel?: string;
  completed?: boolean;
  testType?: TestType;
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
  onOpen,
  actionLabel = "Start",
  completed = false,
  testType,
  ...props
}: TestListItemProps) => {
  const theme = getTestCardTheme(testType);
  const imageSrc = getInsightCardImage(testType, title);
  const isRetakeAvailable = completed && Boolean(href || onPress);
  const resolvedActionLabel = isRetakeAvailable
    ? actionLabel
    : completed
      ? "Completed"
      : actionLabel;

  const content = (
    <Card
      className={cx(
        "group flex h-full flex-col overflow-hidden p-0",
        "rounded-[var(--radius-lg)] border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl",
        className
      )}
      {...props}
    >
      <div
        className={cx(
          "relative h-36 overflow-hidden"
        )}
      >
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/30 to-transparent" />
        {completed ? (
          <span className="absolute right-3 top-3 rounded-full border border-emerald-200/80 bg-emerald-50/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
            Completed
          </span>
        ) : null}
        <h4 className="absolute bottom-3 left-3 right-3 line-clamp-2 text-sm font-semibold leading-snug text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
          {title}
        </h4>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {description ? (
          <p className="line-clamp-3 min-h-[3.75rem] text-xs text-muted">{description}</p>
        ) : null}
        {(statusLabel || questionCount || estimatedMinutes) ? (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-subtle">
            {statusLabel ? (
              <span className={cx("inline-flex items-center rounded-full", theme.chip)}>
                {statusLabel}
              </span>
            ) : null}
            {typeof questionCount === "number" ? (
              <span>{questionCount} questions</span>
            ) : null}
            {typeof estimatedMinutes === "number" ? (
              <span>{estimatedMinutes} min</span>
            ) : null}
          </div>
        ) : null}
        <Button
          size="sm"
          variant="secondary"
          disabled={completed && !isRetakeAvailable}
          className={cx("mt-auto w-full", theme.button)}
        >
          {resolvedActionLabel}
        </Button>
      </div>
    </Card>
  );

  if (href && (isRetakeAvailable || !completed)) {
    return (
      <Link href={href} className="block" onClick={onOpen}>
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
