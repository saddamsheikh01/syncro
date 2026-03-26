"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/hooks";
import { getCities } from "@/services/expats";
import type { CityListItem } from "@/types/expats";
import styles from "./Step2CitySelection.module.css";

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

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function CityCatalogCombo({
  label,
  value,
  cityId,
  cities,
  placeholder,
  hintMatched,
  hintPick,
  onPick,
}: {
  label: string;
  value: string;
  cityId?: string;
  cities: CityListItem[];
  placeholder: string;
  hintMatched: string;
  hintPick: string;
  onPick: (name: string, id?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value);
  const wrapRef = useRef<HTMLDivElement>(null);

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
    <div ref={wrapRef} className={styles.cityCatalogCombo}>
      <p className={styles.cityCatalogComboLabel}>{label}</p>
      <div className={styles.cityOriginCardInputRow}>
        <img
          src="/images/onboarding/assests/image%202334.png"
          alt=""
          className={styles.cityOriginCardInputIcon}
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
          className={styles.cityOriginCardInput}
          aria-expanded={open}
          aria-haspopup="listbox"
        />
      </div>
      {cityId ? (
        <p className={styles.cityCatalogComboHint}>{hintMatched}</p>
      ) : (
        <p className={styles.cityCatalogComboHintSubtle}>{hintPick}</p>
      )}
      {open && filtered.length > 0 ? (
        <ul className={styles.cityCatalogComboList} role="listbox">
          {filtered.map((c) => (
            <li key={c.id}>
              <button type="button" className={styles.cityCatalogComboOpt} onClick={() => selectCity(c)}>
                <strong>{c.cityName}</strong>
                <span>{c.country}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
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
  const { t } = useT();
  const [cities, setCities] = useState<CityListItem[]>([]);
  const [currentCity, setCurrentCity] = useState(defaultCurrentCity);
  const [currentCityId, setCurrentCityId] = useState(defaultCurrentCityId);
  const [targetCity, setTargetCity] = useState(defaultTargetCity);
  const [targetCityId, setTargetCityId] = useState(defaultTargetCityId);
  const [targetType, setTargetType] = useState<"specific_city" | "already_live" | "not_sure" | "">(
    (defaultTargetType as "specific_city" | "already_live" | "not_sure") ?? ""
  );

  const targetOptions = useMemo(() => {
    type Opt = {
      value: "specific_city" | "already_live" | "not_sure";
      label: string;
      image: string;
      sublabel?: string;
    };
    const opts: Opt[] = [
      {
        value: "already_live",
        label: t("Expats.funnel.step2.option.alreadyLive"),
        image: "/images/onboarding/assests/image%202322%20(1).png",
      },
      {
        value: "specific_city",
        label: t("Expats.funnel.step2.option.specificCity"),
        image: "/images/onboarding/assests/image%202333.png",
      },
      {
        value: "not_sure",
        label: t("Expats.funnel.step2.option.notSure"),
        sublabel: t("Expats.funnel.step2.option.notSureSub"),
        image: "/images/onboarding/assests/image%202325%20(1).png",
      },
    ];
    return opts;
  }, [t]);

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
    const data: Parameters<typeof onChange>[0] = {
      currentCityName: cc || undefined,
      currentCityId: ccId || undefined,
      targetType: tt,
    };
    // Solo inviare targetCityName/Id se hanno un valore — evita di sovrascrivere con undefined
    if (tc) data.targetCityName = tc;
    if (tt === "specific_city" && tcId) data.targetCityId = tcId;
    onChange(data);
  };

  const selectTargetType = (val: "specific_city" | "already_live" | "not_sure") => {
    setTargetType(val);
    // Non resettare target city quando si seleziona il tipo — l'utente potrebbe averla gia inserita
    emit(currentCity, currentCityId, targetCity, val === "specific_city" ? targetCityId : "", val);
  };

  const titleLines = t("Expats.funnel.step2.title").split("\n");

  return (
    <div className="funnel-step">
      <h1 className="funnel-step__title">
        {titleLines.map((line, i) => (
          <Fragment key={i}>
            {i > 0 ? <br /> : null}
            {line}
          </Fragment>
        ))}
      </h1>
      <p className="funnel-step__sub">{t("Expats.funnel.step2.subtitle")}</p>

      <div className={styles.cityOriginCard}>
        <img
          src="/images/onboarding/assests/image%202334.png"
          alt={t("Expats.funnel.step2.cityIllustrationAlt")}
          className={styles.cityOriginCardImg}
        />
        <CityCatalogCombo
          label={t("Expats.funnel.step2.currentLabel")}
          value={currentCity}
          cityId={currentCityId}
          cities={cities}
          placeholder={t("Expats.funnel.step2.currentPlaceholder")}
          hintMatched={t("Expats.funnel.step2.hint.catalogMatch")}
          hintPick={t("Expats.funnel.step2.hint.typeOrPick")}
          onPick={(name, id) => {
            setCurrentCity(name);
            setCurrentCityId(id ?? "");
            emit(name, id ?? "", targetCity, targetCityId);
          }}
        />
      </div>

      <div className={styles.cityDestGrid}>
        {targetOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => selectTargetType(opt.value)}
            className={`${styles.cityDestCard} ${targetType === opt.value ? styles.cityDestCardSelected : ""}`}
          >
            <div className={styles.cityDestCardVisual}>
              <img src={opt.image} alt="" className={styles.cityDestCardImg} />
            </div>
            {opt.value === "specific_city" && targetType === "specific_city" && (
              <div
                className={styles.cityDestCardInputRow}
                style={{ flexDirection: "column", alignItems: "stretch" }}
              >
                <CityCatalogCombo
                  label={t("Expats.funnel.step2.destinationLabel")}
                  value={targetCity}
                  cityId={targetCityId}
                  cities={cities}
                  placeholder={t("Expats.funnel.step2.destinationPlaceholder")}
                  hintMatched={t("Expats.funnel.step2.hint.catalogMatch")}
                  hintPick={t("Expats.funnel.step2.hint.typeOrPick")}
                  onPick={(name, id) => {
                    setTargetCity(name);
                    setTargetCityId(id ?? "");
                    emit(currentCity, currentCityId, name, id ?? "");
                  }}
                />
              </div>
            )}
            <span className={styles.cityDestCardLabel}>{opt.label}</span>
            {opt.sublabel ? <span className={styles.cityDestCardSublabel}>{opt.sublabel}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
