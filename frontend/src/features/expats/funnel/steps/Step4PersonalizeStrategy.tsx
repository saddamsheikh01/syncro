"use client";

import { useState } from "react";

const AGE_RANGES = [
  { value: "18_24", label: "18–24", color: "#D4F5D4", border: "#66BB6A" },
  { value: "25_34", label: "25–34", color: "#C8E8FF", border: "#42A5F5" },
  { value: "35_44", label: "35–44", color: "#F5D4E8", border: "#EC407A" },
  { value: "45_54", label: "45–54", color: "#FFFBD4", border: "#FBC02D" },
  { value: "55_plus", label: "55+", color: "#FFD4D4", border: "#EF5350" },
];

const GENDERS = [
  {
    value: "male",
    label: "Male",
    image: "/images/onboarding/assests/image%202330%20(1).png",
    bg: "#EEF4FF",
    accent: "#3B6BDC",
  },
  {
    value: "female",
    label: "Female",
    image: "/images/onboarding/assests/image%202327%20(1).png",
    bg: "#FCE4EC",
    accent: "#EC407A",
  },
  {
    value: "prefer_not_to_say",
    label: "Prefer Not To Say",
    image: "/images/onboarding/assests/image%202331%20(1).png",
    bg: "#FFF8E8",
    accent: "#D4A44C",
  },
];

interface Props {
  defaultAgeRange?: string;
  defaultGender?: string;
  onChange: (data: { ageRange?: string; gender?: string }) => void;
}

export default function Step4PersonalizeStrategy({ defaultAgeRange, defaultGender, onChange }: Props) {
  const [ageRange, setAgeRange] = useState(defaultAgeRange ?? "");
  const [gender, setGender] = useState(defaultGender ?? "");

  const emit = (ar = ageRange, g = gender) => onChange({ ageRange: ar, gender: g });

  const pickAge = (val: string) => { setAgeRange(val); emit(val, gender); };
  const pickGender = (val: string) => { setGender(val); emit(ageRange, val); };

  return (
    <div className="funnel-step">
      <h1 className="funnel-step__title">Let's Personalize Your Strategy</h1>

      <div className="strategy-section">
        <p className="strategy-label">Age:</p>
        <div className="age-grid">
          {AGE_RANGES.map((a) => (
            <button
              key={a.value}
              onClick={() => pickAge(a.value)}
              className={`age-chip ${ageRange === a.value ? "age-chip--selected" : ""}`}
              style={{
                "--age-bg": a.color,
                "--age-border": a.border,
              } as React.CSSProperties}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="strategy-section">
        <p className="strategy-label">Gender</p>
        <div className="gender-grid">
          {GENDERS.map((g) => (
            <button
              key={g.value}
              onClick={() => pickGender(g.value)}
              className={`gender-card ${gender === g.value ? "gender-card--selected" : ""}`}
              style={{ "--gender-bg": g.bg, "--gender-accent": g.accent } as React.CSSProperties}
            >
              <div className="gender-card__icon-wrap">
                <img src={g.image} alt={g.label} className="gender-card__img" />
              </div>
              <span className="gender-card__label">{g.label}</span>
              {gender === g.value && (
                <span className="gender-card__check">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .strategy-section {
          margin-bottom: 40px;
          width: 100%;
          max-width: 680px;
          text-align: left;
        }
        .strategy-label {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0d1b36;
          margin-bottom: 16px;
        }
        .age-grid {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }
        .age-chip {
          background: var(--age-bg, #f3f6fb);
          border: 2.5px solid transparent;
          border-radius: 16px;
          padding: 20px 28px;
          font-size: 1.3rem;
          font-weight: 800;
          color: #0d1b36;
          cursor: pointer;
          min-width: 90px;
          transition: border-color 0.2s, transform 0.15s, box-shadow 0.2s;
        }
        .age-chip:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .age-chip--selected {
          border-color: var(--age-border, #3b6bdc);
          box-shadow: 0 4px 16px rgba(59, 107, 220, 0.15);
        }
        .gender-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          max-width: 680px;
          width: 100%;
        }
        .gender-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          background: #fff;
          border: 2px solid #e4e9f2;
          border-radius: 18px;
          padding: 28px 20px 22px;
          cursor: pointer;
          width: 100%;
          transition: border-color 0.2s, transform 0.15s, box-shadow 0.2s;
          position: relative;
        }
        .gender-card:hover {
          border-color: var(--gender-accent, #3b6bdc);
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
        }
        .gender-card--selected {
          border-color: var(--gender-accent, #3b6bdc);
          box-shadow: 0 6px 24px rgba(59, 107, 220, 0.15);
        }
        .gender-card__icon-wrap {
          width: 110px;
          height: 110px;
          border-radius: 20px;
          background: var(--gender-bg, #f8fafd);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gender-card__img {
          width: 70px;
          height: 70px;
          object-fit: contain;
        }
        .gender-card__label {
          font-size: 1rem;
          font-weight: 700;
          color: #0d1b36;
        }
        .gender-card__check {
          position: absolute;
          top: 12px;
          right: 14px;
          width: 26px;
          height: 26px;
          background: var(--gender-accent, #3b6bdc);
          color: #fff;
          border-radius: 50%;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 600px) {
          .gender-grid {
            grid-template-columns: 1fr 1fr;
          }
          .age-chip {
            padding: 16px 20px;
            font-size: 1.1rem;
          }
        }
      `}</style>
    </div>
  );
}
