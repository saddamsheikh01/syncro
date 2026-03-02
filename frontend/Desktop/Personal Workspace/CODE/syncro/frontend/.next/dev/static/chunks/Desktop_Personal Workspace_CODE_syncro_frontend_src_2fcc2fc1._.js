(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/lib/classNames.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cx",
    ()=>cx
]);
const cx = (...classes)=>classes.filter(Boolean).join(" ");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/lib/mediaUrl.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resolveMediaUrl",
    ()=>resolveMediaUrl
]);
const LOOPBACK_HOSTS = new Set([
    "localhost",
    "127.0.0.1",
    "::1"
]);
const resolveMediaUrl = (rawUrl)=>{
    if (!rawUrl) return null;
    if (rawUrl.startsWith("/")) return rawUrl;
    try {
        const parsed = new URL(rawUrl);
        if (LOOPBACK_HOSTS.has(parsed.hostname) && parsed.pathname.startsWith("/media/")) {
            return `${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
        return parsed.toString();
    } catch  {
        return rawUrl;
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/lib/profileCompletion.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* ------------------------------------------------------------------ */ /*  Types                                                              */ /* ------------------------------------------------------------------ */ __turbopack_context__.s([
    "calculateProfileCompletion",
    ()=>calculateProfileCompletion
]);
/* ------------------------------------------------------------------ */ /*  Weights                                                            */ /* ------------------------------------------------------------------ */ const WEIGHTS = {
    tests: 30,
    profile: 30,
    interests: 15,
    avatar: 10,
    preferences: 10,
    location: 5
};
const INTEREST_THRESHOLD = 3;
const REQUIRED_PROFILE_FIELDS = [
    "username",
    "email",
    "fullName",
    "birthDate",
    "city",
    "country",
    "jobTitle",
    "companyName",
    "bio",
    "traitsText",
    "lovesText",
    "dislikesText",
    "goalsText",
    "valuesText"
];
/* ------------------------------------------------------------------ */ /*  Helpers                                                            */ /* ------------------------------------------------------------------ */ const isFilled = (value)=>typeof value === "string" && value.trim().length > 0;
const makeCategory = (weight, ratio)=>({
        weight,
        ratio,
        points: Math.round(weight * ratio * 100) / 100
    });
const calculateProfileCompletion = (input)=>{
    // Tests (30%)
    const testsRatio = input.testsTotal > 0 ? input.testsCompleted / input.testsTotal : 0;
    // Profile fields (30%)
    const requiredFieldValues = REQUIRED_PROFILE_FIELDS.map((key)=>input.profileFields[key]);
    const filledRequiredCount = requiredFieldValues.filter(isFilled).length;
    const profileRatio = requiredFieldValues.length > 0 ? filledRequiredCount / requiredFieldValues.length : 0;
    // Interests (15%)
    const interestsRatio = Math.min(input.interestCount / INTEREST_THRESHOLD, 1);
    // Avatar (10%)
    const avatarRatio = input.hasAvatar ? 1 : 0;
    // Preferences (10%)
    const filterValues = input.matchmakingFilterValues;
    const filledFilters = [
        "ageMin",
        "ageMax",
        "distanceKm",
        "gender"
    ].filter((key)=>filterValues[key] !== null && filterValues[key] !== undefined).length;
    const preferencesRatio = filledFilters / 4;
    // Location (5%)
    const hasManualLocation = isFilled(input.profileFields.city) && isFilled(input.profileFields.country);
    const locationRatio = input.hasPosition || hasManualLocation ? 1 : 0;
    // Build result
    const categories = {
        tests: makeCategory(WEIGHTS.tests, testsRatio),
        profile: makeCategory(WEIGHTS.profile, profileRatio),
        interests: makeCategory(WEIGHTS.interests, interestsRatio),
        avatar: makeCategory(WEIGHTS.avatar, avatarRatio),
        preferences: makeCategory(WEIGHTS.preferences, preferencesRatio),
        location: makeCategory(WEIGHTS.location, locationRatio)
    };
    const totalPoints = Object.values(categories).reduce((sum, cat)=>sum + cat.points, 0);
    let rawPercentage = Math.round(totalPoints);
    // When all categories are complete, always show 100%
    const allCategoriesComplete = Object.values(categories).every((c)=>c.ratio >= 1);
    if (allCategoriesComplete) {
        rawPercentage = 100;
    } else if (rawPercentage >= 98 && totalPoints >= 97.0) {
        // Displayed 98–99%: treat as complete so bar fills and we don't nag for one small missing field
        rawPercentage = 100;
    }
    const percentage = Math.min(100, Math.max(0, rawPercentage));
    return {
        percentage,
        categories
    };
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/lib/zyraSeed.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ZYRA_SEED_STORAGE_KEY",
    ()=>ZYRA_SEED_STORAGE_KEY,
    "readZyraSeedMessage",
    ()=>readZyraSeedMessage,
    "storeZyraSeedMessage",
    ()=>storeZyraSeedMessage
]);
const ZYRA_SEED_STORAGE_KEY = "syncro.zyra.seed";
const storeZyraSeedMessage = (message)=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    sessionStorage.setItem(ZYRA_SEED_STORAGE_KEY, message);
};
const readZyraSeedMessage = ()=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const message = sessionStorage.getItem(ZYRA_SEED_STORAGE_KEY);
    if (message) {
        sessionStorage.removeItem(ZYRA_SEED_STORAGE_KEY);
        return message;
    }
    return null;
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/lib/zyraAvatar.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ZYRA_AVATAR_SRC",
    ()=>ZYRA_AVATAR_SRC
]);
const ZYRA_AVATAR_SRC = "/AI/zyra.png";
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/lib/mediaEvents.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PROFILE_AVATAR_UPDATED_EVENT",
    ()=>PROFILE_AVATAR_UPDATED_EVENT,
    "dispatchProfileAvatarUpdated",
    ()=>dispatchProfileAvatarUpdated
]);
const PROFILE_AVATAR_UPDATED_EVENT = "profile-avatar-updated";
const dispatchProfileAvatarUpdated = (detail)=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    window.dispatchEvent(new CustomEvent(PROFILE_AVATAR_UPDATED_EVENT, {
        detail
    }));
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/lib/geo.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Calcola la distanza in km tra due punti usando la formula Haversine.
 */ __turbopack_context__.s([
    "calculateDistanceKm",
    ()=>calculateDistanceKm,
    "formatDistanceKm",
    ()=>formatDistanceKm
]);
const calculateDistanceKm = (lat1, lng1, lat2, lng2)=>{
    const R = 6371; // Raggio della Terra in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
const toRad = (deg)=>deg * (Math.PI / 180);
const formatDistanceKm = (distanceKm)=>{
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/lib/matchDomains.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MATCH_DOMAIN_ORDER",
    ()=>MATCH_DOMAIN_ORDER,
    "formatMatchDomainLabel",
    ()=>formatMatchDomainLabel,
    "getDomainFilterItems",
    ()=>getDomainFilterItems,
    "getMatchDomainMeta",
    ()=>getMatchDomainMeta,
    "resolveMatchDomainScores",
    ()=>resolveMatchDomainScores,
    "resolveMatchDomainSlots",
    ()=>resolveMatchDomainSlots,
    "resolveTopMatchDomain",
    ()=>resolveTopMatchDomain
]);
const identityTranslate = (label)=>label;
const DOMAIN_META = {
    LOVE: {
        domain: "LOVE",
        key: "love",
        label: "Love",
        emoji: "\u2764"
    },
    FRIENDSHIP: {
        domain: "FRIENDSHIP",
        key: "friendship",
        label: "Friendship",
        emoji: "\u{1F91D}"
    },
    WORK: {
        domain: "WORK",
        key: "work",
        label: "Work",
        emoji: "\u{1F4BC}"
    },
    PROJECTS: {
        domain: "PROJECTS",
        key: "projects",
        label: "Projects",
        emoji: "\u{1F680}"
    },
    HOBBY: {
        domain: "HOBBY",
        key: "hobby",
        label: "Hobby",
        emoji: "\u{1F3A8}"
    },
    GROWTH: {
        domain: "GROWTH",
        key: "growth",
        label: "Growth",
        emoji: "\u{1F331}"
    }
};
const MATCH_DOMAIN_ORDER = [
    "WORK",
    "PROJECTS",
    "FRIENDSHIP",
    "HOBBY",
    "GROWTH",
    "LOVE"
];
const getMatchDomainMeta = (domain)=>DOMAIN_META[domain];
const formatMatchDomainLabel = (domain, translate = identityTranslate)=>{
    const meta = getMatchDomainMeta(domain);
    return `${meta.emoji} ${translate(meta.label)}`;
};
const getDomainFilterItems = (translate = identityTranslate)=>[
        {
            id: "ALL",
            label: `\u{2728} ${translate("All contexts")}`
        },
        ...MATCH_DOMAIN_ORDER.map((domain)=>({
                id: domain,
                label: formatMatchDomainLabel(domain, translate)
            }))
    ];
const resolveMatchDomainScores = (breakdown)=>{
    if (!breakdown || typeof breakdown !== "object" || Array.isArray(breakdown)) {
        return [];
    }
    const domainsRaw = breakdown.domains;
    if (!domainsRaw || typeof domainsRaw !== "object" || Array.isArray(domainsRaw)) {
        return [];
    }
    const domains = domainsRaw;
    const orderIndex = new Map(MATCH_DOMAIN_ORDER.map((domain, index)=>[
            domain,
            index
        ]));
    const scores = MATCH_DOMAIN_ORDER.map((domain)=>{
        const meta = getMatchDomainMeta(domain);
        const rawScore = domains[meta.key] ?? domains[domain];
        if (typeof rawScore !== "number" || !Number.isFinite(rawScore)) {
            return null;
        }
        return {
            ...meta,
            score: Math.max(0, Math.min(100, rawScore))
        };
    }).filter((item)=>item !== null);
    scores.sort((a, b)=>{
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return (orderIndex.get(a.domain) ?? 0) - (orderIndex.get(b.domain) ?? 0);
    });
    return scores;
};
const resolveMatchDomainSlots = (breakdown)=>{
    const orderIndex = new Map(MATCH_DOMAIN_ORDER.map((domain, index)=>[
            domain,
            index
        ]));
    if (!breakdown || typeof breakdown !== "object" || Array.isArray(breakdown)) {
        return MATCH_DOMAIN_ORDER.map((domain)=>({
                ...getMatchDomainMeta(domain),
                score: null,
                missing: true
            }));
    }
    const domainsRaw = breakdown.domains;
    const domains = domainsRaw && typeof domainsRaw === "object" && !Array.isArray(domainsRaw) ? domainsRaw : {};
    const slots = MATCH_DOMAIN_ORDER.map((domain)=>{
        const meta = getMatchDomainMeta(domain);
        const rawScore = domains[meta.key] ?? domains[domain];
        const score = typeof rawScore === "number" && Number.isFinite(rawScore) ? Math.max(0, Math.min(100, rawScore)) : null;
        return {
            ...meta,
            score,
            missing: score == null
        };
    });
    slots.sort((a, b)=>{
        if (a.missing !== b.missing) {
            return a.missing ? 1 : -1;
        }
        return (orderIndex.get(a.domain) ?? 0) - (orderIndex.get(b.domain) ?? 0);
    });
    return slots;
};
const resolveTopMatchDomain = (breakdown)=>{
    const [top] = resolveMatchDomainScores(breakdown);
    if (!top) return null;
    return {
        domain: top.domain,
        score: top.score
    };
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/lib/matchCopy.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildContextualMatchDescription",
    ()=>buildContextualMatchDescription,
    "isGenericOrEmptyExplanation",
    ()=>isGenericOrEmptyExplanation,
    "looksItalianMatchCopy",
    ()=>looksItalianMatchCopy,
    "resolveMatchCopy",
    ()=>resolveMatchCopy
]);
const ITALIAN_MATCH_HINTS = [
    "condivid",
    "passion",
    "valori",
    "stile",
    "vita",
    "obiettiv",
    "personalita",
    "astrolog",
    "affin",
    "compatibil",
    "amiciz",
    "relazion",
    "lavor",
    "progett",
    "cresc",
    "insieme",
    "potenziale",
    "basato su",
    "filtri correnti"
];
const GENERIC_PLACEHOLDERS = [
    "relevant connection based on your current context",
    "match basato su compatibilita generale"
];
const looksItalianMatchCopy = (value)=>{
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    return ITALIAN_MATCH_HINTS.some((hint)=>normalized.includes(hint));
};
const isGenericOrEmptyExplanation = (value)=>{
    if (!value || !value.trim()) return true;
    const normalized = value.trim().toLowerCase();
    return GENERIC_PLACEHOLDERS.some((p)=>normalized === p || normalized.startsWith(p));
};
const resolveMatchCopy = (value, fallback)=>{
    if (!value || !value.trim()) return fallback;
    if (isGenericOrEmptyExplanation(value)) return fallback;
    if (looksItalianMatchCopy(value)) return fallback;
    return value.trim();
};
const MIN_SCORE_FOR_CONTEXTUAL = 25;
const DOMAIN_LABEL_KEYS = {
    work: "match.domain.work",
    projects: "match.domain.projects",
    friendship: "match.domain.friendship",
    hobby: "match.domain.hobby",
    growth: "match.domain.growth",
    love: "match.domain.love"
};
const STRENGTH_EXCEPTIONAL = 85;
const STRENGTH_HIGH = 70;
const STRENGTH_MID = 50;
const CLOSE_SCORE_GAP = 5;
function strengthKey(score) {
    if (score >= STRENGTH_EXCEPTIONAL) return "match.strength.exceptional";
    if (score >= STRENGTH_HIGH) return "match.strength.veryStrong";
    if (score >= STRENGTH_MID) return "match.strength.strong";
    return "match.strength.goodFit";
}
function hashForTieBreak(seed, label) {
    let h = 0;
    const s = seed + label;
    for(let i = 0; i < s.length; i++){
        h = (h << 5) - h + s.charCodeAt(i);
        h |= 0;
    }
    return h;
}
function pickVariant(seed, count) {
    if (!seed || count <= 1) return 0;
    return Math.abs(hashForTieBreak(seed, "v")) % count;
}
const buildContextualMatchDescription = (breakdown, t, matchSeed)=>{
    if (!breakdown || typeof breakdown !== "object" || Array.isArray(breakdown)) {
        return null;
    }
    const obj = breakdown;
    const domainsRaw = obj.domains;
    if (!domainsRaw || typeof domainsRaw !== "object" || Array.isArray(domainsRaw)) {
        return null;
    }
    const domains = domainsRaw;
    const parts = [];
    for (const [key, raw] of Object.entries(domains)){
        if (typeof raw === "number" && Number.isFinite(raw) && raw >= MIN_SCORE_FOR_CONTEXTUAL) {
            const labelKey = DOMAIN_LABEL_KEYS[key] ?? `match.domain.${key}`;
            parts.push({
                score: Math.round(raw),
                label: t(labelKey),
                key
            });
        }
    }
    if (parts.length === 0) return null;
    parts.sort((a, b)=>{
        if (b.score !== a.score) return b.score - a.score;
        if (!matchSeed) return 0;
        return hashForTieBreak(matchSeed, a.key) - hashForTieBreak(matchSeed, b.key);
    });
    const first = parts[0];
    const second = parts[1];
    const third = parts[2];
    const includeThird = second && third && first.label !== second.label && second.label !== third.label && second.score - third.score <= CLOSE_SCORE_GAP;
    if (!second || first.label === second.label) {
        const strength = t(strengthKey(first.score));
        const variant = pickVariant(matchSeed ?? "", 2);
        const key = variant === 0 ? "match.compatibilityTextOne" : "match.compatibilityTextOneAlt";
        return t(key, {
            strength,
            a: first.label
        });
    }
    if (includeThird) {
        const strength = t(strengthKey(first.score));
        const variant = pickVariant(matchSeed ?? "", 2);
        const key = variant === 0 ? "match.compatibilityTextThree" : "match.compatibilityTextThreeAlt";
        return t(key, {
            strength,
            a: first.label,
            b: second.label,
            c: third.label
        });
    }
    const strength1 = t(strengthKey(first.score));
    const strength2 = t(strengthKey(second.score));
    const strength = t(strengthKey(first.score));
    const variant = pickVariant(matchSeed ?? "", 3);
    const key = variant === 0 ? "match.compatibilityTextTwo" : variant === 1 ? "match.compatibilityTextTwoAlt" : "match.compatibilityTextTwoAlt2";
    return t(key, {
        strength1,
        strength2,
        strength,
        a: first.label,
        b: second.label
    });
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/lib/testCardTheme.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getTestCardTheme",
    ()=>getTestCardTheme
]);
const CARD_BASE = "relative isolate overflow-hidden border transition-all duration-300";
const ORB_BASE = "pointer-events-none absolute rounded-full blur-2xl opacity-35";
const PATTERN_BASE = "pointer-events-none absolute inset-0 opacity-45";
const CHIP_BASE = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]";
const THEMES = {
    INTERESTS: {
        card: "border-amber-200/70 bg-[linear-gradient(145deg,rgba(255,247,237,0.98),rgba(255,237,213,0.7))] hover:shadow-[0_18px_40px_rgba(249,115,22,0.14)]",
        badge: "border border-amber-200/70 bg-amber-50 text-amber-700",
        button: "border-amber-200/80 text-amber-700 hover:border-amber-300",
        orb: `${ORB_BASE} -right-6 -top-6 h-24 w-24 bg-amber-200/70`,
        orbAlt: `${ORB_BASE} -left-10 -bottom-10 h-28 w-28 bg-orange-200/60`,
        pattern: `${PATTERN_BASE} bg-[radial-gradient(rgba(251,191,36,0.25)_1px,transparent_1px)] bg-[size:18px_18px]`,
        label: "Interests",
        chip: `${CHIP_BASE} border border-amber-200/70 bg-amber-50 text-amber-700`
    },
    LIFESTYLE: {
        card: "border-emerald-200/70 bg-[linear-gradient(145deg,rgba(236,253,245,0.98),rgba(209,250,229,0.7))] hover:shadow-[0_18px_40px_rgba(16,185,129,0.14)]",
        badge: "border border-emerald-200/70 bg-emerald-50 text-emerald-700",
        button: "border-emerald-200/80 text-emerald-700 hover:border-emerald-300",
        orb: `${ORB_BASE} -right-6 -top-8 h-24 w-24 bg-emerald-200/70`,
        orbAlt: `${ORB_BASE} -left-10 -bottom-10 h-28 w-28 bg-lime-200/60`,
        pattern: `${PATTERN_BASE} bg-[linear-gradient(120deg,rgba(16,185,129,0.18),transparent_45%,rgba(52,211,153,0.22))]`,
        label: "Lifestyle",
        chip: `${CHIP_BASE} border border-emerald-200/70 bg-emerald-50 text-emerald-700`
    },
    VALUES: {
        card: "border-sky-200/70 bg-[linear-gradient(145deg,rgba(240,249,255,0.98),rgba(224,242,254,0.7))] hover:shadow-[0_18px_40px_rgba(59,130,246,0.14)]",
        badge: "border border-sky-200/70 bg-sky-50 text-sky-700",
        button: "border-sky-200/80 text-sky-700 hover:border-sky-300",
        orb: `${ORB_BASE} -right-6 -top-6 h-24 w-24 bg-sky-200/70`,
        orbAlt: `${ORB_BASE} -left-10 -bottom-10 h-28 w-28 bg-blue-200/60`,
        pattern: `${PATTERN_BASE} bg-[linear-gradient(90deg,rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:18px_18px]`,
        label: "Values",
        chip: `${CHIP_BASE} border border-sky-200/70 bg-sky-50 text-sky-700`
    },
    OBJECTIVES: {
        card: "border-teal-200/70 bg-[linear-gradient(145deg,rgba(240,253,250,0.98),rgba(204,251,241,0.7))] hover:shadow-[0_18px_40px_rgba(13,148,136,0.14)]",
        badge: "border border-teal-200/70 bg-teal-50 text-teal-700",
        button: "border-teal-200/80 text-teal-700 hover:border-teal-300",
        orb: `${ORB_BASE} -right-6 -top-8 h-24 w-24 bg-teal-200/70`,
        orbAlt: `${ORB_BASE} -left-10 -bottom-10 h-28 w-28 bg-cyan-200/60`,
        pattern: `${PATTERN_BASE} bg-[linear-gradient(135deg,rgba(13,148,136,0.16)_25%,transparent_25%,transparent_50%,rgba(13,148,136,0.16)_50%,rgba(13,148,136,0.16)_75%,transparent_75%,transparent)] bg-[size:18px_18px]`,
        label: "Goals",
        chip: `${CHIP_BASE} border border-teal-200/70 bg-teal-50 text-teal-700`
    },
    PSY: {
        card: "border-fuchsia-200/70 bg-[linear-gradient(145deg,rgba(253,244,255,0.98),rgba(250,232,255,0.7))] hover:shadow-[0_18px_40px_rgba(168,85,247,0.14)]",
        badge: "border border-fuchsia-200/70 bg-fuchsia-50 text-fuchsia-700",
        button: "border-fuchsia-200/80 text-fuchsia-700 hover:border-fuchsia-300",
        orb: `${ORB_BASE} -right-6 -top-6 h-24 w-24 bg-fuchsia-200/70`,
        orbAlt: `${ORB_BASE} -left-10 -bottom-10 h-28 w-28 bg-purple-200/60`,
        pattern: `${PATTERN_BASE} bg-[radial-gradient(rgba(168,85,247,0.22)_1px,transparent_1px)] bg-[size:16px_16px]`,
        label: "Psychological",
        chip: `${CHIP_BASE} border border-fuchsia-200/70 bg-fuchsia-50 text-fuchsia-700`
    },
    ASTRO: {
        card: "border-indigo-200/70 bg-[linear-gradient(145deg,rgba(238,242,255,0.98),rgba(224,231,255,0.7))] hover:shadow-[0_18px_40px_rgba(99,102,241,0.16)]",
        badge: "border border-indigo-200/70 bg-indigo-50 text-indigo-700",
        button: "border-indigo-200/80 text-indigo-700 hover:border-indigo-300",
        orb: `${ORB_BASE} -right-6 -top-6 h-24 w-24 bg-indigo-200/70`,
        orbAlt: `${ORB_BASE} -left-10 -bottom-10 h-28 w-28 bg-blue-200/60`,
        pattern: `${PATTERN_BASE} bg-[radial-gradient(rgba(129,140,248,0.4)_1px,transparent_1px)] bg-[size:20px_20px]`,
        label: "Astrology",
        chip: `${CHIP_BASE} border border-indigo-200/70 bg-indigo-50 text-indigo-700`
    },
    OTHER: {
        card: "border-slate-200/70 bg-[linear-gradient(145deg,rgba(248,250,252,0.98),rgba(241,245,249,0.7))] hover:shadow-[0_18px_40px_rgba(100,116,139,0.12)]",
        badge: "border border-slate-200/70 bg-slate-50 text-slate-700",
        button: "border-slate-200/80 text-slate-700 hover:border-slate-300",
        orb: `${ORB_BASE} -right-6 -top-8 h-24 w-24 bg-slate-200/70`,
        orbAlt: `${ORB_BASE} -left-10 -bottom-10 h-28 w-28 bg-slate-300/60`,
        pattern: `${PATTERN_BASE} bg-[linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:16px_16px]`,
        label: "Insights",
        chip: `${CHIP_BASE} border border-slate-200/70 bg-slate-50 text-slate-700`
    }
};
const getTestCardTheme = (type)=>{
    const theme = type ? THEMES[type] : THEMES.OTHER;
    return {
        card: `${CARD_BASE} ${theme.card}`,
        badge: theme.badge,
        button: theme.button,
        orb: theme.orb,
        orbAlt: theme.orbAlt,
        pattern: theme.pattern,
        label: theme.label,
        chip: theme.chip
    };
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/lib/insightCardImage.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getInsightCardImage",
    ()=>getInsightCardImage
]);
const DEFAULT_IMAGE = "/insights/test%20lifestyle.jpg";
const GOALS_IMAGE = "/insights/test%20goals.png";
const IMAGE_BY_TYPE = {
    INTERESTS: "/insights/test%20interessi.jpg",
    LIFESTYLE: "/insights/test%20lifestyle.jpg",
    VALUES: "/insights/test%20valoriale.png",
    OBJECTIVES: GOALS_IMAGE,
    PSY: "/insights/test%20psicologico.jpg",
    ASTRO: "/insights/astrologia.jpg",
    OTHER: DEFAULT_IMAGE
};
const normalize = (value)=>value ? value.trim().toLowerCase() : "";
const getInsightCardImage = (type, title)=>{
    if (type && IMAGE_BY_TYPE[type]) {
        return IMAGE_BY_TYPE[type];
    }
    const normalizedTitle = normalize(title);
    if (normalizedTitle.includes("astrolog")) {
        return IMAGE_BY_TYPE.ASTRO;
    }
    if (normalizedTitle.includes("psicolog")) {
        return IMAGE_BY_TYPE.PSY;
    }
    if (normalizedTitle.includes("valor")) {
        return IMAGE_BY_TYPE.VALUES;
    }
    if (normalizedTitle.includes("interess")) {
        return IMAGE_BY_TYPE.INTERESTS;
    }
    if (normalizedTitle.includes("lifestyle") || normalizedTitle.includes("obiettiv")) {
        return IMAGE_BY_TYPE.LIFESTYLE;
    }
    if (normalizedTitle.includes("goal")) {
        return GOALS_IMAGE;
    }
    return DEFAULT_IMAGE;
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/lib/insightsCopy.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resolveTestCopy",
    ()=>resolveTestCopy
]);
const normalize = (value)=>value.trim().toLowerCase();
const DEFAULT_EN_COPY = {
    INTERESTS: {
        title: "Interests Test",
        description: "Discover what truly motivates you. Choose the cards that represent your top interests to build a personalized profile."
    },
    LIFESTYLE: {
        title: "Lifestyle Test",
        description: "Explore your lifestyle through 15 questions about habits, social preferences, and how you organize your time."
    },
    VALUES: {
        title: "Values Test",
        description: "Understand your core values through 20 questions about inclusivity, autonomy, and tradition."
    },
    OBJECTIVES: {
        title: "Goals Test",
        description: "Identify your life goals through 15 questions about balance, stability, and growth."
    },
    PSY: {
        title: "Psychology Test",
        description: "Discover your psychological profile through 15 questions about how you think, feel, and act."
    },
    ASTRO: {
        title: "Birth Chart Test",
        description: "Enter your key signs to receive a symbolic astrology profile. Skip any data you don't know."
    },
    OTHER: {
        title: "Insight",
        description: "Complete this insight to refine your profile."
    }
};
const ITALIAN_TITLE_MAP = {
    "test interessi": DEFAULT_EN_COPY.INTERESTS,
    "test valori": DEFAULT_EN_COPY.VALUES,
    "test lifestyle": DEFAULT_EN_COPY.LIFESTYLE,
    "test obiettivi": DEFAULT_EN_COPY.OBJECTIVES,
    "test psicologico": DEFAULT_EN_COPY.PSY,
    "test tema natale": DEFAULT_EN_COPY.ASTRO,
    "test astrologico": DEFAULT_EN_COPY.ASTRO
};
const ITALIAN_HINTS = [
    "scopri",
    "inserisci",
    "obiettivi",
    "interessi",
    "valori",
    "psicolog",
    "tema natale",
    "astrolog",
    "domande",
    "equilibrio",
    "stabilit",
    "espansione",
    "abitudini",
    "preferenze"
];
const looksItalian = (value)=>{
    if (!value) return false;
    const normalized = normalize(value);
    return ITALIAN_HINTS.some((hint)=>normalized.includes(hint));
};
const resolveTestCopy = ({ title, description, testType })=>{
    const normalizedTitle = normalize(title);
    const mappedByTitle = ITALIAN_TITLE_MAP[normalizedTitle];
    if (mappedByTitle) return mappedByTitle;
    if ((looksItalian(title) || looksItalian(description)) && testType) {
        return DEFAULT_EN_COPY[testType] ?? {
            title,
            description: description ?? undefined
        };
    }
    return {
        title,
        description: description ?? undefined
    };
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/utils/queryParams.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildQueryParams",
    ()=>buildQueryParams
]);
const buildQueryParams = (params)=>{
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value])=>{
        if (value === undefined || value === null) {
            return;
        }
        if (Array.isArray(value)) {
            value.forEach((item)=>{
                if (item === undefined || item === null) {
                    return;
                }
                searchParams.append(key, String(item));
            });
            return;
        }
        searchParams.append(key, String(value));
    });
    return searchParams;
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/social/index.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "acceptConnection",
    ()=>acceptConnection,
    "createComment",
    ()=>createComment,
    "createConversation",
    ()=>createConversation,
    "createPost",
    ()=>createPost,
    "deleteComment",
    ()=>deleteComment,
    "deletePost",
    ()=>deletePost,
    "getComments",
    ()=>getComments,
    "getConnectionStatusWith",
    ()=>getConnectionStatusWith,
    "getConnections",
    ()=>getConnections,
    "getConversations",
    ()=>getConversations,
    "getFeed",
    ()=>getFeed,
    "getMessages",
    ()=>getMessages,
    "getPendingConnections",
    ()=>getPendingConnections,
    "getPostById",
    ()=>getPostById,
    "likePost",
    ()=>likePost,
    "reactToPost",
    ()=>reactToPost,
    "rejectConnection",
    ()=>rejectConnection,
    "removeReaction",
    ()=>removeReaction,
    "searchPosts",
    ()=>searchPosts,
    "sendConnectionRequest",
    ()=>sendConnectionRequest,
    "sendMessage",
    ()=>sendMessage,
    "unlikePost",
    ()=>unlikePost,
    "updatePost",
    ()=>updatePost
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/axiosConfig.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/utils/queryParams.ts [app-client] (ecmascript)");
;
;
const getFeed = async (params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/posts", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const getPostById = async (postId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/posts/${postId}`);
    return data;
};
const createPost = async (payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/posts", payload);
    return data;
};
const updatePost = async (postId, payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].put(`/posts/${postId}`, payload);
    return data;
};
const deletePost = async (postId)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].delete(`/posts/${postId}`);
};
const likePost = async (postId)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post(`/posts/${postId}/likes`);
};
const unlikePost = async (postId)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].delete(`/posts/${postId}/likes`);
};
const reactToPost = async (postId, reaction)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post(`/posts/${postId}/reactions`, {
        reaction
    });
};
const removeReaction = async (postId)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].delete(`/posts/${postId}/reactions`);
};
const searchPosts = async (params)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/posts/search", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const getConversations = async (params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/chats", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const createConversation = async (payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/chats", payload);
    return data;
};
const getMessages = async (conversationId, params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/chats/${conversationId}/messages`, {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const sendMessage = async (conversationId, payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post(`/chats/${conversationId}/messages`, payload);
    return data;
};
const getComments = async (postId, params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/posts/${postId}/comments`, {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const createComment = async (postId, payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post(`/posts/${postId}/comments`, payload);
    return data;
};
const deleteComment = async (postId, commentId)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].delete(`/posts/${postId}/comments/${commentId}`);
};
const sendConnectionRequest = async (payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/connections", payload);
    return data;
};
const acceptConnection = async (connectionId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post(`/connections/${connectionId}/accept`);
    return data;
};
const rejectConnection = async (connectionId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post(`/connections/${connectionId}/reject`);
    return data;
};
const getConnections = async (params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/connections", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const getPendingConnections = async (params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/connections/pending", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const getConnectionStatusWith = async (userId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/connections/status", {
        params: {
            userId
        }
    });
    return data;
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/favorites/index.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addFavorite",
    ()=>addFavorite,
    "getFavorites",
    ()=>getFavorites,
    "removeFavorite",
    ()=>removeFavorite
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/axiosConfig.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/utils/queryParams.ts [app-client] (ecmascript)");
;
;
const getFavorites = async (params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/favorites", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const addFavorite = async (payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/favorites", payload);
    return data;
};
const removeFavorite = async (params)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].delete("/favorites", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/media/index.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deletePostMedia",
    ()=>deletePostMedia,
    "getMediaByOwner",
    ()=>getMediaByOwner,
    "getPostMedia",
    ()=>getPostMedia,
    "uploadMedia",
    ()=>uploadMedia,
    "uploadPostMedia",
    ()=>uploadPostMedia
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/axiosConfig.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/utils/queryParams.ts [app-client] (ecmascript)");
;
;
/** 10 minutes — large videos need time on slow connections. */ const MEDIA_UPLOAD_TIMEOUT_MS = 600_000;
const getMediaByOwner = async (params)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/media", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const uploadMedia = async (params)=>{
    const formData = new FormData();
    formData.append("file", params.file);
    formData.append("ownerType", params.ownerType);
    formData.append("ownerId", params.ownerId);
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/media", formData, {
        timeout: MEDIA_UPLOAD_TIMEOUT_MS
    });
    return data;
};
const getPostMedia = async (params)=>{
    const { postId, ...pagination } = params;
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/posts/${postId}/media`, {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(pagination)
    });
    return data;
};
const deletePostMedia = async (postId, mediaId)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].delete(`/posts/${postId}/media/${mediaId}`);
};
const uploadPostMedia = async (params)=>{
    const formData = new FormData();
    formData.append("file", params.file);
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post(`/posts/${params.postId}/media`, formData, {
        timeout: MEDIA_UPLOAD_TIMEOUT_MS
    });
    return data;
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/tags/index.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getTags",
    ()=>getTags,
    "getUserInterests",
    ()=>getUserInterests,
    "updateUserInterests",
    ()=>updateUserInterests
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/axiosConfig.ts [app-client] (ecmascript)");
;
const getTags = async ()=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/tags");
    return data;
};
const getUserInterests = async ()=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/users/me/interests");
    return data;
};
const updateUserInterests = async (payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].put("/users/me/interests", payload);
    return data;
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/insights/index.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getMyTestsCount",
    ()=>getMyTestsCount,
    "getTest",
    ()=>getTest,
    "getTests",
    ()=>getTests,
    "getUserTestsCount",
    ()=>getUserTestsCount,
    "resetMySubmissions",
    ()=>resetMySubmissions,
    "resetTestSubmission",
    ()=>resetTestSubmission,
    "submitTest",
    ()=>submitTest
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/axiosConfig.ts [app-client] (ecmascript)");
;
const getTests = async ()=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/tests");
    return data;
};
const getTest = async (testId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/tests/${testId}`);
    return data;
};
const submitTest = async (testId, payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post(`/tests/${testId}/submit`, payload);
    return data;
};
const getMyTestsCount = async ()=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/tests/count");
    return data;
};
const getUserTestsCount = async (userId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/tests/users/${userId}/count`);
    return data;
};
const resetMySubmissions = async ()=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].delete("/tests/submissions/reset");
};
const resetTestSubmission = async (testId)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].delete(`/tests/${testId}/submissions`);
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/catalog/index.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getCategories",
    ()=>getCategories,
    "getExperience",
    ()=>getExperience,
    "getExperiences",
    ()=>getExperiences,
    "getPlace",
    ()=>getPlace,
    "getPlaces",
    ()=>getPlaces
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/axiosConfig.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/utils/queryParams.ts [app-client] (ecmascript)");
;
;
const getCategories = async (params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/categories", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const getPlaces = async (params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/places", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const getPlace = async (placeId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/places/${placeId}`);
    return data;
};
const getExperiences = async (params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/experiences", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const getExperience = async (experienceId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/experiences/${experienceId}`);
    return data;
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/matches/index.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getMatchWithUser",
    ()=>getMatchWithUser,
    "getRecommendations",
    ()=>getRecommendations,
    "getUserMatches",
    ()=>getUserMatches,
    "refreshUserMatch",
    ()=>refreshUserMatch
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/axiosConfig.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/utils/queryParams.ts [app-client] (ecmascript)");
;
;
const getUserMatches = async (params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/matches/users", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const getMatchWithUser = async (userId, params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/matches/users/${userId}`, {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const refreshUserMatch = async (userId, params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post(`/matches/users/${userId}/refresh`, null, {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const getRecommendations = async (params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/matches/places", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/zyra/index.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createSession",
    ()=>createSession,
    "createSuggestion",
    ()=>createSuggestion,
    "deleteAllSessions",
    ()=>deleteAllSessions,
    "deleteSession",
    ()=>deleteSession,
    "getChatRecap",
    ()=>getChatRecap,
    "getMessages",
    ()=>getMessages,
    "getPlaceRecap",
    ()=>getPlaceRecap,
    "getProfileRecap",
    ()=>getProfileRecap,
    "getProfileRecapForUser",
    ()=>getProfileRecapForUser,
    "getSessions",
    ()=>getSessions,
    "getSuggestions",
    ()=>getSuggestions,
    "getTestRecap",
    ()=>getTestRecap,
    "interpretBirthChart",
    ()=>interpretBirthChart,
    "regenerateProfileRecap",
    ()=>regenerateProfileRecap,
    "sendMessage",
    ()=>sendMessage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/axiosConfig.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/utils/queryParams.ts [app-client] (ecmascript)");
;
;
const createSession = async ()=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/zyra/sessions");
    return data;
};
const CHAT_TIMEOUT_MS = 60000;
const getSessions = async (params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/zyra/sessions", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const getMessages = async (sessionId, params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/zyra/sessions/${sessionId}/messages`, {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const sendMessage = async (sessionId, payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post(`/zyra/sessions/${sessionId}/messages`, payload, {
        timeout: CHAT_TIMEOUT_MS
    });
    return data;
};
const deleteSession = async (sessionId)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].delete(`/zyra/sessions/${sessionId}`);
};
const deleteAllSessions = async ()=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].delete("/zyra/sessions");
};
const getSuggestions = async (params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/zyra/suggestions", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const createSuggestion = async (payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/zyra/suggestions", payload);
    return data;
};
/** Viewer's language for recap (e.g. "en"). Always send so backend returns recap in viewer's language. */ const recapLanguageHeader = (language)=>({
        "Accept-Language": language && language.trim() ? language.trim() : "en"
    });
