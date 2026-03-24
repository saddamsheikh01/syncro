// ─── Anonymous Session ───────────────────────────────────────────────────────

export type SessionStatus = "IN_PROGRESS" | "COMPLETED" | "CONVERTED" | "EXPIRED";

export interface SessionAnswer {
  id: string;
  questionGroup: string;
  questionKey: string;
  answerValue: unknown;
  version: number;
  answeredAt: string;
}

export interface AnonymousSession {
  id: string;
  sessionToken: string;
  status: SessionStatus;
  currentStep: number;
  totalSteps: number;
  userType: string | null;
  expiresAt: string;
  lastSeenAt: string;
  answers: SessionAnswer[];
}

export interface CreateSessionRequest {
  metadata?: {
    device?: string;
    referrer?: string;
    userAgent?: string;
  };
}

export interface SaveAnswerRequest {
  stepNumber: number;
  questionGroup: "CITY_FIT" | "POSITIONING" | "EXECUTION";
  questionKey: string;
  answerValue: unknown;
}

export interface ConvertSessionRequest {
  sessionToken: string;
}

// ─── Relocation Onboarding ───────────────────────────────────────────────────

export type OnboardingStatus = "IN_PROGRESS" | "COMPLETED";
export type UserType = "planning_move" | "chosen_city" | "already_in_city";
export type Household = "alone" | "with_partner" | "with_children";
export type PrimaryGoal =
  | "career_growth"
  | "remote_work"
  | "study"
  | "lifestyle"
  | "family_stability"
  | "personal_reset";
export type DesiredLifestyle = "essential" | "balanced" | "comfort" | "experience";
export type WorkStatus =
  | "employed"
  | "freelancer"
  | "entrepreneur"
  | "student"
  | "not_working";
export type PriorityProblem =
  | "housing"
  | "neighborhood"
  | "cost_of_living"
  | "professional_network"
  | "friendships"
  | "schools_family"
  | "bureaucracy"
  | "career_opportunities";

