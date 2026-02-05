"use client";

import type { HTMLAttributes } from "react";
import { Badge } from "@/components/elements/Badge";
import { Card } from "@/components/elements/Card";
import { MapAnswerOptionRow } from "@/features/insights/lists/MapAnswerOptionRow";
import type { AnswerOptionItem } from "@/features/insights/lists/MapAnswerOptionRow";
import { cx } from "@/lib/classNames";

export interface QuestionCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  subtitle?: string;
  questionNumber?: number;
  totalQuestions?: number;
  options: AnswerOptionItem[];
  onOptionToggle?: (id: string, nextSelected: boolean) => void;
}

export const QuestionCard = ({
  className,
  title,
  subtitle,
  questionNumber,
  totalQuestions,
  options,
  onOptionToggle,
  ...props
}: QuestionCardProps) => {
  const questionLabel =
    typeof questionNumber === "number" && typeof totalQuestions === "number"
      ? `Domanda ${questionNumber}/${totalQuestions}`
      : typeof questionNumber === "number"
        ? `Domanda ${questionNumber}`
        : undefined;

  return (
    <Card className={cx("space-y-4 p-5", className)} {...props}>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {questionLabel ? (
            <Badge tone="accent" size="sm">
              {questionLabel}
            </Badge>
          ) : null}
          {subtitle ? <span className="text-xs text-subtle">{subtitle}</span> : null}
        </div>
        <h4 className="text-base font-semibold text-foreground">{title}</h4>
      </div>
      <MapAnswerOptionRow items={options} onItemToggle={onOptionToggle} />
    </Card>
  );
};
