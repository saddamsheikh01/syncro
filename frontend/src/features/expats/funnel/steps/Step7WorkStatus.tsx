"use client";

import { useState } from "react";
import FunnelOptionCard from "../elements/FunnelOptionCard";
import type { WorkStatus } from "../../../../types/expats";

const WORK_OPTS: { value: WorkStatus; label: string; image: string; bg: string }[] = [
  { value: "employed", label: "Employee", image: "/images/onboarding/assests/image%202325%20(4).png", bg: "#E8F4FF" },
  { value: "freelancer", label: "Freelancer", image: "/images/onboarding/assests/image%202322%20(3).png", bg: "#F0F8FF" },
  { value: "entrepreneur", label: "Entrepreneur", image: "/images/onboarding/assests/image%202326.png", bg: "#FFF8F0" },
  { value: "student", label: "Student", image: "/images/onboarding/assests/image%202323.png", bg: "#F8F0FF" },
  { value: "not_working", label: "Not Working Yet", image: "/images/onboarding/assests/image%202324.png", bg: "#F8F8F8" },
];

const STRUCTURE_OPTS: { value: "full_time" | "part_time" | "contractor"; label: string }[] = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contractor", label: "Contractor" },
];

interface Props {
  defaultWorkStatus?: WorkStatus;
  defaultWorkStructure?: "full_time" | "part_time" | "contractor";
  defaultIsRemote?: boolean;
  onChange: (data: { workStatus?: WorkStatus; workStructure?: "full_time" | "part_time" | "contractor"; isRemote?: boolean }) => void;
}

export default function Step7WorkStatus({
  defaultWorkStatus,
  defaultWorkStructure = "full_time",
  defaultIsRemote = false,
  onChange,
}: Props) {
  const [workStatus, setWorkStatus] = useState<WorkStatus | "">(defaultWorkStatus ?? "");
  const [workStructure, setWorkStructure] = useState<"full_time" | "part_time" | "contractor">(defaultWorkStructure ?? "full_time");
  const [isRemote, setIsRemote] = useState(defaultIsRemote);

  const emit = (ws = workStatus, wst = workStructure, ir = isRemote) => {
    onChange({ workStatus: ws as WorkStatus || undefined, workStructure: wst, isRemote: ir });
  };

  return (
    <div className="funnel-step">
      <h1 className="funnel-step__title">How Do You Currently Work?</h1>
      <p className="funnel-step__sub">This Helps Us Calculate Budget Sustainability And City Compatibility.</p>

      <div className="work-form">
        <label className="work-field-label">Sector / Profession</label>
        <div className="work-input-wrap">
          <span>💼</span>
          <input type="text" placeholder="Sector / Profession" className="work-input" />
        </div>
      </div>

      <div className="work-cards-section">
        <p className="work-field-label">Employment Type:</p>
        <div className="funnel-cards-row funnel-cards-row--5">
          {WORK_OPTS.map((opt) => (
            <FunnelOptionCard
              key={opt.value}
              image={opt.image}
              label={opt.label}
              selected={workStatus === opt.value}
              bg={opt.bg}
              onClick={() => { setWorkStatus(opt.value); emit(opt.value); }}
            />
          ))}
        </div>
      </div>

      <div className="work-form">
        <div className="work-structure-row">
          <span className="work-field-label" style={{ marginBottom: 0 }}>Work Structure:</span>
          {STRUCTURE_OPTS.map((opt) => (
            <label key={opt.value} className="radio-label">
              <input
                type="radio"
                name="workStructure"
                value={opt.value}
                checked={workStructure === opt.value}
                onChange={() => { setWorkStructure(opt.value); emit(workStatus, opt.value); }}
                className="radio-input"
              />
              <span className={`radio-dot ${workStructure === opt.value ? "radio-dot--on" : ""}`} />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="work-remote-row">
        <span style={{ fontSize: '1.4rem' }}>👤</span>
        <span className="work-remote-row__label">I Work Remotely</span>
        <button
          onClick={() => { const next = !isRemote; setIsRemote(next); emit(workStatus, workStructure, next); }}
          className={`toggle ${isRemote ? "toggle--on" : ""}`}
          aria-label="I work remotely"
        >
          <div className="toggle__thumb" />
        </button>
      </div>

      <style>{`
        .work-form {
          width: 100%;
          max-width: 680px;
          margin-bottom: 24px;
        }
        .work-cards-section {
          width: 100%;
          max-width: 900px;
          margin-bottom: 28px;
        }
        .work-field-label {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0d1b36;
          margin-bottom: 12px;
          display: block;
          text-align: center;
        }
        .work-input-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1.5px solid #d5ddea;
          border-radius: 12px;
          padding: 14px 18px;
          background: #fff;
        }
        .work-input {
          border: none;
          outline: none;
          font-size: 0.95rem;
          color: #1a2433;
          width: 100%;
          font-family: inherit;
        }
        .work-structure-row {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
          border: 1.5px solid #e4e9f2;
          border-radius: 12px;
          padding: 14px 20px;
          background: #fff;
        }
        .radio-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          color: #1a2433;
        }
        .radio-input { display: none; }
        .radio-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid #3b6bdc;
          display: inline-block;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .radio-dot--on { background: #3b6bdc; }
        .work-remote-row {
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1.5px solid #e4e9f2;
          border-radius: 12px;
          padding: 14px 20px;
          background: #fff;
          max-width: 680px;
          width: 100%;
        }
        .work-remote-row__label {
          font-size: 0.95rem;
          font-weight: 600;
          color: #1a2433;
          flex: 1;
        }
        .toggle {
          width: 48px;
          height: 26px;
          border-radius: 50px;
          background: #d5ddea;
          border: none;
          cursor: pointer;
          position: relative;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .toggle--on { background: #3b6bdc; }
        .toggle__thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          transition: transform 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        .toggle--on .toggle__thumb { transform: translateX(22px); }
      `}</style>
    </div>
  );
}
