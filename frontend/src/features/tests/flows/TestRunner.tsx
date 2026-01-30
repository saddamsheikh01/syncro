"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/buttons/Button";
import { Badge } from "@/components/elements/Badge";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { QuestionCard } from "@/features/tests/cards/QuestionCard";
import { MapAnswerOptionCard } from "@/features/tests/lists/MapAnswerOptionCard";
import { SubmissionProgress } from "@/features/tests/elements/SubmissionProgress";
import type { TestQuestionResponse } from "@/types/tests";
import type { ApiError } from "@/types/api";
import { useTests } from "@/hooks";
import { isUuid } from "@/lib/validators";

const sortQuestions = (questions: TestQuestionResponse[]) =>
  [...questions].sort((a, b) => a.position - b.position);

export interface TestRunnerProps {
  testId: string;
}

export const TestRunner = ({ testId }: TestRunnerProps) => {
  const router = useRouter();
  const { activeTest, loading, error, actions } = useTests();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isValidTestId = isUuid(testId);

  useEffect(() => {
    if (!isValidTestId) {
      actions.clearActiveTest();
      return;
    }
    actions.fetchTest(testId).catch(() => undefined);
    return () => actions.clearActiveTest();
  }, [actions, testId, isValidTestId]);

  useEffect(() => {
    setCurrentIndex(0);
    setAnswers({});
    setSubmitted(false);
    setSubmitError(null);
  }, [testId, activeTest?.id]);

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
            `Puoi selezionare al massimo ${maxSelections} opzioni.`
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
  };

  const handleNext = () => {
    if (!canAdvance) {
      setSubmitError("Seleziona una risposta per continuare.");
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
      setSubmitError("Completa le domande richieste prima di inviare.");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      await actions.submitTest(testId, {
        answers: questions
          .map((question) => ({
            questionId: question.id,
            answerOptionIds: answers[question.id] ?? [],
          }))
          .filter((answer) => answer.answerOptionIds.length > 0),
      });
      setSubmitted(true);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? (error as ApiError).message
          : null;
      setSubmitError(message ?? "Errore durante l'invio del test.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isValidTestId) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <ErrorState
          title="Test non valido"
          description="Il test richiesto non esiste o non e disponibile."
          actionLabel="Torna ai test"
          actionHref="/tests"
        />
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">Caricamento test...</p>
        </Card>
      </div>
    );
  }

  if (error && !activeTest) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <ErrorState
          title="Impossibile caricare il test"
          description={error.message}
        />
      </div>
    );
  }

  if (!activeTest) {
    return null;
  }

  if (activeTest.completed) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <Card className="space-y-4 p-6">
          <h1 className="text-2xl font-semibold text-foreground">
            Test gia completato
          </h1>
          <p className="text-sm text-muted">
            Hai gia completato questo micro-test. Puoi continuare con gli altri
            test disponibili.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => router.push("/tests")}>
              Torna ai micro-test
            </Button>
            <Button onClick={() => router.push("/profile")}>
              Vai al profilo
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <EmptyState
          title="Test non disponibile"
          description="Non ci sono domande per questo test."
          actionLabel="Torna ai test"
          actionHref="/tests"
        />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <Card className="space-y-4 p-6">
          <h1 className="text-2xl font-semibold text-foreground">
            Test completato
          </h1>
          <p className="text-sm text-muted">
            Il tuo profilo Zyra e stato aggiornato con le nuove risposte.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => router.push("/tests")}
            >
              Torna ai micro-test
            </Button>
            <Button onClick={() => router.push("/feed")}>
              Vai al feed
            </Button>
          </div>
        </Card>
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
  const selectionHelper = currentQuestion.questionType === "MULTI"
    ? isInterestTest
      ? "Seleziona tutti gli interessi che ti rappresentano."
      : `Puoi selezionare fino a ${maxSelections} opzioni.`
    : undefined;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          Micro-test
        </p>
        <h1 className="text-2xl font-semibold text-foreground">
          {activeTest.title}
        </h1>
        {activeTest.description ? (
          <p className="text-sm text-muted">{activeTest.description}</p>
        ) : null}
      </header>

      <SubmissionProgress
        label="Avanzamento"
        current={requiredCount > 0 ? answeredRequiredCount : answeredCount}
        total={requiredCount > 0 ? requiredCount : questions.length}
        helper="Completa tutte le domande richieste per inviare il test."
      />

      {isInterestTest ? (
        <Card className="space-y-4 p-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent" size="sm">
                Domanda {currentIndex + 1}/{questions.length}
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
        <p className="text-sm text-danger">{submitError}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="secondary"
          onClick={handleBack}
          disabled={currentIndex === 0}
        >
          Indietro
        </Button>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={() => router.push("/tests")}>
            Esci
          </Button>
          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              loading={submitting}
              loadingText="Invio"
              disabled={!allAnswered}
            >
              Invia test
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canAdvance}>
              Avanti
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
