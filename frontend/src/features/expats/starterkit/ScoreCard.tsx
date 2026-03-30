"use client";

import ScoreBar from "./ScoreBar";

interface ScoreCardProps {
  icon: string;
  title: string;
  score: number;
  level: string;
  description: string;
  ctaLabel?: string;
  ctaDescription?: string;
}

function getLevelColor(score: number): string {
  if (score >= 70) return "#16a34a";
  if (score >= 50) return "#ca8a04";
  if (score >= 30) return "#ea580c";
  return "#dc2626";
}

function getBadgeBg(score: number): string {
  if (score >= 70) return "#f0fdf4";
  if (score >= 50) return "#fefce8";
  if (score >= 30) return "#fff7ed";
  return "#fef2f2";
}

export default function ScoreCard({ icon, title, score, level, description, ctaLabel, ctaDescription }: ScoreCardProps) {
  const color = getLevelColor(score);
  const badgeBg = getBadgeBg(score);

  return (
    <>
      <div className="sc-card">
        <div className="sc-card__header">
          <div className="sc-card__left">
            <span className="sc-card__icon">{icon}</span>
            <h3 className="sc-card__title">{title}</h3>
          </div>
          <div className="sc-card__right">
            <span className="sc-card__badge" style={{ background: badgeBg, color }}>{score}</span>
            <span className="sc-card__level" style={{ color }}>{level}</span>
          </div>
        </div>

        <ScoreBar value={score} />

        <p className="sc-card__desc" dangerouslySetInnerHTML={{ __html: description }} />

        {ctaLabel && (
          <div className="sc-card__cta">
            <span className="sc-card__cta-link">→ {ctaLabel} <span className="sc-card__coming">Coming Soon</span></span>
            {ctaDescription && <p className="sc-card__cta-desc">{ctaDescription}</p>}
          </div>
        )}
      </div>
      <style>{`
        .sc-card {
          background: #fff;
          border: 1px solid #e4e9f2;
          border-radius: 16px;
          padding: 24px 28px;
          margin-bottom: 16px;
        }
        .sc-card__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .sc-card__left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sc-card__icon {
          font-size: 1.75rem;
        }
        .sc-card__title {
          font-size: 1.0625rem;
          font-weight: 800;
          color: #0d1b36;
          margin: 0;
        }
        .sc-card__right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sc-card__badge {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9375rem;
          font-weight: 800;
        }
        .sc-card__level {
          font-size: 0.875rem;
          font-weight: 700;
        }
        .sc-card__desc {
          font-size: 0.875rem;
          color: #475569;
          line-height: 1.65;
          margin: 16px 0 0;
        }
        .sc-card__desc strong {
          color: #0d1b36;
        }
        .sc-card__cta {
          margin-top: 14px;
        }
        .sc-card__cta-link {
          font-size: 0.875rem;
          font-weight: 600;
          color: #3b6bdc;
          cursor: pointer;
        }
        .sc-card__coming {
          display: inline-block;
          margin-left: 8px;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.625rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          background: #fef9c3;
          color: #a16207;
          vertical-align: middle;
        }
        .sc-card__cta-desc {
          font-size: 0.8125rem;
          color: #6c778a;
          margin: 4px 0 0;
          line-height: 1.5;
        }
      `}</style>
    </>
  );
}
