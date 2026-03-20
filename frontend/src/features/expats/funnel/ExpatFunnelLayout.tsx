"use client";

import { useRouter } from "next/navigation";
import { type ReactNode } from "react";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch";
import { useT } from "@/hooks";

interface Props {
  step: number;
  totalSteps?: number;
  onBack?: () => void;
  onContinue?: () => void;
  continueDisabled?: boolean;
  continueLabel?: string;
  isLoading?: boolean;
  children: ReactNode;
}

export default function ExpatFunnelLayout({
  step,
  totalSteps = 10,
  onBack,
  onContinue,
  continueDisabled = false,
  continueLabel,
  isLoading = false,
  children,
}: Props) {
  const router = useRouter();
  const { t } = useT();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (step > 1) {
      router.push(`/expats/funnel/${step - 1}`);
    } else {
      router.push("/expats");
    }
  };

  const progressPct = (step / totalSteps) * 100;
  const label =
    continueLabel ?? (step === totalSteps ? t("Expats.funnel.generate") : t("Expats.funnel.continue"));

  return (
    <div className="funnel-shell">
      {/* Figma background decorations */}
      <img
        src="/images/onboarding/assests/image%202319.png"
        alt=""
        className="funnel-deco funnel-deco--tr"
        aria-hidden="true"
      />
      <img
        src="/images/onboarding/assests/image%202320.png"
        alt=""
        className="funnel-deco funnel-deco--br"
        aria-hidden="true"
      />
      <img
        src="/images/onboarding/assests/image%202321.png"
        alt=""
        className="funnel-deco funnel-deco--bl"
        aria-hidden="true"
      />

      {/* Language selector (top-left) */}
      <div className="funnel-lang">
        <LanguageSwitch variant="expat" align="left" className="funnel-lang__switch" />
      </div>

      {/* Main content */}
      <div className="funnel-body">{children}</div>

      {/* Progress + navigation (bottom) */}
      <div className="funnel-footer">
        <div className="funnel-progress">
          <div
            className="funnel-progress__bar"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="funnel-footer__nav">
          {step > 1 ? (
            <button onClick={handleBack} className="funnel-btn-back">
              {t("Expats.funnel.back")}
            </button>
          ) : (
            <div />
          )}
          <span className="funnel-footer__step">
            {t("Expats.funnel.stepOf", { step: String(step), total: String(totalSteps) })}
          </span>
          <button
            onClick={onContinue}
            disabled={continueDisabled || isLoading}
            className="funnel-btn-continue"
          >
            {isLoading ? t("Expats.funnel.saving") : label}
          </button>
        </div>
      </div>

      <style>{`
        /* ── Shared step styles (available to all steps) ── */
        .funnel-step {
          text-align: center;
          width: 100%;
          max-width: 900px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .funnel-step__title {
          font-size: 2.25rem;
          font-weight: 800;
          color: #0d1b36;
          margin-bottom: 48px;
          line-height: 1.25;
          letter-spacing: -0.5px;
        }
        .funnel-step__sub {
          font-size: 1.05rem;
          color: #6c778a;
          margin-top: -32px;
          margin-bottom: 40px;
          line-height: 1.5;
        }
        .funnel-cards-row {
          display: grid;
          gap: 24px;
          justify-items: center;
          width: 100%;
        }
        .funnel-cards-row--2 { grid-template-columns: repeat(2, 1fr); }
        .funnel-cards-row--3 { grid-template-columns: repeat(3, 1fr); }
        .funnel-cards-row--4 { grid-template-columns: repeat(4, 1fr); }
        .funnel-cards-row--5 { grid-template-columns: repeat(5, 1fr); }
        .funnel-cards-row--6 { grid-template-columns: repeat(3, 1fr); }
        .funnel-cards-row--8 { grid-template-columns: repeat(4, 1fr); }

        @media (max-width: 900px) {
          .funnel-step__title { font-size: 1.75rem; }
          .funnel-cards-row--3 { gap: 16px; }
          .funnel-cards-row--5 { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 600px) {
          .funnel-step__title { font-size: 1.5rem; }
          .funnel-cards-row--3,
          .funnel-cards-row--4,
          .funnel-cards-row--5,
          .funnel-cards-row--6,
          .funnel-cards-row--8 {
            grid-template-columns: 1fr;
          }
        }

        /* ── Layout shell ── */
        .funnel-shell {
          position: relative;
          min-height: 100vh;
          background: #fff;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', var(--font-geist-sans, system-ui, sans-serif);
          overflow: hidden;
        }

        .funnel-deco {
          position: absolute;
          pointer-events: none;
          z-index: 0;
        }
        .funnel-deco--tr {
          top: 0;
          right: 0;
          width: 500px;
          height: auto;
        }
        .funnel-deco--br {
          bottom: 60px;
          right: 0;
          width: 180px;
          height: auto;
        }
        .funnel-deco--bl {
          bottom: 0;
          left: 0;
          width: 300px;
          height: auto;
          opacity: 0.8;
        }

        .funnel-lang {
          position: absolute;
          top: 20px;
          left: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          border: 1px solid #e4e9f2;
          border-radius: 10px;
          padding: 8px 14px;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .funnel-lang__switch button svg {
          color: #6c778a;
        }

        .funnel-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 32px 130px;
          position: relative;
          z-index: 1;
        }

        .funnel-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #fff;
          border-top: 1px solid #eef1f6;
          z-index: 20;
        }
        .funnel-progress {
          height: 6px;
          background: #e4e9f2;
        }
        .funnel-progress__bar {
          height: 100%;
          background: linear-gradient(90deg, #3b6bdc, #4b7cf0);
          border-radius: 0 3px 3px 0;
          transition: width 0.4s ease;
          min-width: 6px;
        }
        .funnel-footer__nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 40px;
        }
        .funnel-btn-back {
          background: transparent;
          border: 1.5px solid #d5ddea;
          border-radius: 10px;
          padding: 12px 28px;
          font-size: 0.95rem;
          font-weight: 600;
          color: #1a2433;
          cursor: pointer;
          transition: background 0.15s;
        }
        .funnel-btn-back:hover {
          background: #f3f6fb;
        }
        .funnel-footer__step {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--accent, #3b6bdc);
        }
        .funnel-btn-continue {
          background: var(--accent, #3b6bdc);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 12px 36px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          min-width: 160px;
        }
        .funnel-btn-continue:hover:not(:disabled) {
          background: var(--accent-strong, #2f5ec8);
          transform: translateY(-1px);
        }
        .funnel-btn-continue:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .funnel-cards-row--4,
          .funnel-cards-row--8 {
            grid-template-columns: 1fr 1fr;
          }
          .funnel-body {
            padding: 70px 24px 120px;
          }
        }
        @media (max-width: 600px) {
          .funnel-body {
            padding: 70px 20px 120px;
          }
          .funnel-footer__nav {
            padding: 14px 20px;
          }
          .funnel-btn-back {
            padding: 10px 18px;
            font-size: 0.85rem;
          }
          .funnel-btn-continue {
            padding: 10px 24px;
            font-size: 0.9rem;
            min-width: 130px;
          }
          .funnel-deco--tr {
            width: 200px;
          }
          .funnel-deco--br {
            width: 100px;
          }
          .funnel-deco--bl {
            width: 160px;
          }
        }
        @media (max-width: 400px) {
          .funnel-cards-row--2,
          .funnel-cards-row--3,
          .funnel-cards-row--4,
          .funnel-cards-row--5,
          .funnel-cards-row--6,
          .funnel-cards-row--8 {
            grid-template-columns: 1fr;
          }
          .funnel-footer__nav {
            padding: 10px 12px;
          }
          .funnel-deco {
            display: none;
          }
          .funnel-lang {
            position: relative;
            top: auto;
            left: auto;
            margin: 12px 16px 0;
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
