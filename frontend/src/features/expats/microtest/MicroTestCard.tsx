"use client";

import { useEffect, useState } from "react";
import { useT } from "@/hooks";
import { useMicroTest } from "../../../hooks/expats/useMicroTest";
import type { MicroTestAnswerRequest } from "../../../types/expats";
import MicroTestCountdown from "./MicroTestCountdown";
import MicroTestQuestions from "./MicroTestQuestions";

export default function MicroTestCard() {
  const { t } = useT();
  const { isLoading, microTestNext, loadNextMicroTest, submitMicroTest } = useMicroTest();
  const [showQuestions, setShowQuestions] = useState(false);

  useEffect(() => {
    loadNextMicroTest();
  }, [loadNextMicroTest]);

  if (!microTestNext) return null;

  const handleSubmit = async (answers: MicroTestAnswerRequest[]) => {
    try {
      await submitMicroTest(microTestNext.assignmentId, { answers });
      setShowQuestions(false);
      loadNextMicroTest();
    } catch {
      // error in store
    }
  };

  if (showQuestions && microTestNext.questions?.length > 0) {
    return (
      <MicroTestQuestions
        questions={microTestNext.questions}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        onCancel={() => setShowQuestions(false)}
      />
    );
  }

  return (
    <>
      <div className="mt-card">
        <div className="mt-card__header">
          <span className="mt-card__icon">🧠</span>
          <div>
            <h3 className="mt-card__title">{microTestNext.testTitle}</h3>
            <p className="mt-card__desc">{microTestNext.testDescription}</p>
          </div>
        </div>

        <div className="mt-card__meta">
          <MicroTestCountdown expiresAt={microTestNext.expiresAt} />
          {microTestNext.totalBlocks > 0 && (
            <span className="mt-card__progress">
              {t("Block")} {microTestNext.blockNumber}/{microTestNext.totalBlocks}
              {" · "}{microTestNext.completionPercent}%
            </span>
          )}
        </div>

        <button
          className="mt-card__cta"
          onClick={() => setShowQuestions(true)}
          disabled={isLoading}
          type="button"
        >
          {t("Start Test")}
        </button>
      </div>
      <style>{`
        .mt-card {
          background: #fff;
          border: 1px solid #e4e9f2;
          border-radius: 16px;
          padding: 22px;
          transition: box-shadow 0.2s;
        }
        .mt-card:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .mt-card__header {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .mt-card__icon {
          font-size: 2rem;
          flex-shrink: 0;
        }
        .mt-card__title {
          font-size: 1rem;
          font-weight: 800;
          color: #0d1b36;
          margin: 0 0 4px;
        }
        .mt-card__desc {
          font-size: 0.8125rem;
          color: #6c778a;
          margin: 0;
          line-height: 1.4;
        }
        .mt-card__meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .mt-card__progress {
          font-size: 0.75rem;
          color: #475569;
          font-weight: 600;
        }
        .mt-card__cta {
          width: 100%;
          padding: 12px;
          background: #3b6bdc;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }
        .mt-card__cta:hover:not(:disabled) {
          background: #2d5bc7;
        }
        .mt-card__cta:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}
