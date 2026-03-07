"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/buttons/Button";
import { Badge } from "@/components/elements/Badge";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { QuestionCard } from "@/features/insights/cards/QuestionCard";
import { MapAnswerOptionCard } from "@/features/insights/lists/MapAnswerOptionCard";
import { SubmissionProgress } from "@/features/insights/elements/SubmissionProgress";
import { ShareInsightCard } from "@/features/insights/cards/ShareInsightCard";
import { InsightsDbLanguageDisclaimer } from "@/features/insights/elements/InsightsDbLanguageDisclaimer";
import { ZyraTestRecap } from "@/features/zyra/cards/ZyraTestRecap";
import type { TestQuestionResponse } from "@/types/insights";
import type { ApiError } from "@/types/api";
import { useAnalytics, useTests, useT } from "@/hooks";
import { isUuid } from "@/lib/validators";
import { getTestEmoji } from "@/lib/testEmoji";

const sortQuestions = (questions: TestQuestionResponse[]) =>
  [...questions].sort((a, b) => a.position - b.position);

export interface TestRunnerProps {
  testId: string;
}

export const TestRunner = ({ testId }: TestRunnerProps) => {
  const router = useRouter();
  const { activeTest, loading, error, actions } = useTests();
  const { actions: analyticsActions } = useAnalytics();
  const { t, locale } = useT();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [editQuestionIndex, setEditQuestionIndex] = useState<number | null>(null);
  const [recapText, setRecapText] = useState<string | null>(null);
  const [recapTitle, setRecapTitle] = useState<string | null>(null);
  const isValidTestId = isUuid(testId);
  const openedTrackedRef = useRef(false);

  const handleRecapLoaded = useCallback(
    (recap: string, testTitle: string) => {
      setRecapText(recap);
      setRecapTitle(testTitle);
    },
    [],
  );

  useEffect(() => {
    if (!isValidTestId) {
      actions.clearActiveTest();
      return;
    }
    actions.fetchTest(testId).catch(() => undefined);
    return () => actions.clearActiveTest();
  }, [actions, testId, isValidTestId]);

  useEffect(() => {
    if (!isValidTestId) {
      return;
    }
    actions.fetchTest(testId).catch(() => undefined);
  }, [actions, isValidTestId, locale, testId]);

  useEffect(() => {
    setCurrentIndex(0);
    setSubmitted(false);
    setSubmissionId(null);
    setSubmitError(null);
    setRecapText(null);
    setRecapTitle(null);
    setShowSummary(false);
    setEditQuestionIndex(null);
    openedTrackedRef.current = false;
    if (activeTest?.completed) {
      const prePopulated: Record<string, string[]> = {};
      for (const question of activeTest.questions) {
        const selected = question.options
          .filter((o) => o.isSelected)
          .map((o) => o.id);
        if (selected.length > 0) {
          prePopulated[question.id] = selected;
        }
      }
      setAnswers(prePopulated);
    } else {
      setAnswers({});
    }
  }, [testId, activeTest?.id]);

  useEffect(() => {
    if (!activeTest) return;
    if (openedTrackedRef.current) return;
    openedTrackedRef.current = true;
    void analyticsActions.trackEvent({
      eventName: "INSIGHT_OPENED",
      payload: {
        testId: activeTest.id,
        testType: activeTest.testType,
        completed: activeTest.completed,
        questionsCount: activeTest.questions.length,
      },
    });
  }, [activeTest, analyticsActions]);

  const questions = useMemo(
    () => (activeTest ? sortQuestions(activeTest.questions) : []),
    [activeTest]
  );

  const currentQuestion = questions[currentIndex];
  const selectedOptionIds = currentQuestion
    ? answers[currentQuestion.id] ?? []
    : [];
  const requiredQuestions = questions.filter((question) => question.required);
  const requiredCount = requiredQuestions.length;
  const answeredRequiredCount = requiredQuestions.filter(
    (question) => (answers[question.id] ?? []).length > 0
  ).length;
  const answeredCount = Object.values(answers).filter(
    (items) => items.length > 0
  ).length;
  const hasOptionalQuestions = requiredCount < questions.length;
  const allAnswered =
    requiredCount > 0 ? answeredRequiredCount === requiredCount : answeredCount > 0;
  const isLastQuestion = currentIndex === questions.length - 1;
  const canAdvance = currentQuestion
    ? currentQuestion.required
      ? selectedOptionIds.length > 0
      : true
    : false;
  const isInitialLoading = loading && !activeTest;
  const resolveMaxSelections = (question: TestQuestionResponse) => {
    if (question.questionType === "SINGLE") return 1;
    if (activeTest?.testType === "INTERESTS") return Infinity;
    const maxSelections = question.maxSelections ?? question.options.length;
    return Math.max(1, maxSelections);
  };

  const handleOptionToggle = (optionId: string, nextSelected: boolean) => {
    if (!currentQuestion) return;
    setSubmitError(null);
    setAnswers((prev) => {
      const next = { ...prev };
      const existing = next[currentQuestion.id] ?? [];
      if (currentQuestion.questionType === "SINGLE") {
        if (nextSelected) {
          next[currentQuestion.id] = [optionId];
        } else {
          delete next[currentQuestion.id];
        }
        return next;
      }
      if (nextSelected) {
        const maxSelections = resolveMaxSelections(currentQuestion);
        if (existing.length >= maxSelections) {
          setSubmitError(
            t("You can select up to {count} options.", { count: maxSelections })
          );
          return prev;
        }
        next[currentQuestion.id] = [...existing, optionId];
      } else {
        const filtered = existing.filter((id) => id !== optionId);
        if (filtered.length) {
          next[currentQuestion.id] = filtered;
        } else {
          delete next[currentQuestion.id];
        }
      }
      return next;
    });

    void analyticsActions.trackEvent({
      eventName: "INSIGHT_ANSWER_UPDATED",
      payload: {
        testId,
        questionId: currentQuestion.id,
        optionId,
        selected: nextSelected,
      },
    });
  };

  const handleNext = () => {
    if (!canAdvance) {
      setSubmitError(t("Select an answer to continue."));
      return;
    }
    setSubmitError(null);
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const handleBack = () => {
    setSubmitError(null);
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!allAnswered) {
      setSubmitError(t("Complete the required questions before submitting."));
      return;
    }
    void analyticsActions.trackEvent({
      eventName: "INSIGHT_SUBMIT_ATTEMPTED",
      payload: {
        testId,
        answeredCount,
        requiredCount,
      },
    });
    setSubmitError(null);
    setSubmitting(true);
    try {
      const response = await actions.submitTest(testId, {
        answers: questions
          .map((question) => ({
            questionId: question.id,
            answerOptionIds: answers[question.id] ?? [],
          }))
          .filter((answer) => answer.answerOptionIds.length > 0),
      });

      setSubmissionId(response.submissionId);
      setSubmitted(true);
      setShowSummary(false);

      void analyticsActions.trackEvent({
        eventName: "INSIGHT_COMPLETED",
        payload: {
          testId,
          submissionId: response.submissionId,
          answeredCount,
          requiredCount,
          totalQuestions: questions.length,
        },
      });
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? (error as ApiError).message
          : null;
      setSubmitError(message ? t(message) : t("Error submitting the insight."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = async () => {
    if (resetting) return;
    setSubmitError(null);
    setResetting(true);
    try {
      void analyticsActions.trackEvent({
        eventName: "INSIGHT_RETAKE_REQUESTED",
        payload: { testId },
      });
      await actions.resetSubmission(testId);
      await actions.fetchTest(testId);
      setCurrentIndex(0);
      setAnswers({});
      setSubmitted(false);
      setSubmissionId(null);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? (error as ApiError).message
          : null;
      setSubmitError(message ? t(message) : t("Error resetting the insight."));
    } finally {
      setResetting(false);
    }
  };

  if (!isValidTestId) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <ErrorState
          title={t("Invalid insight")}
          description={t("The requested insight doesn't exist or is unavailable.")}
          actionLabel={t("Back to insights")}
          actionHref="/insights"
        />
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">{t("Loading insight...")}</p>
        </Card>
      </div>
    );
  }

  if (error && !activeTest) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <ErrorState
          title={t("Unable to load the insight")}
          description={error.message}
        />
      </div>
    );
  }

  if (!activeTest) {
    return null;
  }

  if (!questions.length) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <EmptyState
          title={t("Insight unavailable")}
          description={t("There are no questions for this insight.")}
          actionLabel={t("Back to insights")}
          actionHref="/insights"
        />
      </div>
    );
  }

  if (activeTest.testType === "ASTRO") {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <EmptyState
          title={t("Insight temporarily unavailable")}
          description={t("This insight is not available yet. Please come back later.")}
          actionLabel={t("Back to insights")}
          actionHref="/insights"
        />
      </div>
    );
  }

  if (showSummary) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
            {t("Insight")}
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            {activeTest.title}
          </h1>
        </header>

        <Card className="divide-y divide-border overflow-hidden p-0">
          {questions.map((question, i) => {
            const selectedIds = answers[question.id] ?? [];
            const selectedLabels = selectedIds
              .map((id) => question.options.find((o) => o.id === id)?.label)
              .filter((l): l is string => l !== undefined)
              .join(", ");
            return (
              <div
                key={question.id}
                className="flex items-start justify-between gap-4 p-4"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {question.question}
                  </p>
                  <p className="text-sm text-muted">
                    {selectedLabels || t("Not answered")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentIndex(i);
                    setEditQuestionIndex(i);
                    setShowSummary(false);
                  }}
                >
                  {t("Edit")}
                </Button>
              </div>
            );
          })}
        </Card>

        {submitError ? (
          <p className="text-sm text-danger">{t(submitError)}</p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleSubmit}
            loading={submitting}
            loadingText={t("Submitting")}
            disabled={!allAnswered}
          >
            {t("Submit insight")}
          </Button>
          <Button variant="secondary" onClick={() => router.push("/insights")}>
            {t("Back to insights")}
          </Button>
        </div>
      </div>
    );
  }

  if (activeTest.completed && !submitted && editQuestionIndex === null) {
    if (activeTest.testType === "INTERESTS") {
      return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
          <Card className="space-y-4 p-6">
            <h1 className="text-2xl font-semibold text-foreground">
              {t("Insight already completed")}
            </h1>
            <p className="text-sm text-muted">
              {t(
                "You have already completed this insight. You can continue with the other available insights."
              )}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleRetake}
                loading={resetting}
                loadingText={t("Reset")}
              >
                {t("Retake insight")}
              </Button>
              <Button variant="secondary" onClick={() => router.push("/insights")}>
                {t("Back to insights")}
              </Button>
              <Button
                onClick={() => {
                  void analyticsActions.trackEvent({
                    eventName: "INSIGHT_NAVIGATED_TO_PROFILE",
                    payload: { testId },
                  });
                  router.push("/profile");
                }}
              >
                {t("Go to profile")}
              </Button>
            </div>
            {submitError ? (
              <p className="text-sm text-danger">{t(submitError)}</p>
            ) : null}
          </Card>
        </div>
      );
    }

    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <Card className="space-y-4 p-6">
          <h1 className="text-2xl font-semibold text-foreground">
            {t("Insight already completed")}
          </h1>
          <p className="text-sm text-muted">
            {t(
              "You have already completed this insight. You can continue with the other available insights."
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setShowSummary(true)}>
              {t("Review answers")}
            </Button>
            <Button variant="secondary" onClick={() => router.push("/insights")}>
              {t("Back to insights")}
            </Button>
            <Button
              onClick={() => {
                void analyticsActions.trackEvent({
                  eventName: "INSIGHT_NAVIGATED_TO_PROFILE",
                  payload: { testId },
                });
                router.push("/profile");
              }}
            >
              {t("Go to profile")}
            </Button>
          </div>
          {submitError ? (
            <p className="text-sm text-danger">{t(submitError)}</p>
          ) : null}
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
            {t("Insight completed")}
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            {activeTest?.title ?? t("Insight")}
          </h1>
        </header>

        <InsightsDbLanguageDisclaimer />

        {submissionId ? (
          <ZyraTestRecap
            submissionId={submissionId}
            onRecapLoaded={handleRecapLoaded}
          />
        ) : (
          <Card className="space-y-4 p-6">
            <p className="text-sm text-muted">
              {t("Your Zyra profile has been updated with your new answers.")}
            </p>
          </Card>
        )}

        {recapText && recapTitle ? (
          <ShareInsightCard testTitle={recapTitle} recap={recapText} />
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              void analyticsActions.trackEvent({
                eventName: "INSIGHT_BACK_TO_LIST",
                payload: { testId },
              });
              router.push("/profile");
            }}
          >
            {t("Back to profile")}
          </Button>
          <Button
            onClick={() => {
              void analyticsActions.trackEvent({
                eventName: "INSIGHT_NAVIGATED_TO_PROFILE",
                payload: { testId },
              });
              router.push("/profile");
            }}
          >
            {t("Go to profile")}
          </Button>
        </div>
      </div>
    );
  }

  const optionItems = currentQuestion.options.map((option, index) => ({
    id: option.id,
    label: option.label,
    indexLabel: String(index + 1),
    selected: selectedOptionIds.includes(option.id),
  }));
  const isInterestTest =
    activeTest.testType === "INTERESTS" &&
    currentQuestion.questionType === "MULTI";
  const maxSelections = resolveMaxSelections(currentQuestion);
  const selectionHelper =
    currentQuestion.questionType === "MULTI"
      ? isInterestTest
        ? t("Select all the interests that represent you.")
        : t("You can select up to {count} options.", { count: maxSelections })
      : undefined;

  const testEmoji = getTestEmoji(activeTest.testType, activeTest.title);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          {t("Insight")}
        </p>
        <h1 className="text-2xl font-semibold text-foreground">
          {testEmoji ? `${testEmoji} ${activeTest.title}` : activeTest.title}
        </h1>
        {activeTest.description ? (
          <p className="text-sm text-muted">{activeTest.description}</p>
        ) : null}
      </header>

      <InsightsDbLanguageDisclaimer />

      <SubmissionProgress
        label={t("Progress")}
        current={hasOptionalQuestions ? answeredCount : answeredRequiredCount}
        total={hasOptionalQuestions ? questions.length : requiredCount}
        helper={
          hasOptionalQuestions
            ? t("Complete the questions you know; only required ones are mandatory.")
            : t("Complete all required questions to submit the insight.")
        }
      />

      {isInterestTest ? (
        <Card className="space-y-4 p-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent" size="sm">
                {t("Question {current}/{total}", {
                  current: currentIndex + 1,
                  total: questions.length,
                })}
              </Badge>
              {selectionHelper ? (
                <span className="text-xs text-subtle">{selectionHelper}</span>
              ) : null}
            </div>
            <h4 className="text-base font-semibold text-foreground">
              {currentQuestion.question}
            </h4>
          </div>
          <MapAnswerOptionCard
            className="grid gap-3 sm:grid-cols-2"
            items={currentQuestion.options.map((option) => ({
              id: option.id,
              label: option.label,
              selected: selectedOptionIds.includes(option.id),
            }))}
            onItemToggle={handleOptionToggle}
          />
        </Card>
      ) : (
        <QuestionCard
          title={currentQuestion.question}
          subtitle={selectionHelper}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          options={optionItems}
          onOptionToggle={handleOptionToggle}
        />
      )}

      {submitError ? (
        <p className="text-sm text-danger">{t(submitError)}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="secondary"
          onClick={handleBack}
          disabled={currentIndex === 0}
        >
          {t("Back")}
        </Button>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              void analyticsActions.trackEvent({
                eventName: "INSIGHT_EXITED",
                payload: {
                  testId,
                  currentQuestionIndex: currentIndex + 1,
                },
              });
              router.push("/insights");
            }}
          >
            {t("Exit")}
          </Button>
          {editQuestionIndex !== null ? (
            <Button
              onClick={() => {
                setEditQuestionIndex(null);
                setShowSummary(true);
              }}
            >
              {t("Save & return to summary")}
            </Button>
          ) : isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              loading={submitting}
              loadingText={t("Submitting")}
              disabled={!allAnswered}
            >
              {t("Submit insight")}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canAdvance}>
              {t("Next")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
