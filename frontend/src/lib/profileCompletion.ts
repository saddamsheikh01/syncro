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
  /** Completed insight tests (from API). */
  testsCompleted: number;
  /** Total insight tests (from API). Does not include birth chart. */
  testsTotal: number;
  /** Whether the user has completed the birth chart (astrology) insight. */
  hasBirthChart: boolean;
  /** Whether the user has set their username (account handle). */
  hasUsername: boolean;
}

export interface CategoryScore {
  weight: number;
  ratio: number;
  points: number;
}

/** Category keys used for "what's missing" suggestions. */
export type ProfileCompletionCategoryKey =
  | "profilePhoto"
  | "profileFields"
  | "userName"
  | "interests"
  | "insights";

export interface ProfileCompletionResult {
  percentage: number;
  categories: Record<ProfileCompletionCategoryKey, CategoryScore>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const MIN_INTERESTS = 3;

/** Profile fields count as complete when core identity fields are filled (name is separate; bio is not required). */
function isProfileFieldsComplete(profileFields: ProfileCompletionInput["profileFields"]): boolean {
  const hasBirthDate = Boolean(profileFields.birthDate?.trim());
  const hasLocation = Boolean(profileFields.city?.trim() || profileFields.country?.trim());
  return hasBirthDate && hasLocation;
}

function isUserNameComplete(
  profileFields: ProfileCompletionInput["profileFields"],
  hasUsername: boolean,
): boolean {
  return Boolean(profileFields.fullName?.trim()) || hasUsername;
}

function isInterestsComplete(interestCount: number): boolean {
  return interestCount >= MIN_INTERESTS;
}

const makeCategory = (weight: number, ratio: number): CategoryScore => ({
  weight,
  ratio,
  points: Math.round(weight * ratio * 100) / 100,
});

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

/**
 * Profile completion = Profile (photo, editable fields, interests) + Tests/Insights (all tests + birth chart).
 * Each part contributes to the percentage; missing items are exposed in categories for the UI.
 */
export const calculateProfileCompletion = (
  input: ProfileCompletionInput,
): ProfileCompletionResult => {
  const totalProfileItems = 4; // photo, fields, user name, interests
  const totalInsightItems = input.testsTotal + 1; // all tests + birth chart (birth chart counts as one insight)
  const totalItems = totalProfileItems + totalInsightItems;

  const profilePhotoRatio = input.hasAvatar ? 1 : 0;
  const profileFieldsRatio = isProfileFieldsComplete(input.profileFields) ? 1 : 0;
  const userNameRatio = isUserNameComplete(input.profileFields, input.hasUsername) ? 1 : 0;
  const interestsRatio = isInterestsComplete(input.interestCount) ? 1 : 0;

  const insightsCompleted = input.testsCompleted + (input.hasBirthChart ? 1 : 0);
  const insightsRatio =
    totalInsightItems > 0 ? insightsCompleted / totalInsightItems : 1;

  const weightPhoto = 1;
  const weightFields = 1;
  const weightUserName = 1;
  const weightInterests = 1;
  const weightInsights = totalInsightItems;

  const categories: Record<ProfileCompletionCategoryKey, CategoryScore> = {
    profilePhoto: makeCategory(weightPhoto, profilePhotoRatio),
    profileFields: makeCategory(weightFields, profileFieldsRatio),
    userName: makeCategory(weightUserName, userNameRatio),
    interests: makeCategory(weightInterests, interestsRatio),
    insights: makeCategory(weightInsights, insightsRatio),
  };

  const totalPoints =
    categories.profilePhoto.points +
    categories.profileFields.points +
    categories.userName.points +
    categories.interests.points +
    categories.insights.points;

  const percentage = Math.min(
    100,
    Math.max(0, Math.round((totalPoints / totalItems) * 100)),
  );

  return {
    percentage,
    categories,
  };
};
