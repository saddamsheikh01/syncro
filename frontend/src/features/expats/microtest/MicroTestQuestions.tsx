"use client";

import { useState } from "react";
import { useT } from "@/hooks";
import type { MicroTestQuestionResponse, MicroTestAnswerRequest } from "../../../types/expats";

interface MicroTestQuestionsProps {
  questions: MicroTestQuestionResponse[];
  isLoading: boolean;
  onSubmit: (answers: MicroTestAnswerRequest[]) => void;
  onCancel: () => void;
}

export default function MicroTestQuestions({ questions, isLoading, onSubmit, onCancel }: MicroTestQuestionsProps) {
  const { t } = useT();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const handleSelect = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const allAnswered = questions.every((q) => selectedAnswers[q.questionId]);

  const handleSubmit = () => {
    const answers: MicroTestAnswerRequest[] = questions.map((q) => ({
      questionId: q.questionId,
      answerOptionId: selectedAnswers[q.questionId],
    }));
    onSubmit(answers);
  };

  return (
    <>
      <div className="mt-questions" data-testid="micro-test-questions">
        {questions.map((q, idx) => (
          <div key={q.questionId} className="mt-question" data-testid={`micro-test-question-${idx + 1}`}>
            <p className="mt-question__text">
              <span className="mt-question__num">{idx + 1}.</span> {q.questionText}
            </p>
            <div className="mt-question__options">
              {q.options.map((opt) => {
                const isSelected = selectedAnswers[q.questionId] === opt.optionId;
                return (
                  <button
                    key={opt.optionId}
                    className={`mt-option ${isSelected ? "mt-option--selected" : ""}`}
                    onClick={() => handleSelect(q.questionId, opt.optionId)}
                    type="button"
                  >
                    <span className="mt-option__radio">{isSelected ? "●" : "○"}</span>
                    {opt.answerText}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="mt-questions__actions">
          <button className="mt-btn mt-btn--secondary" data-testid="micro-test-cancel" onClick={onCancel} type="button">
            {t("Cancel")}
          </button>
          <button
            data-testid="micro-test-submit"
            className="mt-btn mt-btn--primary"
            onClick={handleSubmit}
            disabled={!allAnswered || isLoading}
            type="button"
          >
            {isLoading ? t("Submitting...") : t("Submit Answers")}
          </button>
        </div>
      </div>
      <style>{`
        .mt-questions {
          background: #fff;
          border: 1px solid #e4e9f2;
          border-radius: 16px;
          padding: 28px;
        }
        .mt-question {
          margin-bottom: 24px;
        }
        .mt-question:last-of-type {
          margin-bottom: 20px;
        }
        .mt-question__text {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #0d1b36;
          margin: 0 0 12px;
          line-height: 1.5;
        }
        .mt-question__num {
          color: #3b6bdc;
          font-weight: 800;
        }
        .mt-question__options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mt-option {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          text-align: left;
          padding: 12px 16px;
          border: 1px solid #e4e9f2;
          border-radius: 10px;
          background: #f8fafd;
          font-size: 0.875rem;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mt-option:hover {
          border-color: #3b6bdc;
          background: #f0f4ff;
        }
        .mt-option--selected {
          border-color: #3b6bdc;
          background: #f0f4ff;
          color: #0d1b36;
          font-weight: 600;
        }
        .mt-option__radio {
          color: #3b6bdc;
          font-size: 1rem;
        }
        .mt-questions__actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1px solid #f0f3f8;
        }
        .mt-btn {
          padding: 10px 24px;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        .mt-btn--secondary {
          background: #f0f3f8;
          color: #6c778a;
        }
        .mt-btn--secondary:hover {
          background: #e4e9f2;
        }
        .mt-btn--primary {
          background: #3b6bdc;
          color: #fff;
        }
        .mt-btn--primary:hover:not(:disabled) {
          background: #2d5bc7;
        }
        .mt-btn--primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}
