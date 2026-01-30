import type { TestType } from "@/types/tests";

type TestCardTheme = {
  card: string;
  badge: string;
  button: string;
  orb: string;
  orbAlt: string;
  pattern: string;
  label: string;
  chip: string;
};

const CARD_BASE =
  "relative isolate overflow-hidden border transition-all duration-300";

const ORB_BASE = "pointer-events-none absolute rounded-full blur-2xl opacity-35";
const PATTERN_BASE = "pointer-events-none absolute inset-0 opacity-45";
const CHIP_BASE =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]";

const THEMES: Record<TestType, TestCardTheme> = {
  INTERESTS: {
    card:
      "border-amber-200/70 bg-[linear-gradient(145deg,rgba(255,247,237,0.98),rgba(255,237,213,0.7))] hover:shadow-[0_18px_40px_rgba(249,115,22,0.14)]",
    badge: "border border-amber-200/70 bg-amber-50 text-amber-700",
    button: "border-amber-200/80 text-amber-700 hover:border-amber-300",
    orb: `${ORB_BASE} -right-6 -top-6 h-24 w-24 bg-amber-200/70`,
    orbAlt: `${ORB_BASE} -left-10 -bottom-10 h-28 w-28 bg-orange-200/60`,
    pattern: `${PATTERN_BASE} bg-[radial-gradient(rgba(251,191,36,0.25)_1px,transparent_1px)] bg-[size:18px_18px]`,
    label: "Passioni",
    chip: `${CHIP_BASE} border border-amber-200/70 bg-amber-50 text-amber-700`,
  },
  LIFESTYLE: {
    card:
      "border-emerald-200/70 bg-[linear-gradient(145deg,rgba(236,253,245,0.98),rgba(209,250,229,0.7))] hover:shadow-[0_18px_40px_rgba(16,185,129,0.14)]",
    badge: "border border-emerald-200/70 bg-emerald-50 text-emerald-700",
    button: "border-emerald-200/80 text-emerald-700 hover:border-emerald-300",
    orb: `${ORB_BASE} -right-6 -top-8 h-24 w-24 bg-emerald-200/70`,
    orbAlt: `${ORB_BASE} -left-10 -bottom-10 h-28 w-28 bg-lime-200/60`,
    pattern: `${PATTERN_BASE} bg-[linear-gradient(120deg,rgba(16,185,129,0.18),transparent_45%,rgba(52,211,153,0.22))]`,
    label: "Lifestyle",
    chip: `${CHIP_BASE} border border-emerald-200/70 bg-emerald-50 text-emerald-700`,
  },
  VALUES: {
    card:
      "border-sky-200/70 bg-[linear-gradient(145deg,rgba(240,249,255,0.98),rgba(224,242,254,0.7))] hover:shadow-[0_18px_40px_rgba(59,130,246,0.14)]",
    badge: "border border-sky-200/70 bg-sky-50 text-sky-700",
    button: "border-sky-200/80 text-sky-700 hover:border-sky-300",
    orb: `${ORB_BASE} -right-6 -top-6 h-24 w-24 bg-sky-200/70`,
    orbAlt: `${ORB_BASE} -left-10 -bottom-10 h-28 w-28 bg-blue-200/60`,
    pattern: `${PATTERN_BASE} bg-[linear-gradient(90deg,rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:18px_18px]`,
    label: "Valori",
    chip: `${CHIP_BASE} border border-sky-200/70 bg-sky-50 text-sky-700`,
  },
  OBJECTIVES: {
    card:
      "border-teal-200/70 bg-[linear-gradient(145deg,rgba(240,253,250,0.98),rgba(204,251,241,0.7))] hover:shadow-[0_18px_40px_rgba(13,148,136,0.14)]",
    badge: "border border-teal-200/70 bg-teal-50 text-teal-700",
    button: "border-teal-200/80 text-teal-700 hover:border-teal-300",
    orb: `${ORB_BASE} -right-6 -top-8 h-24 w-24 bg-teal-200/70`,
    orbAlt: `${ORB_BASE} -left-10 -bottom-10 h-28 w-28 bg-cyan-200/60`,
    pattern: `${PATTERN_BASE} bg-[linear-gradient(135deg,rgba(13,148,136,0.16)_25%,transparent_25%,transparent_50%,rgba(13,148,136,0.16)_50%,rgba(13,148,136,0.16)_75%,transparent_75%,transparent)] bg-[size:18px_18px]`,
    label: "Obiettivi",
    chip: `${CHIP_BASE} border border-teal-200/70 bg-teal-50 text-teal-700`,
  },
  PSY: {
    card:
      "border-fuchsia-200/70 bg-[linear-gradient(145deg,rgba(253,244,255,0.98),rgba(250,232,255,0.7))] hover:shadow-[0_18px_40px_rgba(168,85,247,0.14)]",
    badge: "border border-fuchsia-200/70 bg-fuchsia-50 text-fuchsia-700",
    button: "border-fuchsia-200/80 text-fuchsia-700 hover:border-fuchsia-300",
    orb: `${ORB_BASE} -right-6 -top-6 h-24 w-24 bg-fuchsia-200/70`,
    orbAlt: `${ORB_BASE} -left-10 -bottom-10 h-28 w-28 bg-purple-200/60`,
    pattern: `${PATTERN_BASE} bg-[radial-gradient(rgba(168,85,247,0.22)_1px,transparent_1px)] bg-[size:16px_16px]`,
    label: "Psicologico",
    chip: `${CHIP_BASE} border border-fuchsia-200/70 bg-fuchsia-50 text-fuchsia-700`,
  },
  ASTRO: {
    card:
      "border-indigo-200/70 bg-[linear-gradient(145deg,rgba(238,242,255,0.98),rgba(224,231,255,0.7))] hover:shadow-[0_18px_40px_rgba(99,102,241,0.16)]",
    badge: "border border-indigo-200/70 bg-indigo-50 text-indigo-700",
    button: "border-indigo-200/80 text-indigo-700 hover:border-indigo-300",
    orb: `${ORB_BASE} -right-6 -top-6 h-24 w-24 bg-indigo-200/70`,
    orbAlt: `${ORB_BASE} -left-10 -bottom-10 h-28 w-28 bg-blue-200/60`,
    pattern: `${PATTERN_BASE} bg-[radial-gradient(rgba(129,140,248,0.4)_1px,transparent_1px)] bg-[size:20px_20px]`,
    label: "Astrologia",
    chip: `${CHIP_BASE} border border-indigo-200/70 bg-indigo-50 text-indigo-700`,
  },
  OTHER: {
    card:
      "border-slate-200/70 bg-[linear-gradient(145deg,rgba(248,250,252,0.98),rgba(241,245,249,0.7))] hover:shadow-[0_18px_40px_rgba(100,116,139,0.12)]",
    badge: "border border-slate-200/70 bg-slate-50 text-slate-700",
    button: "border-slate-200/80 text-slate-700 hover:border-slate-300",
    orb: `${ORB_BASE} -right-6 -top-8 h-24 w-24 bg-slate-200/70`,
    orbAlt: `${ORB_BASE} -left-10 -bottom-10 h-28 w-28 bg-slate-300/60`,
    pattern: `${PATTERN_BASE} bg-[linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:16px_16px]`,
    label: "Test",
    chip: `${CHIP_BASE} border border-slate-200/70 bg-slate-50 text-slate-700`,
  },
};

export const getTestCardTheme = (type?: TestType | null): TestCardTheme => {
  const theme = type ? THEMES[type] : THEMES.OTHER;
  return {
    card: `${CARD_BASE} ${theme.card}`,
    badge: theme.badge,
    button: theme.button,
    orb: theme.orb,
    orbAlt: theme.orbAlt,
    pattern: theme.pattern,
    label: theme.label,
    chip: theme.chip,
  };
};
