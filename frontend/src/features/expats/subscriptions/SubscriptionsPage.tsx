"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    id: "free",
    name: "FREE",
    price: "0€",
    priceSub: "Discover The City, People And Opportunities That Fit You",
    color: "#6c778a",
    bg: "#f8fafd",
    border: "#e4e9f2",
    ctaLabel: "Start With Free Access",
    ctaClass: "sub-btn sub-btn--outline",
    sections: [
      {
        title: "Starter Expats Kit",
        items: ["Work Opportunities", "Housing Affordability", "Social Integration", "Initial Stress Level", "Relocation Risk Level", "Personalized Relocation Snapshot"],
      },
      {
        title: "Free Budget Simulator",
        items: ["Estimated Monthly Cost", "Remaining Budget Margin", "Financial Risk Indicator"],
      },
      {
        title: "Mentor Preview",
        items: ["Chat / Video Call With Local Mentor - 15 Min Free", "Integrated Real-Time Translation"],
      },
      {
        title: "Free Lounge",
        items: ["Expat Community", "Guided Discussion Threads", "Automatic Translation", "Zyra AI Moderation"],
      },
      {
        title: "Roadmap Preview",
        items: ["Pre-Arrival Phase", "Integration Phase"],
      },
      {
        title: "Verified Professionals",
        items: ["Browse Verified Professionals", "View Languages, Specialization And Price Range", "Send 1 Written Question Per Category"],
      },
    ],
  },
  {
    id: "premium",
    name: "PREMIUM",
    price: "39€",
    priceSub: "/MONTH",
    priceMeta: "Plan Your Next Step Abroad With Data Driven Guidance.",
    color: "#fff",
    bg: "#3b6bdc",
    border: "#3b6bdc",
    highlight: true,
    ctaLabel: "Unlock Premium Features",
    ctaClass: "sub-btn sub-btn--white",
    annualNote: "Annual Plan – 20% Off",
    sections: [
      {
        title: "Premium Expats Kit",
        items: ["Work Opportunities", "Housing Affordability", "Social Integration", "Initial Stress Level", "Personalized Relocation Snapshot", "Common Relocation Mistake For Your Profile", "Burnout Risk Index", "Scam Alert System", "Minimum Realistic Budget"],
      },
      {
        title: "Budget Simulator Premium",
        items: ["Estimated Monthly Cost", "Remaining Budget Margin", "Financial Risk Indicator", "Rental Deposit Estimate", "Agency Fees", "Utilities Estimate", "Coworking Costs", "School Costs (If Applicable)", "Lifestyle Expenses"],
      },
      {
        title: "Mentor Premium",
        items: ["Chat / Video Call With Local Mentor - 30 Min Per Month", "Integrated Real-Time Translation"],
      },
      {
        title: "Targeted Lounge",
        items: ["Automatically Matched Expat Groups", "Members With Compatible Profiles", "Premium Member Visibility", "Zyra AI Weekly Summaries & Highlights"],
      },
      {
        title: "Roadmap Premium",
        items: ["Pre-Arrival Phase", "Arrival Phase", "Integration Phase", "Personalized Relocation Tasks", "Smart Reminders And Priorities", "Document And Housing Checklist", "Automatic Roadmap Updates"],
      },
      {
        title: "Verified Professionals",
        items: ["Browse Verified Professionals", "View Languages, Specialization And Price Range", "Chat With Professionals (Up To 20 Messages)", "1 Consultation Call Included Every 3 Months", "20% Discount On Consultations"],
      },
      {
        title: "Quarterly Event",
        items: ["Premium Expat Masterclass"],
      },
      {
        title: "Visibility Boost",
        items: ["Higher Visibility In Compatible Matches", "Premium Member Badge"],
      },
      {
        title: "Priority Support",
        items: ["Faster Responses To Your Requests", "Dedicated Support Queue", "Human Escalation If Zyra Cannot Resolve"],
      },
    ],
  },
  {
    id: "super_pro",
    name: "SUPER PRO",
    price: "79€",
    priceSub: "/MONTH",
    priceMeta: "Optimize Your Life Abroad With Data, Strategy, Mentors And Resources.",
    color: "#0d1b36",
    bg: "#fff",
    border: "#d5ddea",
    ctaLabel: "Unlock The Full System",
    ctaClass: "sub-btn sub-btn--dark",
    annualNote: "Annual Plan – 20% Off",
    sections: [
      {
        title: "Super Pro Expats Kit",
        items: ["Work Opportunities", "Housing Affordability", "Social Integration", "Initial Stress Level", "Personalized Relocation Snapshot", "Common Relocation Mistake For Your Profile", "Burnout Risk Index", "Scam Alert System", "Minimum Realistic Budget", "Real Neighborhood Insights", "Local Cultural Codes", "Smart Relocation Alerts"],
      },
      {
        title: "Budget Simulator Super Pro",
        items: ["Estimated Monthly Cost", "Remaining Budget Margin", "Financial Risk Indicator", "Rental Deposit Estimate", "Agency Fees", "Utilities Estimate", "Coworking Costs", "School Costs (If Applicable)", "Lifestyle Expenses", "6-Month Scenario Simulation", "12 Month Scenario Simulation", "If Rental Prices Increase", "If You Find A Local Job", "If You Move To Another Neighborhood"],
      },
      {
        title: "Unlimited Mentor Access (Per Use)",
        items: ["Chat / Video Call With Local Mentor", "Integrated Real-Time Translation"],
      },
      {
        title: "High-Compatibility Lounges",
        items: ["Members With 75%+ Profile Compatibility", "Same Relocation Stage And Lifestyle", "Direct 1:1 Connections Inside The Group", "Community Progress Tracker", "Zyra AI Weekly Insights And Summaries"],
      },
      {
        title: "Roadmap Super Pro",
        items: ["Pre-Arrival Phase", "Dedicated Integration Phase", "Personalized Relocation Tasks", "Smart Reminders And Alerts", "Document And Housing Checklist", "Automatic Roadmap Updates", "Scenario Simulation", "Central Neighborhood – Semi-Central – Peripheral", "AI Suggests The Best Scenario"],
      },
      {
        title: "Verified Professionals",
        items: ["Browse Verified Professionals", "View Languages, Specialization And Price Range", "Chat With Professionals (Up To 20 Messages)", "1 Consultation Call Included Every 3 Months", "20% Discount On Consultations", "Priority Access To Top Professionals"],
      },
      {
        title: "Exclusive Expat Events",
        items: ["Bi-Monthly Events", "Expert Masterclasses", "Post-Event Q&A Links And Resources"],
      },
      {
        title: "Priority Visibility Boost",
        items: ["Priority Visibility In Compatible Matches", "Featured In 'Top Compatible This Week'"],
      },
      {
        title: "Priority Support",
        items: ["Faster Responses To Your Requests", "Dedicated Support Queue", "Human Escalation If Zyra Cannot Resolve"],
      },
      {
        title: "Budget Tracking",
        items: ["Track Real Vs Planned Expenses", "Threshold And Deviation Alerts"],
      },
      {
        title: "Early Access",
        items: ["New Cities", "New Features", "New Professionals"],
      },
    ],
  },
];

