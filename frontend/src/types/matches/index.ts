import type { IsoDateTime, JsonObject, Uuid } from "../shared";
import type { ExperienceSummaryResponse, PlaceSummaryResponse } from "../catalog";
import type { ProfileVisibility } from "../profile";

export type MatchDomain =
  | "LOVE"
  | "FRIENDSHIP"
  | "WORK"
  | "PROJECTS"
  | "HOBBY"
  | "GROWTH";

/**
 * Punteggi per ogni dimensione di valutazione del match.
 * Tutti i valori sono 0-100 o null se non disponibili.
 */
export type DimensionScores = {
  interests?: number | null;
  lifestyle?: number | null;
  values?: number | null;
  objectives?: number | null;
  psy?: number | null;
  astro?: number | null;
};

/**
 * Punteggi per ogni dominio di compatibilita.
 * Tutti i valori sono 0-100 o null se non disponibili.
 */
export type DomainScores = {
  love?: number | null;
  friendship?: number | null;
  work?: number | null;
  projects?: number | null;
  hobby?: number | null;
  growth?: number | null;
};

/**
 * Breakdown strutturato del match con dimensioni e domini.
 */
export type MatchBreakdown = {
  dimensions?: DimensionScores;
  domains?: DomainScores;
  activeDomains?: Record<string, boolean>;
  domainWeights?: Record<string, number>;
  sharedTags?: string[] | number;
  distanceKm?: number | null;
  completeness?: number;
  availableDimensions?: number;
  totalDimensions?: number;
  loveReciprocal?: boolean;
};

export type RecommendationType = "PLACE" | "EXPERIENCE";

export type RecommendationResponse = {
  id: Uuid;
  type: RecommendationType;
  place: PlaceSummaryResponse | null;
  experience: ExperienceSummaryResponse | null;
  score: number | null;
  breakdown: JsonObject | null;
  createdAt: IsoDateTime;
};

export type UserSummary = {
  userId: Uuid;
  username: string | null;
  fullName: string | null;
  city: string | null;
  country: string | null;
  avatarUrl: string | null;
  visibility: ProfileVisibility | null;
};

export type UserMatchResponse = {
  matchId: Uuid;
  userId: Uuid;
  user: UserSummary | null;
  scoreTotal: number | null;
  breakdown: JsonObject | null;
  explanation: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};
