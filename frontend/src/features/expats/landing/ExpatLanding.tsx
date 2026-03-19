"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/hooks";
import { useExpats } from "../../../hooks/expats/useExpats";
import { getFunnelConfig } from "../../../services/expats";

const FEATURES = [
  { icon: "/images/landing/icon-profile.svg", titleKey: "Expats.landing.feature.guidedMatch", descKey: "Expats.landing.feature.guidedMatchDesc", bullets: null },
  { icon: "/images/landing/icon-location.svg", titleKey: "Expats.landing.feature.cityFit", descKey: "Expats.landing.feature.cityFitDesc", bullets: null },
  { icon: "/images/landing/icon-timetable.svg", titleKey: "Expats.landing.feature.roadmap", descKey: "Expats.landing.feature.roadmapDesc", bullets: null },
  { icon: "/images/landing/icon-seo.svg", titleKey: "Expats.landing.feature.housing", descKey: "Expats.landing.feature.housingDesc", bullets: null },
  { icon: "/images/landing/icon-teamwork.svg", titleKey: "Expats.landing.feature.community", descKey: "Expats.landing.feature.communityDesc", bullets: null },
  { icon: "/images/landing/icon-teamwork2.svg", titleKey: "Expats.landing.feature.experts", descKey: "Expats.landing.feature.expertsDesc", bullets: null },
  { icon: "/images/landing/icon-cityscore.png", titleKey: "Expats.landing.feature.cityScore", descKey: null, bullets: ["Expats.landing.feature.costOfLiving", "Expats.landing.feature.work", "Expats.landing.feature.social"] },
  { icon: "/images/landing/icon-forecast.png", titleKey: "Expats.landing.feature.forecast", descKey: null, bullets: ["Expats.landing.feature.monthlyCost", "Expats.landing.feature.socialDiff", "Expats.landing.feature.workImpact"] },
];

const NOISE_SOURCES = [
  { icon: "/images/landing/icon-house.svg", labelKey: "Expats.landing.noise.housingBlogs" },
  { icon: "/images/landing/icon-house.svg", labelKey: "Expats.landing.noise.housingBlogs" },
  { icon: "/images/landing/icon-facebook.svg", labelKey: "Expats.landing.noise.facebook" },
  { icon: "/images/landing/icon-tiktok.svg", labelKey: "Expats.landing.noise.tiktok" },
  { icon: "/images/landing/icon-whatsapp.svg", labelKey: "Expats.landing.noise.whatsapp" },
];

