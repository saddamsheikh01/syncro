"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useExpats } from "../../../hooks/expats/useExpats";

type SocialPriority = "low" | "medium" | "high";
type HousingTiming = "asap" | "2_months_plus" | "not_sure";

const SOCIAL_OPTIONS: { value: SocialPriority; label: string; emoji: string; color: string }[] = [
  { value: "low", label: "Low Priority", emoji: "🟢", color: "#22a55f" },
  { value: "medium", label: "Medium Priority", emoji: "🟡", color: "#f2b203" },
  { value: "high", label: "High Priority", emoji: "🔴", color: "#e05555" },
];

const HOUSING_OPTIONS: { value: HousingTiming; label: string; color: string }[] = [
  { value: "asap", label: "As Soon As Possible", color: "#d1fae5" },
  { value: "2_months_plus", label: "In More Than 2 Months", color: "#fef9c3" },
  { value: "not_sure", label: "I'm Not Sure Yet", color: "#fee2e2" },
];

interface Props {
  stepLabel?: string;
  totalSteps?: number;
  currentStep?: number;
  onComplete?: () => void;
}

export default function OnboardingPreferences({
  stepLabel = "Step 1 Of 3",
  onComplete,
}: Props) {
  const router = useRouter();
  const { patchOnboarding, isLoading } = useExpats();

  const [socialPriority, setSocialPriority] = useState<SocialPriority | null>(null);
  const [housingTiming, setHousingTiming] = useState<HousingTiming | null>(null);

  const progress = ((socialPriority ? 1 : 0) + (housingTiming ? 1 : 0)) / 2;

  const handleUpdate = async () => {
    if (!socialPriority) return;
    try {
      await patchOnboarding({ socialPriority });
      if (onComplete) {
        onComplete();
      } else {
        router.push("/expats/activation");
      }
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="op-wrap">
      <div className="op-bg-blob op-bg-blob--tl" />
      <div className="op-bg-blob op-bg-blob--br" />

      <div className="op-card">
        <div className="op-question-block">
          <h2 className="op-question">How Important Is Social Integration<br />For You Right Now?</h2>
          <div className="op-options op-options--row">
            {SOCIAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`op-option ${socialPriority === opt.value ? "op-option--selected" : ""}`}
                onClick={() => setSocialPriority(opt.value)}
              >
                <span className="op-option__icon" style={{ fontSize: '2rem' }}>
                  <svg viewBox="0 0 48 48" width="40" height="40">
                    <polygon points="24,4 44,44 4,44" fill="none" strokeWidth="3" stroke={opt.color} />
                    <text x="24" y="38" textAnchor="middle" fontSize="18" fill={opt.color} fontWeight="bold">!</text>
                  </svg>
                </span>
                <span className="op-option__label">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="op-question-block">
          <h2 className="op-question">When Would It Be Ideal<br />For You To Find Housing?</h2>
          <div className="op-options op-options--col">
            {HOUSING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`op-option op-option--pill ${housingTiming === opt.value ? "op-option--selected" : ""}`}
                style={{ background: housingTiming === opt.value ? opt.color : opt.color + "66" }}
                onClick={() => setHousingTiming(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="op-footer">
          <div className="op-progress-bar">
            <div className="op-progress-bar__fill" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="op-footer-row">
            <span className="op-step-label">{stepLabel}</span>
            <button
              className="op-cta-btn"
              onClick={handleUpdate}
              disabled={!socialPriority || isLoading}
            >
              {isLoading ? "Saving…" : "Update My Preferences"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .op-wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f7f9ff;
          position: relative;
          overflow: hidden;
          font-family: var(--font-geist-sans);
          padding: 24px;
        }
        .op-bg-blob {
          position: absolute;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: rgba(59,107,220,0.08);
          pointer-events: none;
        }
        .op-bg-blob--tl { top: -80px; left: -80px; }
        .op-bg-blob--br { bottom: -80px; right: -80px; }
        .op-card {
          background: #fff;
          border-radius: 28px;
          box-shadow: 0 20px 60px rgba(15,23,42,0.1);
          padding: 40px 44px;
          max-width: 700px;
          width: 100%;
          position: relative;
          z-index: 1;
        }
        .op-question-block { margin-bottom: 36px; }
        .op-question {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0d1b36;
          text-align: center;
          margin-bottom: 28px;
          line-height: 1.3;
        }
        .op-options { display: flex; gap: 16px; justify-content: center; }
        .op-options--row { flex-direction: row; flex-wrap: wrap; }
        .op-options--col { flex-direction: column; max-width: 360px; margin: 0 auto; }
        .op-option {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 18px 28px;
          border: 2px solid #e4e9f2;
          border-radius: 16px;
          background: #fff;
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
          font-size: 0.9rem; color: #0d1b36; font-weight: 600;
          min-width: 140px;
        }
        .op-option--pill {
          flex-direction: row;
          text-align: center;
          justify-content: center;
          padding: 14px 24px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 700;
        }
        .op-option:hover { border-color: #3b6bdc; transform: translateY(-2px); }
        .op-option--selected { border-color: #3b6bdc; box-shadow: 0 0 0 3px rgba(59,107,220,0.15); }
        .op-option__icon { font-size: 2.4rem; }
        .op-option__label { font-size: 0.85rem; font-weight: 700; text-align: center; color: #1a2433; }
        .op-footer { margin-top: 8px; }
        .op-progress-bar {
          height: 6px; background: #e4e9f2; border-radius: 3px; margin-bottom: 20px;
        }
        .op-progress-bar__fill {
          height: 100%; background: #3b6bdc; border-radius: 3px;
          transition: width 0.3s ease;
        }
        .op-footer-row { display: flex; align-items: center; justify-content: space-between; }
        .op-step-label { font-size: 0.85rem; color: #6c778a; font-weight: 500; }
        .op-cta-btn {
          background: #3b6bdc; color: #fff; border: none; border-radius: 50px;
          padding: 14px 32px; font-size: 0.95rem; font-weight: 700;
          cursor: pointer; transition: background 0.2s, opacity 0.2s;
        }
        .op-cta-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .op-cta-btn:not(:disabled):hover { background: #2c55b5; }
        @media (max-width: 600px) {
          .op-card { padding: 28px 20px; }
          .op-question { font-size: 1.2rem; }
          .op-options--row { flex-direction: column; align-items: center; }
          .op-option { min-width: 200px; width: 100%; }
        }
      `}</style>
    </div>
  );
}