const getProfileRecap = async (language)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/zyra/profile-recap", {
        timeout: CHAT_TIMEOUT_MS,
        headers: recapLanguageHeader(language)
    });
    return data;
};
const regenerateProfileRecap = async (language)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/zyra/profile-recap/regenerate", {}, {
        timeout: CHAT_TIMEOUT_MS,
        headers: recapLanguageHeader(language)
    });
    return data;
};
const getProfileRecapForUser = async (userId, language)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/zyra/profile-recap/${userId}`, {
        timeout: CHAT_TIMEOUT_MS,
        headers: recapLanguageHeader(language)
    });
    return data;
};
const getPlaceRecap = async (placeId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/zyra/place-recap/${placeId}`, {
        timeout: CHAT_TIMEOUT_MS
    });
    return data;
};
const getChatRecap = async ()=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/zyra/chat-recap", {
        timeout: CHAT_TIMEOUT_MS
    });
    return data;
};
const getTestRecap = async (submissionId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/zyra/test-recap/${submissionId}`, {
        timeout: CHAT_TIMEOUT_MS
    });
    return data;
};
const interpretBirthChart = async (payload, language)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/zyra/interpret-birth-chart", payload, {
        timeout: CHAT_TIMEOUT_MS,
        headers: recapLanguageHeader(language)
    });
    return data;
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/analytics/index.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "trackEventsBatch",
    ()=>trackEventsBatch
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/axiosConfig.ts [app-client] (ecmascript)");
;
const trackEventsBatch = async (payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/analytics/events/batch", payload);
    return data;
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/admin/auth.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAdminLanguage",
    ()=>getAdminLanguage,
    "getAdminMe",
    ()=>getAdminMe,
    "loginAdmin",
    ()=>loginAdmin,
    "logoutAdmin",
    ()=>logoutAdmin,
    "refreshAdminToken",
    ()=>refreshAdminToken,
    "registerAdmin",
    ()=>registerAdmin,
    "updateAdminLanguage",
    ()=>updateAdminLanguage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/axiosConfig.ts [app-client] (ecmascript)");
;
const loginAdmin = async (payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/auth/admin/login", payload);
    return data;
};
const registerAdmin = async (payload, bootstrapSecret)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/auth/admin/register", payload, {
        headers: bootstrapSecret ? {
            "X-Admin-Bootstrap": bootstrapSecret
        } : undefined
    });
    return data;
};
const refreshAdminToken = async (payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/auth/admin/refresh", payload);
    return data;
};
const logoutAdmin = async ()=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/auth/admin/logout");
};
const getAdminMe = async ()=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/auth/admin/me");
    return data;
};
const getAdminLanguage = async ()=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/auth/admin/language");
    return data;
};
const updateAdminLanguage = async (payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].patch("/auth/admin/language", payload);
    return data;
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/admin/backoffice.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createAdmin",
    ()=>createAdmin,
    "createUser",
    ()=>createUser,
    "deleteAdmin",
    ()=>deleteAdmin,
    "deleteUser",
    ()=>deleteUser,
    "getAdminUser",
    ()=>getAdminUser,
    "getAdminUsers",
    ()=>getAdminUsers,
    "getSupportMessages",
    ()=>getSupportMessages,
    "getUser",
    ()=>getUser,
    "getUserPreferences",
    ()=>getUserPreferences,
    "getUserProfile",
    ()=>getUserProfile,
    "getUserTestsCount",
    ()=>getUserTestsCount,
    "getUsers",
    ()=>getUsers,
    "sendUserPasswordResetLink",
    ()=>sendUserPasswordResetLink,
    "updateAdmin",
    ()=>updateAdmin,
    "updateUser",
    ()=>updateUser,
    "updateUserMatchmakingPreferences",
    ()=>updateUserMatchmakingPreferences,
    "updateUserPassword",
    ()=>updateUserPassword
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/axiosConfig.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/utils/queryParams.ts [app-client] (ecmascript)");
;
;
const getUsers = async (params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/admin/users", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const getUser = async (userId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/admin/users/${userId}`);
    return data;
};
const getUserProfile = async (userId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/admin/users/${userId}/profile`);
    return data;
};
const getUserTestsCount = async (userId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/admin/users/${userId}/tests/count`);
    return data;
};
const getUserPreferences = async (userId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/admin/users/${userId}/preferences`);
    return data;
};
const updateUserMatchmakingPreferences = async (userId, payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].put(`/admin/users/${userId}/preferences/matchmaking`, payload);
    return data;
};
const createUser = async (payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/admin/users", payload);
    return data;
};
const updateUser = async (userId, payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].patch(`/admin/users/${userId}`, payload);
    return data;
};
const deleteUser = async (userId)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].delete(`/admin/users/${userId}`);
};
const updateUserPassword = async (userId, payload)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].patch(`/admin/users/${userId}/password`, payload);
};
const sendUserPasswordResetLink = async (userId)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post(`/admin/users/${userId}/password/reset-link`);
};
const getAdminUsers = async (params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/admin/admin-users", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const getAdminUser = async (adminId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/admin/admin-users/${adminId}`);
    return data;
};
const createAdmin = async (payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/admin/admin-users", payload);
    return data;
};
const updateAdmin = async (adminId, payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].patch(`/admin/admin-users/${adminId}`, payload);
    return data;
};
const deleteAdmin = async (adminId)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].delete(`/admin/admin-users/${adminId}`);
};
const getSupportMessages = async (params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/admin/support/messages", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/admin/catalog.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createAdminCategory",
    ()=>createAdminCategory,
    "createAdminExperience",
    ()=>createAdminExperience,
    "createAdminPlace",
    ()=>createAdminPlace,
    "createExperienceAffiliation",
    ()=>createExperienceAffiliation,
    "createPlaceAffiliation",
    ()=>createPlaceAffiliation,
    "deleteAdminCategory",
    ()=>deleteAdminCategory,
    "deleteAdminExperience",
    ()=>deleteAdminExperience,
    "deleteAdminPlace",
    ()=>deleteAdminPlace,
    "deleteExperienceAffiliation",
    ()=>deleteExperienceAffiliation,
    "deletePlaceAffiliation",
    ()=>deletePlaceAffiliation,
    "getAdminCategories",
    ()=>getAdminCategories,
    "getAdminExperience",
    ()=>getAdminExperience,
    "getAdminExperiences",
    ()=>getAdminExperiences,
    "getAdminPlace",
    ()=>getAdminPlace,
    "getAdminPlaces",
    ()=>getAdminPlaces,
    "getExperienceAffiliations",
    ()=>getExperienceAffiliations,
    "getPlaceAffiliations",
    ()=>getPlaceAffiliations,
    "updateAdminCategory",
    ()=>updateAdminCategory,
    "updateAdminExperience",
    ()=>updateAdminExperience,
    "updateAdminPlace",
    ()=>updateAdminPlace,
    "updateExperienceAffiliation",
    ()=>updateExperienceAffiliation,
    "updatePlaceAffiliation",
    ()=>updatePlaceAffiliation
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/axiosConfig.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/utils/queryParams.ts [app-client] (ecmascript)");
;
;
const getAdminCategories = async (params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/admin/categories", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const createAdminCategory = async (payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/admin/categories", payload);
    return data;
};
const updateAdminCategory = async (categoryId, payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].put(`/admin/categories/${categoryId}`, payload);
    return data;
};
const deleteAdminCategory = async (categoryId)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].delete(`/admin/categories/${categoryId}`);
};
const getAdminPlaces = async (params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/admin/places", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const getAdminPlace = async (placeId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/admin/places/${placeId}`);
    return data;
};
const createAdminPlace = async (payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/admin/places", payload);
    return data;
};
const updateAdminPlace = async (placeId, payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].put(`/admin/places/${placeId}`, payload);
    return data;
};
const deleteAdminPlace = async (placeId)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].delete(`/admin/places/${placeId}`);
};
const getPlaceAffiliations = async (placeId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/admin/places/${placeId}/affiliations`);
    return data;
};
const createPlaceAffiliation = async (placeId, payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post(`/admin/places/${placeId}/affiliations`, payload);
    return data;
};
const updatePlaceAffiliation = async (placeId, affiliationId, payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].put(`/admin/places/${placeId}/affiliations/${affiliationId}`, payload);
    return data;
};
const deletePlaceAffiliation = async (placeId, affiliationId)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].delete(`/admin/places/${placeId}/affiliations/${affiliationId}`);
};
const getAdminExperiences = async (params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/admin/experiences", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const getAdminExperience = async (experienceId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/admin/experiences/${experienceId}`);
    return data;
};
const createAdminExperience = async (payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/admin/experiences", payload);
    return data;
};
const updateAdminExperience = async (experienceId, payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].put(`/admin/experiences/${experienceId}`, payload);
    return data;
};
const deleteAdminExperience = async (experienceId)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].delete(`/admin/experiences/${experienceId}`);
};
const getExperienceAffiliations = async (experienceId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/admin/experiences/${experienceId}/affiliations`);
    return data;
};
const createExperienceAffiliation = async (experienceId, payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post(`/admin/experiences/${experienceId}/affiliations`, payload);
    return data;
};
const updateExperienceAffiliation = async (experienceId, affiliationId, payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].put(`/admin/experiences/${experienceId}/affiliations/${affiliationId}`, payload);
    return data;
};
const deleteExperienceAffiliation = async (experienceId, affiliationId)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].delete(`/admin/experiences/${experienceId}/affiliations/${affiliationId}`);
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/admin/insights.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "autoTranslateAdminTest",
    ()=>autoTranslateAdminTest,
    "autoTranslateAllAdminTest",
    ()=>autoTranslateAllAdminTest,
    "createAdminAnswerOption",
    ()=>createAdminAnswerOption,
    "createAdminQuestion",
    ()=>createAdminQuestion,
    "createAdminTest",
    ()=>createAdminTest,
    "deleteAdminAnswerOption",
    ()=>deleteAdminAnswerOption,
    "deleteAdminQuestion",
    ()=>deleteAdminQuestion,
    "deleteAdminTest",
    ()=>deleteAdminTest,
    "getAdminTest",
    ()=>getAdminTest,
    "getAdminTestTranslations",
    ()=>getAdminTestTranslations,
    "getAdminTests",
    ()=>getAdminTests,
    "updateAdminAnswerOption",
    ()=>updateAdminAnswerOption,
    "updateAdminQuestion",
    ()=>updateAdminQuestion,
    "updateAdminTest",
    ()=>updateAdminTest,
    "upsertAdminTestTranslations",
    ()=>upsertAdminTestTranslations
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/axiosConfig.ts [app-client] (ecmascript)");
;
const AUTO_TRANSLATE_SINGLE_TIMEOUT_MS = 10 * 60 * 1000;
const AUTO_TRANSLATE_ALL_TIMEOUT_MS = 20 * 60 * 1000;
const getAdminTests = async ()=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/admin/tests");
    return data;
};
const getAdminTest = async (testId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/admin/tests/${testId}`);
    return data;
};
const createAdminTest = async (payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/admin/tests", payload);
    return data;
};
const updateAdminTest = async (testId, payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].put(`/admin/tests/${testId}`, payload);
    return data;
};
const deleteAdminTest = async (testId)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].delete(`/admin/tests/${testId}`);
};
const createAdminQuestion = async (testId, payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post(`/admin/tests/${testId}/questions`, payload);
    return data;
};
const updateAdminQuestion = async (testId, questionId, payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].put(`/admin/tests/${testId}/questions/${questionId}`, payload);
    return data;
};
const deleteAdminQuestion = async (testId, questionId)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].delete(`/admin/tests/${testId}/questions/${questionId}`);
};
const createAdminAnswerOption = async (testId, questionId, payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post(`/admin/tests/${testId}/questions/${questionId}/options`, payload);
    return data;
};
const updateAdminAnswerOption = async (testId, questionId, optionId, payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].put(`/admin/tests/${testId}/questions/${questionId}/options/${optionId}`, payload);
    return data;
};
const deleteAdminAnswerOption = async (testId, questionId, optionId)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].delete(`/admin/tests/${testId}/questions/${questionId}/options/${optionId}`);
};
const getAdminTestTranslations = async (testId, locale)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/admin/tests/${testId}/translations/${locale}`);
    return data;
};
const upsertAdminTestTranslations = async (testId, locale, payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].put(`/admin/tests/${testId}/translations/${locale}`, payload);
    return data;
};
const autoTranslateAdminTest = async (testId, locale)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post(`/admin/tests/${testId}/translations/${locale}/auto`, null, {
        timeout: AUTO_TRANSLATE_SINGLE_TIMEOUT_MS
    });
    return data;
};
const autoTranslateAllAdminTest = async (testId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post(`/admin/tests/${testId}/translations/auto-all`, null, {
        timeout: AUTO_TRANSLATE_ALL_TIMEOUT_MS
    });
    return data;
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/admin/analytics.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getKpis",
    ()=>getKpis,
    "refreshKpis",
    ()=>refreshKpis
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/axiosConfig.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/utils/queryParams.ts [app-client] (ecmascript)");
;
;
const getKpis = async (params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/admin/analytics", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const refreshKpis = async (params = {})=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/admin/analytics/refresh", null, {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/admin/referrals.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getReferralCodes",
    ()=>getReferralCodes,
    "getReferralDetail",
    ()=>getReferralDetail,
    "getReferralUsages",
    ()=>getReferralUsages
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/axiosConfig.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/utils/queryParams.ts [app-client] (ecmascript)");
;
;
const getReferralCodes = async (params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/admin/referrals", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const getReferralDetail = async (code)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/admin/referrals/${encodeURIComponent(code)}`);
    return data;
};
const getReferralUsages = async (code, params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/admin/referrals/${encodeURIComponent(code)}/usages`, {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/admin/notifications.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createCustomNotifications",
    ()=>createCustomNotifications,
    "getNotificationCampaignHistory",
    ()=>getNotificationCampaignHistory,
    "getNotificationCampaignStats",
    ()=>getNotificationCampaignStats,
    "searchNotificationRecipients",
    ()=>searchNotificationRecipients
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/axiosConfig.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/utils/queryParams.ts [app-client] (ecmascript)");
;
;
const createCustomNotifications = async (payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/admin/notifications", payload);
    return data;
};
const searchNotificationRecipients = async (params)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/admin/notifications/recipients/search", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const getNotificationCampaignStats = async (campaignId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get(`/admin/notifications/campaigns/${campaignId}/stats`);
    return data;
};
const getNotificationCampaignHistory = async (params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/admin/notifications/campaigns", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/admin/sync.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getGoogleMapsSyncStatus",
    ()=>getGoogleMapsSyncStatus,
    "getViatorSyncStatus",
    ()=>getViatorSyncStatus,
    "syncGoogleMapsNearby",
    ()=>syncGoogleMapsNearby,
    "syncGoogleMapsPlace",
    ()=>syncGoogleMapsPlace,
    "syncGoogleMapsSearch",
    ()=>syncGoogleMapsSearch,
    "syncViatorProducts",
    ()=>syncViatorProducts
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/axiosConfig.ts [app-client] (ecmascript)");
;
const getGoogleMapsSyncStatus = async ()=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/admin/sync/google-maps/status");
    return data;
};
const syncGoogleMapsNearby = async (payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/admin/sync/google-maps/nearby", payload);
    return data;
};
const syncGoogleMapsSearch = async (payload)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/admin/sync/google-maps/search", payload);
    return data;
};
const syncGoogleMapsPlace = async (googlePlaceId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post(`/admin/sync/google-maps/place/${encodeURIComponent(googlePlaceId)}`);
    return data;
};
const getViatorSyncStatus = async ()=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/admin/sync/viator/status");
    return data;
};
const syncViatorProducts = async (payload = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/admin/sync/viator/products", payload);
    return data;
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/admin/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$admin$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/admin/auth.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$admin$2f$backoffice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/admin/backoffice.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$admin$2f$catalog$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/admin/catalog.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$admin$2f$insights$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/admin/insights.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$admin$2f$analytics$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/admin/analytics.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$admin$2f$referrals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/admin/referrals.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$admin$2f$notifications$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/admin/notifications.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$admin$2f$sync$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/admin/sync.ts [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/notifications/index.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getNotificationUnreadCount",
    ()=>getNotificationUnreadCount,
    "getNotifications",
    ()=>getNotifications,
    "markAllNotificationsAsRead",
    ()=>markAllNotificationsAsRead,
    "markNotificationAsRead",
    ()=>markNotificationAsRead
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/axiosConfig.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/utils/queryParams.ts [app-client] (ecmascript)");
;
;
const getNotifications = async (params = {})=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/notifications", {
        params: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$utils$2f$queryParams$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQueryParams"])(params)
    });
    return data;
};
const getNotificationUnreadCount = async ()=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].get("/notifications/unread-count");
    return data;
};
const markNotificationAsRead = async (notificationId)=>{
    const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].patch(`/notifications/${notificationId}/read`);
    return data;
};
const markAllNotificationsAsRead = async ()=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/notifications/read-all");
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/search/index.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "globalSearch",
    ()=>globalSearch
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$catalog$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/catalog/index.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$social$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/social/index.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$users$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/users/index.ts [app-client] (ecmascript)");
;
;
;
const globalSearch = async (params)=>{
    const { q, limit = 5 } = params;
    const normalizedQuery = q.trim();
    if (!normalizedQuery || normalizedQuery.length < 2) {
        return {
            places: [],
            experiences: [],
            users: [],
            posts: []
        };
    }
    const isEmailQuery = normalizedQuery.includes("@");
    if (isEmailQuery) {
        const usersResult = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$users$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["searchUsers"])({
            q: normalizedQuery,
            size: limit
        });
        return {
            places: [],
            experiences: [],
            users: usersResult.content,
            posts: []
        };
    }
    const [placesResult, usersResult, postsResult] = await Promise.allSettled([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$catalog$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPlaces"])({
            q: normalizedQuery,
            size: limit
        }),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$users$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["searchUsers"])({
            q: normalizedQuery,
            size: limit
        }),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$social$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["searchPosts"])({
            q: normalizedQuery,
            size: limit
        })
    ]);
    return {
        places: placesResult.status === "fulfilled" ? placesResult.value.content : [],
        experiences: [],
        users: usersResult.status === "fulfilled" ? usersResult.value.content : [],
        posts: postsResult.status === "fulfilled" ? postsResult.value.content : []
    };
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/feedback/index.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "submitEarlyAccessFeedback",
    ()=>submitEarlyAccessFeedback
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/services/axiosConfig.ts [app-client] (ecmascript)");
;
const submitEarlyAccessFeedback = async (payload)=>{
    await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$services$2f$axiosConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiClient"].post("/feedback/early-access", payload);
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/i18n/runtimeLocale.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getRuntimeBcp47",
    ()=>getRuntimeBcp47,
    "getRuntimeLocale",
    ()=>getRuntimeLocale
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$stores$2f$user$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/stores/user/userStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$i18n$2f$locales$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/i18n/locales.ts [app-client] (ecmascript)");
;
;
const getRuntimeLocale = ()=>{
    const fromStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$i18n$2f$locales$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["normalizeLocale"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$stores$2f$user$2f$userStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["userStore"].getState().language);
    return fromStore ?? __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$i18n$2f$locales$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_LOCALE"];
};
const getRuntimeBcp47 = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Personal__Workspace$2f$CODE$2f$syncro$2f$frontend$2f$src$2f$i18n$2f$locales$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toBcp47"])(getRuntimeLocale());
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/Personal Workspace/CODE/syncro/frontend/src/utils/notificationDisplay.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getNotificationDisplay",
    ()=>getNotificationDisplay
]);
function getActorDisplayName(data, t) {
    const name = data?.actorDisplayName;
    if (typeof name === "string" && name.trim().length > 0) {
        return name.trim();
    }
    return t("A user");
}
function getNotificationDisplay(notification, t) {
    const { type, title: storedTitle, body: storedBody, data } = notification;
    const actor = getActorDisplayName(data ?? null, t);
    switch(type){
        case "MESSAGE":
            return {
                title: t("New message"),
                body: storedBody?.trim() ?? ""
            };
        case "CONNECTION_REQUEST_RECEIVED":
            return {
                title: t("New connection request"),
                body: t("{actor} sent you a connection request.", {
                    actor
                })
            };
        case "CONNECTION_REQUEST_ACCEPTED":
            return {
                title: t("Request accepted"),
                body: t("{actor} accepted your connection request.", {
                    actor
                })
            };
        case "CONNECTION_REQUEST_REJECTED":
            return {
                title: t("Request rejected"),
                body: t("{actor} rejected your connection request.", {
                    actor
                })
            };
        case "POST_LIKE":
            return {
                title: t("New like"),
                body: t("{actor} liked your post.", {
                    actor
                })
            };
        case "POST_COMMENT":
            return {
                title: t("New comment"),
                body: t("{actor} commented on your post.", {
                    actor
                })
            };
        default:
            return {
                title: storedTitle?.trim() || t("Notification"),
                body: storedBody?.trim() ?? ""
            };
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=Desktop_Personal%20Workspace_CODE_syncro_frontend_src_2fcc2fc1._.js.map