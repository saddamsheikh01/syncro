"use client";

interface Props {
  emoji?: string;
  image?: string;
  label: string;
  sublabel?: string;
  selected: boolean;
  bg?: string;
  onClick: () => void;
  wide?: boolean;
}

export default function FunnelOptionCard({
  emoji,
  image,
  label,
  sublabel,
  selected,
  bg = "#f8fafd",
  onClick,
  wide = false,
}: Props) {
  return (
    <button
      onClick={onClick}
      className={`funnel-opt-card ${selected ? "funnel-opt-card--selected" : ""} ${wide ? "funnel-opt-card--wide" : ""}`}
    >
      {(emoji || image) && (
        <div className="funnel-opt-card__visual">
          {image ? (
            <img
              src={image}
              alt={label}
              className="funnel-opt-card__image"
            />
          ) : (
            <div className="funnel-opt-card__emoji-bg" style={{ background: bg }}>
              <span className="funnel-opt-card__emoji">{emoji}</span>
            </div>
          )}
        </div>
      )}
      <span className="funnel-opt-card__label">{label}</span>
      {sublabel && <span className="funnel-opt-card__sublabel">{sublabel}</span>}
      <style>{`
        .funnel-opt-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px 16px 20px;
          background: #fff;
          border: 2px solid #e4e9f2;
          border-radius: 16px;
          cursor: pointer;
          width: 100%;
          min-height: 240px;
          text-align: center;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
          position: relative;
        }
        .funnel-opt-card:hover {
          border-color: #3b6bdc;
          box-shadow: 0 4px 20px rgba(59, 107, 220, 0.12);
          transform: translateY(-2px);
        }
        .funnel-opt-card--selected {
          border-color: #3b6bdc;
          box-shadow: 0 4px 20px rgba(59, 107, 220, 0.18);
        }
        .funnel-opt-card--wide {
          min-height: 80px;
          flex-direction: row;
          justify-content: flex-start;
          padding: 16px 24px;
          gap: 16px;
        }
        .funnel-opt-card__visual {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 130px;
        }
        .funnel-opt-card--wide .funnel-opt-card__visual {
          flex: unset;
          width: 52px;
          min-height: unset;
          height: 52px;
        }
        .funnel-opt-card__image {
          max-width: 140px;
          max-height: 140px;
          width: auto;
          height: auto;
          object-fit: contain;
        }
        .funnel-opt-card__emoji-bg {
          width: 100px;
          height: 100px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .funnel-opt-card__emoji {
          font-size: 3rem;
          line-height: 1;
        }
        .funnel-opt-card--wide .funnel-opt-card__emoji-bg {
          width: 48px;
          height: 48px;
        }
        .funnel-opt-card--wide .funnel-opt-card__emoji {
          font-size: 1.8rem;
        }
        .funnel-opt-card__label {
          font-size: 0.95rem;
          font-weight: 600;
          color: #0d1b36;
          line-height: 1.3;
        }
        .funnel-opt-card__sublabel {
          font-size: 0.8rem;
          color: #6c778a;
        }

        @media (max-width: 600px) {
          .funnel-opt-card {
            min-height: 170px;
            padding: 18px 12px 16px;
          }
          .funnel-opt-card__image {
            max-width: 100px;
            max-height: 100px;
          }
          .funnel-opt-card__visual {
            min-height: 100px;
          }
        }
        @media (max-width: 400px) {
          .funnel-opt-card {
            min-height: 140px;
            padding: 14px 10px 12px;
          }
          .funnel-opt-card__image {
            max-width: 80px;
            max-height: 80px;
          }
          .funnel-opt-card__emoji-bg {
            width: 72px;
            height: 72px;
          }
          .funnel-opt-card__emoji {
            font-size: 2.2rem;
          }
          .funnel-opt-card__visual {
            min-height: 80px;
          }
        }
      `}</style>
    </button>
  );
}