export interface OnboardingResponse {
  id: string;
  userType: UserType | null;
  targetCityName: string | null;
  targetCountry: string | null;
  targetCityId: string | null;
  currentCityName: string | null;
  currentCityId: string | null;
  household: Household | null;
  hasPets: boolean | null;
  childrenAgeRange: string | null;
  monthlyBudget: number | null;
  primaryGoal: PrimaryGoal | null;
  socialPriority: string | null;
  desiredLifestyle: DesiredLifestyle | null;
  workStatus: WorkStatus | null;
  isRemote: boolean | null;
  priorityProblem: PriorityProblem | null;
  freeNotes: string | null;
  completedSteps: number;
  completionPercent: number;
  status: OnboardingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingStatusResponse {
  status: OnboardingStatus;
  completedSteps: number;
  completionPercent: number;
  userType: UserType | null;
  hasActiveSnapshot: boolean;
  latestSnapshotVersion: number | null;
  updatedAt: string;
}

export interface ActivationStateResponse {
  status: OnboardingStatus;
  userType: UserType | null;
  completedSteps: number;
  totalSteps: number;
  completionPercent: number;
  completedFields: string[];
  missingFields: string[];
  nextActions: { action: string; description: string }[];
  hasActiveSnapshot: boolean;
  hasScoringResults: boolean;
  updatedAt: string;
}

export interface PatchOnboardingRequest {
  userType?: UserType;
  targetCityId?: string;
  targetCityName?: string;
  currentCityId?: string;
  currentCityName?: string;
  household?: Household;
  hasPets?: boolean;
  monthlyBudget?: number;
  primaryGoal?: PrimaryGoal;
  desiredLifestyle?: DesiredLifestyle;
  workStatus?: WorkStatus;
  isRemote?: boolean;
  priorityProblem?: PriorityProblem;
  socialPriority?: string;
  freeNotes?: string;
  completedSteps?: number;
}

// ─── Snapshots ───────────────────────────────────────────────────────────────

export interface SnapshotResponse {
  id: string;
  version: number;
  isActive: boolean;
  payload: Partial<OnboardingResponse>;
  createdAt: string;
}

// ─── City Catalog ─────────────────────────────────────────────────────────────

export interface CityListItem {
  id: string;
  cityName: string;
  citySlug: string;
  country: string;
  countryCode: string;
  macroCostoVita: number;
  macroMercatoImmobiliare: number;
  macroPoterEconomico: number;
  macroQualitaVita: number;
  macroOpportunitaLavorative: number;
  macroIntegrazioneSociale: number;
  active: boolean;
}

export interface CityDetail extends CityListItem {
  expatCommunityIndex: number;
  socialIntegrationIndex: number;
  careerOpportunityIndex: number;
  remoteWorkEcosystemIndex: number;
  rentIndex: number;
  purchasingPowerIndex: number;
  groceriesIndex: number;
  restaurantIndex: number;
  costOfLivingExRentIndex: number;
  costOfLivingIncRentIndex: number;
  priceToIncomeRatio: number;
  priceToRentCityCenterRatio: number;
  safetyIndex: number;
  healthcareIndex: number;
  climateIndex: number;
  pollutionIndex: number;
  trafficCommuteIndex: number;
  apartment1brCenter: number;
  apartment3brCenter: number;
  costSingleNoRent: number;
  costFamilyNoRent: number;
  districts: { name: string; description: string }[];
  createdAt: string;
  updatedAt: string;
}

// ─── City Scoring ─────────────────────────────────────────────────────────────

export type AnalysisType =
  | "CITY_RANKING"
  | "CHOSEN_CITY_ANALYSIS"
  | "INTEGRATION_ANALYSIS";

export type CompatibilityLevel =
  | "VERY_STRONG_FIT"
  | "GOOD_FIT"
  | "MODERATE_FIT"
  | "WEAK_FIT"
  | "LOW_FIT";

export interface MacroareeScores {
  costo_vita: number;
  mercato_immobiliare: number;
  potere_economico: number;
  qualita_vita: number;
  opportunita_lavorative: number;
  integrazione_sociale: number;
}

/** Backend sends marginStatus: sustainable | tight | very_tight | unsustainable. */
export type BudgetMarginStatus =
  | "sustainable"
  | "tight"
  | "very_tight"
  | "unsustainable";

export interface BudgetCheck {
  declaredBudget: number;
  /** Backend key (post budget-margin fix). */
  estimatedCityCost?: number;
  /** Legacy / display alias. */
  estimatedCost?: number;
  baseCityCost?: number;
  margin: number;
  /** Backend key (post budget-margin fix). */
  marginStatus?: BudgetMarginStatus;
  /** Legacy / display alias. */
  classification?: "sustainable" | "tight" | "over_budget";
  lifestyleMultiplier: number;
  isFamily?: boolean;
  suggestions?: string[];
}

/** Backend returns breakdown/userWeights/radarValues as Map; keys match MacroareeScores. */
export type MacroareeMap = Partial<Record<keyof MacroareeScores, number>>;

/** Backend insights: optional arrays or nested structure. */
export interface ScoreInsights {
  strengths?: string[];
  warnings?: string[];
  suggestions?: string[];
  insights?: string[];
  [key: string]: unknown;
}

export interface CityScoreResponse {
  id: string;
  snapshotId: string;
  cityId: string;
  cityName: string;
  country: string;
  analysisType: AnalysisType;
  scoreTotal: number;
  compatibilityLevel: CompatibilityLevel;
  breakdown: MacroareeScores | MacroareeMap;
  userWeights: MacroareeScores | MacroareeMap;
  userPriorityClassification: Partial<Record<keyof MacroareeScores, string>> | Record<string, string>;
  radarValues: MacroareeScores | MacroareeMap;
  budgetCheck: BudgetCheck | null;
  integrationBreakdown: unknown | null;
  insights: ScoreInsights | null;
  algorithmVersion: string;
  rankingPosition: number | null;
  computedAt: string;
}

export interface ComputeScoringRequest {
  targetCityId?: string | null;
  analysisType?: AnalysisType;
}

export interface ScoringResultResponse {
  snapshotId: string;
  analysisType: AnalysisType;
  userType: UserType;
  scores: CityScoreResponse[];
  algorithmVersion: string;
}

// ─── City Comparison ─────────────────────────────────────────────────────────

export interface CityComparisonRequest {
  currentCityId: string;
  targetCityId: string;
}

export interface MacroareaComparison {
  macroarea: keyof MacroareeScores;
  currentCityScore: number;
  targetCityScore: number;
  delta: number;
  direction: "improvement" | "decline" | "neutral";
}

export interface CityComparisonResponse {
  currentCity: { id: string; name: string; country: string; slug: string };
  targetCity: { id: string; name: string; country: string; slug: string };
  macroareeComparison: MacroareaComparison[];
  economicImpact: {
    currentCityCost: number;
    targetCityCost: number;
    monthlySaving: number;
    isFamily: boolean;
    summary: string;
    /** Living costs ex-rent (single or family) */
    currentLivingExRent?: number;
    currentRentHousing?: number;
    targetLivingExRent?: number;
    targetRentHousing?: number;
  };
  priorityAlignment: {
    alignedPriorities: string[];
    summary: string;
  };
  tradeOffs: { macroarea: string; message: string }[];
  overallImpact: {
    summary: string;
    scoreCurrentCity: number;
    scoreTargetCity: number;
    compatibilityLevelCurrent: CompatibilityLevel;
    compatibilityLevelTarget: CompatibilityLevel;
  };
  userWeights: MacroareeScores;
  userPriorityClassification: Record<string, string>;
  algorithmVersion: string;
}

// ─── Waiting List ─────────────────────────────────────────────────────────────

export interface WaitingListRequest {
  email: string;
  cityName: string;
}

// ─── Funnel Local State ───────────────────────────────────────────────────────

export interface FunnelAnswers {
  userPhase?: "planning_move" | "recently_moved" | "already_there";
  currentCityName?: string;
  targetCityName?: string;
  /** When user picks from catalog in funnel (preferred for scoring resolution). */
  currentCityId?: string;
  targetCityId?: string;
  targetType?: "specific_city" | "already_live" | "not_sure";
  relocationTime?: string;
  ageRange?: string;
  gender?: string;
  household?: Household;
  hasPets?: boolean;
  childrenCount?: number;
  childrenAgeRange?: string;
  primaryGoal?: PrimaryGoal;
  workStatus?: WorkStatus;
  workStructure?: "full_time" | "part_time" | "contractor";
  isRemote?: boolean;
  monthlyBudget?: number;
  desiredLifestyle?: DesiredLifestyle;
  priorityProblem?: PriorityProblem;
  socialPriority?: string;
}
