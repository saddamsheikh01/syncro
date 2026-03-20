"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getCities } from "@/services/expats";
import type { CityListItem } from "@/types/expats";

interface Props {
  defaultCurrentCity?: string;
  defaultTargetCity?: string;
  defaultCurrentCityId?: string;
  defaultTargetCityId?: string;
  defaultTargetType?: string;
  onChange: (data: {
    currentCityName?: string;
    targetCityName?: string;
    currentCityId?: string;
    targetCityId?: string;
    targetType?: "specific_city" | "already_live" | "not_sure";
  }) => void;
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

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function CityCatalogCombo({
  label,
  value,
  cityId,
  cities,
  placeholder,
  onPick,
}: {
  label: string;
  value: string;
  cityId?: string;
  cities: CityListItem[];
  placeholder: string;
  onPick: (name: string, id?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQ(value), [value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const n = normalize(q);
    if (!n) return cities.slice(0, 12);
    return cities
      .filter((c) => {
        const cn = normalize(c.cityName);
        const slug = (c.citySlug ?? "").toLowerCase();
        const co = normalize(c.country);
        return cn.includes(n) || slug.includes(n.replace(/\s+/g, "-")) || co.includes(n) || n.includes(cn);
      })
      .slice(0, 12);
  }, [cities, q]);

  const selectCity = (c: CityListItem) => {
    onPick(c.cityName, c.id);
    setQ(c.cityName);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="city-catalog-combo">
      <p className="city-catalog-combo__label">{label}</p>
      <div className="city-origin-card__input-row">
        <img
          src="/images/onboarding/assests/image%202334.png"
          alt=""
          className="city-origin-card__input-icon"
        />
        <input
          type="text"
          placeholder={placeholder}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            onPick(e.target.value, undefined);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="city-origin-card__input"
          aria-expanded={open}
          aria-haspopup="listbox"
        />
      </div>
      {cityId ? (
        <p className="city-catalog-combo__hint">Catalog match — scoring will use city ID.</p>
      ) : (
        <p className="city-catalog-combo__hint subtle">Pick from list or type a name (best match from catalog).</p>
      )}
      {open && filtered.length > 0 ? (
        <ul className="city-catalog-combo__list" role="listbox">
          {filtered.map((c) => (
            <li key={c.id}>
              <button type="button" className="city-catalog-combo__opt" onClick={() => selectCity(c)}>
                <strong>{c.cityName}</strong>
                <span>{c.country}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <style>{`
        .city-catalog-combo { position: relative; width: 100%; }
        .city-catalog-combo__label { font-size: 0.72rem; font-weight: 600; color: #6c778a; margin-bottom: 6px; }
        .city-catalog-combo__hint { font-size: 0.68rem; color: #3b6bdc; margin-top: 6px; }
        .city-catalog-combo__hint.subtle { color: #6c778a; }
        .city-catalog-combo__list {
          position: absolute; z-index: 20; left: 0; right: 0; top: 100%; margin-top: 4px;
          max-height: 220px; overflow-y: auto; background: #fff; border: 1px solid #e4e9f2;
          border-radius: 10px; box-shadow: 0 8px 24px rgba(13,27,54,.12); padding: 4px 0; list-style: none;
        }
        .city-catalog-combo__opt {
          width: 100%; text-align: left; padding: 8px 12px; border: none; background: transparent;
          cursor: pointer; font-size: 0.82rem; display: flex; flex-direction: column; gap: 2px;
        }
        .city-catalog-combo__opt:hover { background: #f3f6fb; }
        .city-catalog-combo__opt span { font-size: 0.72rem; color: #6c778a; }
      `}</style>
    </div>
  );
}

export default function Step2CitySelection({
  defaultCurrentCity = "",
  defaultTargetCity = "",
  defaultCurrentCityId = "",
  defaultTargetCityId = "",
  defaultTargetType = "",
  onChange,
}: Props) {
  const [cities, setCities] = useState<CityListItem[]>([]);
  const [currentCity, setCurrentCity] = useState(defaultCurrentCity);
  const [currentCityId, setCurrentCityId] = useState(defaultCurrentCityId);
  const [targetCity, setTargetCity] = useState(defaultTargetCity);
  const [targetCityId, setTargetCityId] = useState(defaultTargetCityId);
  const [targetType, setTargetType] = useState<"specific_city" | "already_live" | "not_sure" | "">(
    (defaultTargetType as "specific_city" | "already_live" | "not_sure") ?? ""
  );

  useEffect(() => {
    getCities()
      .then(setCities)
      .catch((e) => {
        console.error("[Step2CitySelection] getCities failed", e);
        setCities([]);
      });
  }, []);

  const emit = (
    cc = currentCity,
    ccId = currentCityId,
    tc = targetCity,
    tcId = targetCityId,
    tt: "specific_city" | "already_live" | "not_sure" | "" = targetType
  ) => {
    if (!tt) return;
    onChange({
      currentCityName: cc,
      currentCityId: ccId || undefined,
      targetCityName: tc || undefined,
      targetCityId: tt === "specific_city" ? tcId || undefined : undefined,
      targetType: tt,
    });
  };

  const selectTargetType = (val: "specific_city" | "already_live" | "not_sure") => {
    setTargetType(val);
    emit(currentCity, currentCityId, targetCity, val === "specific_city" ? targetCityId : "", val);
  };

  return (
    <div className="funnel-step">
      <h1 className="funnel-step__title">
        Where Are You Now And<br />Where Would You Like To Go?
      </h1>
      <p className="funnel-step__sub">We&apos;ll Show How Your Life Could Change There.</p>

      <div className="city-origin-card">
        <img
          src="/images/onboarding/assests/image%202334.png"
          alt="City"
          className="city-origin-card__img"
        />
        <CityCatalogCombo
          label="Where are you now?"
          value={currentCity}
          cityId={currentCityId}
          cities={cities}
          placeholder="Search city (e.g. Lisbon)..."
          onPick={(name, id) => {
            setCurrentCity(name);
            setCurrentCityId(id ?? "");
            emit(name, id ?? "", targetCity, targetCityId);
          }}
        />
      </div>

      <div className="city-dest-grid">
        {TARGET_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => selectTargetType(opt.value)}
            className={`city-dest-card ${targetType === opt.value ? "city-dest-card--selected" : ""}`}
          >
            <div className="city-dest-card__visual">
              <img src={opt.image} alt={opt.label} className="city-dest-card__img" />
            </div>
            {opt.value === "specific_city" && targetType === "specific_city" && (
              <div className="city-dest-card__input-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
                <CityCatalogCombo
                  label="Destination city"
                  value={targetCity}
                  cityId={targetCityId}
                  cities={cities}
                  placeholder="Search destination..."
                  onPick={(name, id) => {
                    setTargetCity(name);
                    setTargetCityId(id ?? "");
                    emit(currentCity, currentCityId, name, id ?? "");
                  }}
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
          max-width: 360px;
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
          max-width: 900px;
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
          min-height: 120px;
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
          padding: 8px 10px;
          width: 100%;
        }
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