export default function ExpatLanding() {
  const router = useRouter();
  const { t } = useT();
  const { initSession, isLoading } = useExpats();
  const initialized = useRef(false);
  const [funnelConfig, setFunnelConfig] = useState<{
    featureFlags?: { show_budget_step?: boolean; enable_free_notes?: boolean };
    content?: { cta_text?: string };
  } | null>(null);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      getFunnelConfig("expats_landing_v1", "en")
        .then((config) => setFunnelConfig(config as typeof funnelConfig))
        .catch(() => null);
      initSession().catch(() => null);
    }
  }, [initSession]);

  const ctaLabel = funnelConfig?.content?.cta_text ?? t("Expats.landing.hero.cta");

  const handleStart = () => {
    router.push("/expats/funnel/1");
  };

  return (
    <div className="expat-landing">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="expat-hero">
        <img
          src="/images/landing/hero-bg.jpg"
          alt=""
          className="expat-hero__bg-img"
          loading="eager"
        />
        <div className="expat-hero__gradient" />

        <div className="expat-hero__lang">
          <img
            src="/images/landing/flag-it.png"
            alt="Language"
            className="expat-hero__flag-img"
          />
          <svg
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            className="expat-hero__chevron"
          >
            <path
              d="M1 1.5L6 6.5L11 1.5"
              stroke="#333"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="expat-hero__content">
          <h1 className="expat-hero__headline">
            {t("Expats.landing.hero.title").split("\n").map((line, i) => (
              <span key={i}>{line}{i === 0 ? <br /> : null}</span>
            ))}
          </h1>
          <p className="expat-hero__sub">
            {t("Expats.landing.hero.sub")}
          </p>
          <ul className="expat-hero__bullets">
            <li>
              <img
                src="/images/landing/bullet-dot.svg"
                alt=""
                className="expat-bullet-dot"
              />
              {t("Expats.landing.hero.bullet1")}
            </li>
            <li>
              <img
                src="/images/landing/bullet-dot.svg"
                alt=""
                className="expat-bullet-dot"
              />
              {t("Expats.landing.hero.bullet2")}
            </li>
            <li>
              <img
                src="/images/landing/bullet-dot.svg"
                alt=""
                className="expat-bullet-dot"
              />
              {t("Expats.landing.hero.bullet3")}
            </li>
          </ul>
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="expat-cta-btn expat-cta-btn--orange"
          >
            {isLoading ? t("Expats.landing.hero.settingUp") : ctaLabel}
          </button>
          <p className="expat-hero__disclaimer">
            {t("Expats.landing.hero.disclaimer")}
          </p>
        </div>
      </section>

      {/* ── Pain Section ────────────────────────────────── */}
      <section className="expat-pain">
        <h2 className="expat-pain__title">
          {t("Expats.landing.pain.title")}
        </h2>
        <p className="expat-pain__sub">
          <span className="expat-pain__sub-muted">
            {t("Expats.landing.pain.muted")}
          </span>{" "}
          <strong className="expat-pain__sub-bold">{t("Expats.landing.pain.bold")}</strong>
        </p>
        <div className="expat-noise-grid">
          {NOISE_SOURCES.map((s, i) => (
            <div key={`${s.labelKey}-${i}`} className="expat-noise-card">
              <img src={s.icon} alt="" className="expat-noise-card__icon" />
              <span className="expat-noise-card__label">{t(s.labelKey)}</span>
            </div>
          ))}
        </div>
        <p className="expat-pain__tagline">
          {t("Expats.landing.pain.tagline")}
        </p>
      </section>

      {/* ── Solution Banner ─────────────────────────────── */}
      <section className="expat-solution">
        <img
          src="/images/landing/cityscape.jpg"
          alt=""
          className="expat-solution__bg"
          loading="lazy"
        />
        <div className="expat-solution__overlay" />
        <div className="expat-solution__content">
          <div className="expat-solution__text">
            <h2 className="expat-solution__headline">{t("Expats.landing.solution.headline")}</h2>
            <p className="expat-solution__tagline">
              {t("Expats.landing.solution.tagline")}
            </p>
            <p className="expat-solution__desc">
              {t("Expats.landing.solution.desc")}
            </p>
            <button
              onClick={handleStart}
              className="expat-cta-btn expat-cta-btn--white"
            >
              {t("Expats.landing.solution.cta")}
            </button>
          </div>
          <div className="expat-solution__img-wrap">
            <img
              src="/images/landing/cityscape-small.jpg"
              alt="City view"
              className="expat-solution__img"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* ── Features Grid ──────────────────────────────── */}
      <section className="expat-features">
        <h2 className="expat-features__title">
          {t("Expats.landing.features.title")}
        </h2>
        <p className="expat-features__sub">
          {t("Expats.landing.features.sub")}
        </p>
        <div className="expat-features__grid">
          {FEATURES.map((f) => (
            <div key={f.titleKey} className="expat-feature-card">
              <img
                src={f.icon}
                alt=""
                className="expat-feature-card__icon"
                loading="lazy"
              />
              <div className="expat-feature-card__body">
                <h3 className="expat-feature-card__title">{t(f.titleKey)}</h3>
                {f.descKey && (
                  <p className="expat-feature-card__desc">{t(f.descKey)}</p>
                )}
                {f.bullets && (
                  <ul className="expat-feature-card__bullets">
                    {f.bullets.map((key) => (
                      <li key={key}>✔ {t(key)}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="expat-features__cta-wrap">
          <button
            onClick={handleStart}
            className="expat-cta-btn expat-cta-btn--teal"
          >
            {t("Expats.landing.features.cta")}
          </button>
        </div>
      </section>

      <style>{`
        /* ─── Base ────────────────────────────────────── */
        .expat-landing {
          font-family: 'Inter', var(--font-geist-sans, system-ui, sans-serif);
          color: #222745;
          background: #fbf7fe;
          overflow-x: hidden;
        }

        /* ─── Hero ────────────────────────────────────── */
        .expat-hero {
          position: relative;
          height: clamp(600px, 66vw, 960px);
          overflow: hidden;
        }
        .expat-hero__bg-img {
          position: absolute;
          top: 0;
          right: 0;
          width: 88%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
        }
        .expat-hero__gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to right,
            #072857 12%,
            rgba(7, 40, 87, 0.85) 40%,
            rgba(7, 40, 87, 0) 75%
          );
          z-index: 1;
        }
        .expat-hero__lang {
          position: absolute;
          top: 20px;
          right: 13px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          border-radius: 10px;
          padding: 10px 20px;
          box-shadow: -5px 7px 9.9px 0px #eeebf4;
        }
        .expat-hero__flag-img {
          width: 43px;
          height: 30px;
          object-fit: cover;
          border-radius: 2px;
        }
        .expat-hero__chevron {
          opacity: 0.6;
        }
        .expat-hero__content {
          position: relative;
          z-index: 2;
          padding: 100px 100px 60px;
          max-width: 972px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          height: 100%;
        }
        .expat-hero__headline {
          font-size: 55px;
          font-weight: 700;
          line-height: 65px;
          letter-spacing: -2.2px;
          color: #fff;
          margin: 0 0 18px;
          text-transform: capitalize;
          max-width: 972px;
        }
        .expat-hero__sub {
          font-size: 20px;
          font-weight: 400;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 24px;
          max-width: 650px;
          text-transform: capitalize;
        }
        .expat-hero__bullets {
          list-style: none;
          padding: 0;
          margin: 0 0 36px;
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .expat-hero__bullets li {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 20px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.8);
          text-transform: capitalize;
        }
        .expat-bullet-dot {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }
        .expat-hero__disclaimer {
          font-size: 21px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.8);
          margin-top: 18px;
          text-transform: capitalize;
        }

        /* ─── CTA Buttons ────────────────────────────── */
        .expat-cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 60px;
          padding: 10px 40px;
          border-radius: 10px;
          border: none;
          font-size: 24px;
          font-weight: 500;
          cursor: pointer;
          text-transform: capitalize;
          transition: transform 0.15s, box-shadow 0.2s;
          white-space: nowrap;
        }
        .expat-cta-btn:hover {
          transform: translateY(-2px);
        }
        .expat-cta-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        .expat-cta-btn--orange {
          background: linear-gradient(to top, #cc651a, #ff883d);
          color: #fff;
          min-width: 396px;
          box-shadow: 0 8px 24px rgba(204, 101, 26, 0.3);
        }
        .expat-cta-btn--orange:hover {
          box-shadow: 0 12px 32px rgba(204, 101, 26, 0.4);
        }
        .expat-cta-btn--white {
          background: #fff;
          color: #072957;
          min-width: 396px;
        }
        .expat-cta-btn--white:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
        .expat-cta-btn--teal {
          background: #c9f3ef;
          color: #072957;
          min-width: 396px;
        }
        .expat-cta-btn--teal:hover {
          box-shadow: 0 8px 24px rgba(201, 243, 239, 0.5);
        }

        /* ─── Pain ────────────────────────────────────── */
        .expat-pain {
          padding: 60px 48px 50px;
          text-align: center;
          background: #fbf7fe;
        }
        .expat-pain__title {
          font-size: 50px;
          font-weight: 600;
          color: #222745;
          letter-spacing: -2px;
          margin: 0 0 12px;
          text-transform: capitalize;
        }
        .expat-pain__sub {
          font-size: 22px;
          margin: 0 0 36px;
        }
        .expat-pain__sub-muted {
          font-weight: 400;
          color: #666;
        }
        .expat-pain__sub-bold {
          font-weight: 600;
          color: #404363;
        }
        .expat-noise-grid {
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 32px;
        }
        .expat-noise-card {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fff;
          border-radius: 10px;
          padding: 16px 24px;
          box-shadow: -5px 7px 9.9px 0px #eeebf4;
          min-width: 180px;
        }
        .expat-noise-card__icon {
          width: 22px;
          height: 22px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .expat-noise-card__label {
          font-size: 20px;
          font-weight: 600;
          color: #3f3e5b;
          text-transform: capitalize;
        }
        .expat-pain__tagline {
          font-size: 30px;
          font-weight: 600;
          color: #222745;
          letter-spacing: -1.2px;
          text-transform: capitalize;
        }

        /* ─── Solution ────────────────────────────────── */
        .expat-solution {
          position: relative;
          overflow: hidden;
        }
        .expat-solution__bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }
        .expat-solution__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to right,
            rgba(0, 0, 0, 0.9),
            rgba(0, 0, 0, 0)
          );
          z-index: 1;
        }
        .expat-solution__content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          max-width: 1440px;
          margin: 0 auto;
          padding: 56px 100px;
          gap: 40px;
        }
        .expat-solution__text {
          flex: 1;
        }
        .expat-solution__headline {
          font-size: 50px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 4px;
          text-transform: capitalize;
          line-height: 1.43;
        }
        .expat-solution__tagline {
          font-size: 30px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 20px;
          text-transform: capitalize;
        }
        .expat-solution__desc {
          font-size: 20px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.5;
          margin: 0 0 32px;
          max-width: 557px;
          text-transform: capitalize;
        }
        .expat-solution__img-wrap {
          flex-shrink: 0;
          width: 298px;
          height: 184px;
          border-radius: 12px;
          overflow: hidden;
        }
        .expat-solution__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* ─── Features ────────────────────────────────── */
        .expat-features {
          padding: 60px 100px 50px;
          text-align: center;
          background: #fbf7fe;
        }
        .expat-features__title {
          font-size: 50px;
          font-weight: 600;
          color: #222745;
          letter-spacing: -2px;
          margin: 0 0 8px;
          text-transform: capitalize;
        }
        .expat-features__sub {
          font-size: 22px;
          font-weight: 500;
          color: #3f3e5b;
          margin: 0 0 40px;
          text-transform: capitalize;
        }
        .expat-features__grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          max-width: 1240px;
          margin: 0 auto;
          text-align: left;
        }
        .expat-feature-card {
          background: #fff;
          border-radius: 20px;
          padding: 28px 28px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: -5px 17px 29.9px 0px #eeebf4;
          min-height: 147px;
        }
        .expat-feature-card__icon {
          width: 74px;
          height: 74px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .expat-feature-card__body {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .expat-feature-card__title {
          font-size: 30px;
          font-weight: 700;
          color: #3f3e5b;
          letter-spacing: -1.2px;
          margin: 0;
          text-transform: capitalize;
        }
        .expat-feature-card__desc {
          font-size: 22px;
          font-weight: 500;
          color: #666;
          margin: 0;
          line-height: 1.4;
          text-transform: capitalize;
        }
        .expat-feature-card__bullets {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 22px;
          font-weight: 500;
          color: #666;
          text-transform: capitalize;
        }
        .expat-features__cta-wrap {
          margin-top: 40px;
        }

        /* ─── Responsive ─────────────────────────────── */
        @media (max-width: 1200px) {
          .expat-hero__content {
            padding: 60px 60px 40px;
          }
          .expat-hero__headline {
            font-size: 46px;
            line-height: 56px;
          }
          .expat-pain__title,
          .expat-features__title {
            font-size: 38px;
          }
          .expat-solution__headline {
            font-size: 38px;
          }
          .expat-solution__content {
            padding: 48px 60px;
          }
          .expat-features {
            padding: 60px 60px 50px;
          }
          .expat-feature-card__title {
            font-size: 24px;
          }
          .expat-feature-card__desc,
          .expat-feature-card__bullets {
            font-size: 18px;
          }
        }

        @media (max-width: 900px) {
          .expat-features__grid {
            grid-template-columns: 1fr;
          }
          .expat-solution__img-wrap {
            display: none;
          }
          .expat-cta-btn {
            min-width: auto !important;
            width: 100%;
            max-width: 396px;
            font-size: 20px;
          }
        }

        @media (max-width: 768px) {
          .expat-hero {
            height: auto;
            min-height: 520px;
          }
          .expat-hero__bg-img {
            width: 100%;
            opacity: 0.3;
          }
          .expat-hero__gradient {
            background: linear-gradient(
              to bottom,
              #072857 10%,
              rgba(7, 40, 87, 0.92) 50%,
              rgba(7, 40, 87, 0.7) 100%
            );
          }
          .expat-hero__content {
            padding: 60px 24px 40px;
            max-width: 100%;
            height: auto;
          }
          .expat-hero__headline {
            font-size: 32px;
            line-height: 40px;
            letter-spacing: -1.5px;
          }
          .expat-hero__sub {
            font-size: 16px;
          }
          .expat-hero__bullets li {
            font-size: 15px;
          }
          .expat-hero__disclaimer {
            font-size: 15px;
          }
          .expat-hero__lang {
            top: 16px;
            right: 16px;
            padding: 8px 14px;
          }
          .expat-hero__flag-img {
            width: 32px;
            height: 22px;
          }

          .expat-pain {
            padding: 40px 24px;
          }
          .expat-pain__title {
            font-size: 26px;
            letter-spacing: -1px;
          }
          .expat-pain__sub {
            font-size: 16px;
          }
          .expat-noise-grid {
            gap: 10px;
          }
          .expat-noise-card {
            padding: 12px 16px;
            min-width: auto;
          }
          .expat-noise-card__label {
            font-size: 14px;
          }
          .expat-pain__tagline {
            font-size: 20px;
          }

          .expat-solution__content {
            flex-direction: column;
            padding: 40px 24px;
          }
          .expat-solution__headline {
            font-size: 30px;
          }
          .expat-solution__tagline {
            font-size: 22px;
          }
          .expat-solution__desc {
            font-size: 16px;
          }

          .expat-features {
            padding: 40px 24px;
          }
          .expat-features__title {
            font-size: 26px;
            letter-spacing: -1px;
          }
          .expat-features__sub {
            font-size: 16px;
          }
          .expat-feature-card {
            padding: 20px;
            gap: 16px;
          }
          .expat-feature-card__icon {
            width: 56px;
            height: 56px;
          }
          .expat-feature-card__title {
            font-size: 20px;
          }
          .expat-feature-card__desc,
          .expat-feature-card__bullets {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}