export default function SubscriptionsPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const router = useRouter();

  return (
    <div className="subs-shell">
      {/* Header */}
      <div className="subs-header">
        <div className="wow-logo" style={{ justifyContent: "center", marginBottom: 6 }}>
          <span style={{ fontSize: '1.8rem', color: '#3b6bdc' }}>∞</span>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>EXPATS MODE</span>
        </div>
        <h1 className="subs-title">Choose The Plan That Supports Your Next Move</h1>
        <p className="subs-subtitle">Based On Your Profile, This Is The Safest Premium Activates</p>
        <div className="subs-billing-toggle">
          <button
            onClick={() => setBilling("monthly")}
            className={`billing-btn ${billing === "monthly" ? "billing-btn--active" : ""}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`billing-btn ${billing === "annual" ? "billing-btn--active" : ""}`}
          >
            Annual <span className="billing-save">–20%</span>
          </button>
        </div>
      </div>

      {/* Plans grid */}
      <div className="subs-grid">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`subs-plan ${plan.highlight ? "subs-plan--featured" : ""}`}
            style={{
              background: plan.bg,
              border: `1.5px solid ${plan.border}`,
              color: plan.color,
            }}
          >
            {/* Plan header */}
            <div className="subs-plan__head">
              {plan.highlight && <div className="subs-plan__tag">Most Popular</div>}
              <p className="subs-plan__name" style={{ color: plan.highlight ? "#fff" : plan.color }}>
                {plan.name}
              </p>
              <div className="subs-plan__price">
                <span className="subs-plan__amount" style={{ color: plan.highlight ? "#fff" : "#0d1b36" }}>
                  {billing === "annual" && plan.price !== "0€"
                    ? plan.id === "premium" ? "31€" : "63€"
                    : plan.price}
                </span>
                {plan.priceSub && (
                  <span className="subs-plan__period" style={{ color: plan.highlight ? "rgba(255,255,255,0.75)" : "#6c778a" }}>
                    {plan.priceSub}
                  </span>
                )}
              </div>
              {plan.priceMeta && (
                <p className="subs-plan__meta" style={{ color: plan.highlight ? "rgba(255,255,255,0.8)" : "#6c778a" }}>
                  {plan.priceMeta}
                </p>
              )}
            </div>

            {/* Sections */}
            <div className="subs-plan__sections">
              {plan.sections.map((section) => (
                <div key={section.title} className="subs-section">
                  <p className="subs-section__title" style={{ color: plan.highlight ? "rgba(255,255,255,0.9)" : "#0d1b36" }}>
                    {section.title}
                  </p>
                  {section.items.map((item) => (
                    <p key={item} className="subs-section__item" style={{ color: plan.highlight ? "rgba(255,255,255,0.75)" : "#6c778a" }}>
                      • {item}
                    </p>
                  ))}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="subs-plan__footer">
              {plan.annualNote && (
                <p className="subs-annual-note" style={{ color: plan.highlight ? "rgba(255,255,255,0.7)" : "#6c778a" }}>
                  {plan.annualNote}
                </p>
              )}
              <button
                onClick={() => router.push("/register")}
                className={plan.ctaClass}
              >
                {plan.ctaLabel}
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .subs-shell {
          min-height: 100vh;
          background: #f8fafd;
          font-family: var(--font-geist-sans);
          padding: 0 0 80px;
        }
        .subs-header {
          text-align: center;
          padding: 48px 24px 32px;
          max-width: 800px;
          margin: 0 auto;
        }
        .subs-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0d1b36;
          margin-bottom: 8px;
          line-height: 1.3;
        }
        .subs-subtitle { font-size: 0.95rem; color: #6c778a; margin-bottom: 28px; }
        .subs-billing-toggle {
          display: inline-flex;
          background: #e4e9f2;
          border-radius: 50px;
          padding: 4px;
          gap: 4px;
        }
        .billing-btn {
          background: transparent;
          border: none;
          border-radius: 50px;
          padding: 8px 20px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #6c778a;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .billing-btn--active { background: #fff; color: #0d1b36; box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
        .billing-save { background: #22a55f; color: #fff; border-radius: 50px; padding: 1px 7px; font-size: 0.75rem; margin-left: 4px; }
        .subs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px;
          align-items: start;
        }
        .subs-plan {
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .subs-plan:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
        .subs-plan--featured { box-shadow: 0 8px 40px rgba(59,107,220,0.25); }
        .subs-plan__head { padding: 28px 24px 20px; position: relative; }
        .subs-plan__tag {
          display: inline-block;
          background: rgba(255,255,255,0.2);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 50px;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .subs-plan__name { font-size: 1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
        .subs-plan__price { display: flex; align-items: baseline; gap: 4px; margin-bottom: 8px; }
        .subs-plan__amount { font-size: 2rem; font-weight: 900; }
        .subs-plan__period { font-size: 0.85rem; font-weight: 500; }
        .subs-plan__meta { font-size: 0.82rem; margin-top: 4px; line-height: 1.4; }
        .subs-plan__sections { padding: 0 24px; flex: 1; }
        .subs-section { margin-bottom: 16px; }
        .subs-section__title { font-size: 0.85rem; font-weight: 700; margin-bottom: 6px; }
        .subs-section__item { font-size: 0.8rem; line-height: 1.6; padding: 1px 0; }
        .subs-plan__footer { padding: 20px 24px 28px; }
        .subs-annual-note { font-size: 0.8rem; text-align: center; margin-bottom: 10px; }
        .sub-btn {
          width: 100%; border-radius: 50px;
          padding: 14px; font-size: 0.95rem; font-weight: 700;
          cursor: pointer; transition: opacity 0.15s, transform 0.1s;
          border: none;
        }
        .sub-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .sub-btn--outline {
          background: transparent;
          border: 2px solid #3b6bdc;
          color: #3b6bdc;
        }
        .sub-btn--white {
          background: #fff;
          color: #3b6bdc;
        }
        .sub-btn--dark {
          background: #0d1b36;
          color: #fff;
        }
        @media (max-width: 900px) {
          .subs-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
