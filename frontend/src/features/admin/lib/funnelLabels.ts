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

/** Traduce un valore risposta (stringa semplice o JSON) in testo leggibile per l'admin. */
export function formatAnswerValue(raw: string): string {
  // Stringa semplice
  if (!raw.startsWith("{")) {
    return VALUE_LABELS[raw] ?? raw.replace(/_/g, " ");
  }

  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;

    // city_selection → mostra solo le città
    if ("targetType" in obj) {
      const parts: string[] = [];
      if (obj.currentCityName) parts.push(`From: ${String(obj.currentCityName)}`);
      if (obj.targetCityName) parts.push(`To: ${String(obj.targetCityName)}`);
      if (!obj.targetCityName && obj.targetType === "not_sure") parts.push("Not sure yet");
      if (!obj.targetCityName && obj.targetType === "already_live") parts.push("Already living there");
      return parts.join(" → ") || (VALUE_LABELS[String(obj.targetType)] ?? String(obj.targetType));
    }

    // age_range → "Male, 25–34"
    if ("ageRange" in obj) {
      const parts: string[] = [];
      if (obj.gender) parts.push(VALUE_LABELS[String(obj.gender)] ?? String(obj.gender));
      if (obj.ageRange) parts.push(VALUE_LABELS[String(obj.ageRange)] ?? String(obj.ageRange));
      return parts.join(", ");
    }

    // relationship/household → "Alone" o "With children (2)"
    if ("household" in obj) {
      const h = VALUE_LABELS[String(obj.household)] ?? String(obj.household);
      const parts = [h];
      if (obj.childrenCount && Number(obj.childrenCount) > 0) {
        parts[0] = `${h} (${obj.childrenCount})`;
      }
      if (obj.hasPets === true) parts.push("has pets");
      return parts.join(", ");
    }

    // work_type → "Freelancer, remote, full time"
    if ("workStatus" in obj) {
      const parts: string[] = [];
      if (obj.workStatus) parts.push(VALUE_LABELS[String(obj.workStatus)] ?? String(obj.workStatus));
      if (obj.isRemote === true) parts.push("Remote");
      if (obj.workStructure) parts.push(String(obj.workStructure).replace(/_/g, " "));
      return parts.join(", ");
    }

    // budget → "€2,000/mo · Balanced"
    if ("monthlyBudget" in obj) {
      const budget = Number(obj.monthlyBudget);
      const lifestyle = VALUE_LABELS[String(obj.desiredLifestyle)] ?? String(obj.desiredLifestyle ?? "");
      const budgetStr = budget > 0 ? `€${budget.toLocaleString()}/mo` : "";
      return [budgetStr, lifestyle].filter(Boolean).join(" · ");
    }

    // Fallback generico per oggetti sconosciuti
    const parts: string[] = [];
    for (const [, val] of Object.entries(obj)) {
      if (val === null || val === undefined || val === "" || val === 0 || val === false) continue;
      parts.push(VALUE_LABELS[String(val)] ?? String(val));
    }
    return parts.join(", ") || raw;
  } catch {
    return raw;
  }
}
