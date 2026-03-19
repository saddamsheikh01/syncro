"use client";

import { useState } from "react";

interface Props {
  defaultCurrentCity?: string;
  defaultTargetCity?: string;
  defaultTargetType?: string;
  onChange: (data: { currentCityName?: string; targetCityName?: string; targetType?: "specific_city" | "already_live" | "not_sure" }) => void;
}

const TARGET_OPTIONS: {
  value: "specific_city" | "already_live" | "not_sure";
  label: string;
  sublabel?: string;
  image: string;
}[] = [
  {
    value: "already_live",
    label: "I Already Live Here",
    image: "/images/onboarding/assests/image%202322%20(1).png",
  },
  {
    value: "specific_city",
    label: "Where Would You Like To Go?",
    image: "/images/onboarding/assests/image%202333.png",
  },
  {
    value: "not_sure",
    label: "I'm Not Sure Yet",
    sublabel: "Help Me Choose The Right City",
    image: "/images/onboarding/assests/image%202325%20(1).png",
  },
];

export default function Step2CitySelection({
  defaultCurrentCity = "",
  defaultTargetCity = "",
  defaultTargetType = "",
  onChange,
}: Props) {
  const [currentCity, setCurrentCity] = useState(defaultCurrentCity);
  const [targetCity, setTargetCity] = useState(defaultTargetCity);
  const [targetType, setTargetType] = useState<"specific_city" | "already_live" | "not_sure" | "">(
    (defaultTargetType as "specific_city" | "already_live" | "not_sure") ?? ""
  );

  const emit = (
    cc = currentCity,
    tc = targetCity,
    tt: "specific_city" | "already_live" | "not_sure" | "" = targetType
  ) => {
    if (tt) onChange({ currentCityName: cc, targetCityName: tc || undefined, targetType: tt });
  };

  const selectTargetType = (val: "specific_city" | "already_live" | "not_sure") => {
    setTargetType(val);
    emit(currentCity, targetCity, val);
  };

  return (
    <div className="funnel-step">
      <h1 className="funnel-step__title">
        Where Are You Now And<br />Where Would You Like To Go?
      </h1>
      <p className="funnel-step__sub">We'll Show How Your Life Could Change There.</p>

      {/* "Where Are You Now?" — vertical card matching Figma */}
      <div className="city-origin-card">
        <img
          src="/images/onboarding/assests/image%202334.png"
          alt="City"
          className="city-origin-card__img"
        />
        <p className="city-origin-card__label">Where Are You Now?</p>
        <div className="city-origin-card__input-row">
          <img
            src="/images/onboarding/assests/image%202334.png"
            alt=""
            className="city-origin-card__input-icon"
          />
          <input
            type="text"
            placeholder="Lisbon, London..."
            value={currentCity}
            onChange={(e) => { setCurrentCity(e.target.value); emit(e.target.value); }}
            className="city-origin-card__input"
          />
        </div>
      </div>

      {/* Destination option cards */}
      <div className="city-dest-grid">
        {TARGET_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => selectTargetType(opt.value)}
            className={`city-dest-card ${targetType === opt.value ? "city-dest-card--selected" : ""}`}
          >
            <div className="city-dest-card__visual">
              <img src={opt.image} alt={opt.label} className="city-dest-card__img" />
            </div>
            {opt.value === "specific_city" && targetType === "specific_city" && (
              <div className="city-dest-card__input-row">
                <img
                  src="/images/onboarding/assests/image%202334.png"
                  alt=""
                  className="city-dest-card__input-icon"
                />
                <input
                  type="text"
                  placeholder="Lisbon, London..."
                  value={targetCity}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => { setTargetCity(e.target.value); emit(currentCity, e.target.value); }}
                  className="city-dest-card__input"
                  autoFocus
                />
              </div>
            )}
            <span className="city-dest-card__label">{opt.label}</span>
            {opt.sublabel && <span className="city-dest-card__sublabel">{opt.sublabel}</span>}
          </button>
        ))}
      </div>

      <style>{`
        .city-origin-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          background: #fff;
          border: 1.5px solid #e4e9f2;
          border-radius: 16px;
          padding: 24px 32px 20px;
          max-width: 320px;
          width: 100%;
          margin-bottom: 24px;
          transition: border-color 0.15s;
        }
        .city-origin-card:focus-within {
          border-color: #3b6bdc;
        }
        .city-origin-card__img {
          width: 110px;
          height: 110px;
          object-fit: contain;
        }
        .city-origin-card__label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #0d1b36;
        }
        .city-origin-card__input-row {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafd;
          border: 1px solid #e4e9f2;
          border-radius: 10px;
          padding: 8px 12px;
          width: 100%;
        }
        .city-origin-card__input-icon {
          width: 20px;
          height: 20px;
          object-fit: contain;
          opacity: 0.6;
        }
        .city-origin-card__input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 0.85rem;
          color: #1a2433;
          background: transparent;
          font-family: inherit;
        }
        .city-origin-card__input::placeholder { color: #aab5c8; }

        .city-dest-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          max-width: 780px;
          width: 100%;
        }
        .city-dest-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 24px 18px 22px;
          background: #fff;
          border: 2px solid #e4e9f2;
          border-radius: 16px;
          cursor: pointer;
          width: 100%;
          min-height: 260px;
          text-align: center;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
        }
        .city-dest-card:hover {
          border-color: #3b6bdc;
          box-shadow: 0 4px 20px rgba(59, 107, 220, 0.12);
          transform: translateY(-2px);
        }
        .city-dest-card--selected {
          border-color: #3b6bdc;
          box-shadow: 0 4px 20px rgba(59, 107, 220, 0.18);
        }
        .city-dest-card__visual {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 140px;
        }
        .city-dest-card__img {
          max-width: 160px;
          max-height: 160px;
          object-fit: contain;
        }
        .city-dest-card__input-row {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f8fafd;
          border: 1px solid #e4e9f2;
          border-radius: 8px;
          padding: 6px 10px;
          width: 100%;
        }
        .city-dest-card__input-icon {
          width: 16px;
          height: 16px;
          object-fit: contain;
          opacity: 0.6;
        }
        .city-dest-card__input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 0.8rem;
          color: #1a2433;
          background: transparent;
          font-family: inherit;
        }
        .city-dest-card__input::placeholder { color: #aab5c8; }
        .city-dest-card__label {
          font-size: 0.95rem;
          font-weight: 600;
          color: #0d1b36;
          line-height: 1.3;
        }
        .city-dest-card__sublabel {
          font-size: 0.8rem;
          color: #6c778a;
          margin-top: -4px;
        }

        @media (max-width: 600px) {
          .city-dest-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}
