/**
 * Helper per tradurre le chiavi e i valori del funnel expats in etichette leggibili.
 * Usato nelle pagine admin analytics e sessioni per mostrare dati comprensibili.
 */

/** Nomi leggibili per le chiavi delle domande del funnel. */
export const QUESTION_LABELS: Record<string, string> = {
  user_phase: "Current situation",
  relocation_time: "Relocation timeline",
  age_range: "Age & gender",
  relationship: "Household",
  motivation: "Main goal",
  work_type: "Work status",
  need: "Priority problem",
  city_priority: "City values",
  budget: "Budget & lifestyle",
};

/** Nomi leggibili per i valori delle risposte semplici (stringhe). */
export const VALUE_LABELS: Record<string, string> = {
  // user_phase
  planning_move: "Planning a move",
  recently_moved: "Recently moved",
  already_there: "Already living there",
  // relocation_time
  within_3_months: "Within 3 months",
  "3_to_12_months": "3–12 months",
  "6_12_months": "6–12 months",
  less_than_6_months_here: "Less than 6 months here",
  exploring_options: "Exploring options",
  less_than_3_months: "Less than 3 months",
  "1_2_years": "1–2 years",
  more_than_2_years: "More than 2 years",
  // motivation
  career_growth: "Career growth",
  remote_work: "Remote work",
  study: "Education",
  lifestyle: "Lifestyle upgrade",
  family_stability: "Family stability",
  personal_reset: "Personal reset",
  // work_type values (simple)
  employed: "Employee",
  freelancer: "Freelancer",
  entrepreneur: "Entrepreneur",
  student: "Student",
  not_working: "Not working",
  // need
  housing: "Find housing",
  cost_of_living: "Cost of living",
  professional_network: "Professional network",
  neighborhood: "Choose neighborhood",
  friendships: "Make friends",
  schools_family: "Schools & family",
  bureaucracy: "Legal & paperwork",
  career_opportunities: "Career opportunities",
  monthly_costs: "Monthly costs",
  neighborhoods: "Neighborhoods",
  // city_priority
  social_life: "Social life",
  safety: "Safety",
  weather: "Weather",
  culture: "Culture",
  // lifestyle
  essential: "Essential",
  balanced: "Balanced",
  comfort: "Comfort",
  experience: "Experience",
  premium: "Premium",
  // age
  "18_24": "18–24",
  "25_34": "25–34",
  "35_44": "35–44",
  "45_54": "45–54",
  "55+": "55+",
  // gender
  male: "Male",
  female: "Female",
  other: "Other",
  // household
  alone: "Alone",
  with_partner: "With partner",
  with_children: "With children",
};

/** Traduce una chiave domanda in etichetta leggibile. */
export function formatQuestionKey(key: string): string {
  return QUESTION_LABELS[key] ?? key.replace(/_/g, " ");
}

/** Traduce un valore risposta (stringa semplice o JSON) in testo leggibile. */
export function formatAnswerValue(raw: string): string {
  if (raw.startsWith("{")) {
    try {
      const obj = JSON.parse(raw) as Record<string, unknown>;
      const parts: string[] = [];
      for (const [key, val] of Object.entries(obj)) {
        if (val === null || val === undefined || val === "" || val === 0 || val === false) continue;
        const label = VALUE_LABELS[String(val)] ?? String(val);
        const keyLabel = key.replace(/([A-Z])/g, " $1").toLowerCase().trim();
        parts.push(`${keyLabel}: ${label}`);
      }
      return parts.length > 0 ? parts.join(" · ") : raw;
    } catch {
      return raw;
    }
  }
  return VALUE_LABELS[raw] ?? raw.replace(/_/g, " ");
}
