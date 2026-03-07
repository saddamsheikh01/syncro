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
  hasPosition: boolean;
  /** Completed insight tests (from API). */
  testsCompleted: number;
  /** Total insight tests (from API). Does not include birth chart. */
  testsTotal: number;
  /** Whether the user has completed the birth chart (astrology) insight. */
  hasBirthChart: boolean;
}

export interface CategoryScore {
  weight: number;
  ratio: number;
  points: number;
}

export interface ProfileCompletionResult {
  percentage: number;
  /** Only insight categories (tests + birth chart); profile/interests/avatar/location are excluded. */
  categories: {
    tests: CategoryScore;
    astrology: CategoryScore;
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Total insight items = API tests + birth chart. */
const totalInsightItems = (testsTotal: number) => testsTotal + 1;

/** Weight for tests category so tests + astrology weights sum to 100. */
const testsWeight = (testsTotal: number) =>
  testsTotal > 0 ? (100 * testsTotal) / totalInsightItems(testsTotal) : 0;

/** Weight for birth chart category. */
const astrologyWeight = (testsTotal: number) =>
  100 / Math.max(1, totalInsightItems(testsTotal));

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
  const total = totalInsightItems(input.testsTotal);
  const wTests = testsWeight(input.testsTotal);
  const wAstrology = astrologyWeight(input.testsTotal);

  const testsRatio =
    input.testsTotal > 0 ? input.testsCompleted / input.testsTotal : 0;
  const astrologyRatio = input.hasBirthChart ? 1 : 0;

  const categories = {
    tests: makeCategory(wTests, testsRatio),
    astrology: makeCategory(wAstrology, astrologyRatio),
  };

  const totalPoints = categories.tests.points + categories.astrology.points;
  const rawPercentage = Math.round(totalPoints);
  const allComplete =
    (input.testsTotal === 0 || testsRatio >= 1) && astrologyRatio >= 1;
  const percentage = Math.min(
    100,
    Math.max(0, allComplete ? 100 : rawPercentage),
  );

  return {
    percentage,
    categories,
  };
};
