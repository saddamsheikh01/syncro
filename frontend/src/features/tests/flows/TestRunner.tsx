"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { QuestionCard } from "@/features/tests/cards/QuestionCard";
import { SubmissionProgress } from "@/features/tests/elements/SubmissionProgress";
import type { TestQuestionResponse } from "@/types/tests";
import { useTests } from "@/hooks";

const sortQuestions = (questions: TestQuestionResponse[]) =>
  [...questions].sort((a, b) => a.position - b.position);

export interface TestRunnerProps {
  testId: string;
}

export const TestRunner = ({ testId }: TestRunnerProps) => {
  const router = useRouter();
  const { activeTest, loading, error, actions } = useTests();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    actions.fetchTest(testId).catch(() => undefined);
    return () => actions.clearActiveTest();
  }, [actions, testId]);

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
  const selectedOptionId = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const isLastQuestion = currentIndex === questions.length - 1;
  const canAdvance = Boolean(selectedOptionId);
  const isInitialLoading = loading && !activeTest;

  const handleOptionToggle = (optionId: string, nextSelected: boolean) => {
    if (!currentQuestion) return;
    setSubmitError(null);
    setAnswers((prev) => {
      const next = { ...prev };
      if (nextSelected) {
        next[currentQuestion.id] = optionId;
      } else {
        delete next[currentQuestion.id];
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
      setSubmitError("Completa tutte le domande prima di inviare.");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      await actions.submitTest(testId, {
        answers: questions.map((question) => ({
          questionId: question.id,
          answerOptionId: answers[question.id],
        })),
      });
      setSubmitted(true);
    } catch {
      setSubmitError("Errore durante l'invio del test.");
    } finally {
      setSubmitting(false);
    }
  };

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
    selected: selectedOptionId === option.id,
  }));

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
        current={answeredCount}
        total={questions.length}
        helper="Completa tutte le domande per inviare il test."
      />

      <QuestionCard
        title={currentQuestion.question}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        options={optionItems}
        onOptionToggle={handleOptionToggle}
      />

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
