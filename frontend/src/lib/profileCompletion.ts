/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ProfileCompletionInput {
  profileFields: {
    fullName: string | null;
    birthDate: string | null;
    city: string | null;
    country: string | null;
    jobTitle: string | null;
    companyName: string | null;
    bio: string | null;
    traitsText: string | null;
    lovesText: string | null;
    dislikesText: string | null;
    goalsText: string | null;
    valuesText: string | null;
    relationshipStatus: string | null;
    orientation: string | null;
    childrenStatus: string | null;
  };
  hasAvatar: boolean;
  interestCount: number;
  matchmakingFilterValues: {
    ageMin: number | null;
    ageMax: number | null;
    distanceKm: number | null;
    gender: string | null;
  };
  hasPosition: boolean;
  testsCompleted: number;
  testsTotal: number;
}

export interface CategoryScore {
  weight: number;
  ratio: number;
  points: number;
}

export interface ProfileCompletionResult {
  percentage: number;
  categories: {
    tests: CategoryScore;
    profile: CategoryScore;
    interests: CategoryScore;
    avatar: CategoryScore;
    preferences: CategoryScore;
    location: CategoryScore;
  };
}

/* ------------------------------------------------------------------ */
/*  Weights                                                            */
/* ------------------------------------------------------------------ */

const WEIGHTS = {
  tests: 30,
  profile: 30,
  interests: 15,
  avatar: 10,
  preferences: 10,
  location: 5,
} as const;

const INTEREST_THRESHOLD = 3;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const isFilled = (value: string | null | undefined): boolean =>
  typeof value === "string" && value.trim().length > 0;

const makeCategory = (weight: number, ratio: number): CategoryScore => ({
  weight,
  ratio,
  points: Math.round(weight * ratio * 100) / 100,
});

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

export const calculateProfileCompletion = (
  input: ProfileCompletionInput,
): ProfileCompletionResult => {
  // Tests (30%)
  const testsRatio =
    input.testsTotal > 0 ? input.testsCompleted / input.testsTotal : 0;

  // Profile fields (30%)
  const fieldValues = Object.values(input.profileFields);
  const filledCount = fieldValues.filter(isFilled).length;
  const profileRatio = fieldValues.length > 0 ? filledCount / fieldValues.length : 0;

  // Interests (15%)
  const interestsRatio = Math.min(input.interestCount / INTEREST_THRESHOLD, 1);

  // Avatar (10%)
  const avatarRatio = input.hasAvatar ? 1 : 0;

  // Preferences (10%)
  const filterValues = input.matchmakingFilterValues;
  const filledFilters = (
    ["ageMin", "ageMax", "distanceKm", "gender"] as const
  ).filter((key) => filterValues[key] !== null && filterValues[key] !== undefined).length;
  const preferencesRatio = filledFilters / 4;

  // Location (5%)
  const locationRatio = input.hasPosition ? 1 : 0;

  // Build result
  const categories = {
    tests: makeCategory(WEIGHTS.tests, testsRatio),
    profile: makeCategory(WEIGHTS.profile, profileRatio),
    interests: makeCategory(WEIGHTS.interests, interestsRatio),
    avatar: makeCategory(WEIGHTS.avatar, avatarRatio),
    preferences: makeCategory(WEIGHTS.preferences, preferencesRatio),
    location: makeCategory(WEIGHTS.location, locationRatio),
  };

  const totalPoints = Object.values(categories).reduce(
    (sum, cat) => sum + cat.points,
    0,
  );

  const rawPercentage = Math.round(totalPoints);
  const percentage = Math.min(100, Math.max(0, rawPercentage));

  return {
    percentage,
    categories,
  };
};