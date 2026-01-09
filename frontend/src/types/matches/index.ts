import type { IsoDateTime, JsonObject, Uuid } from "../shared";
import type { ExperienceSummaryResponse, PlaceSummaryResponse } from "../catalog";

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

export type UserMatchResponse = {
  matchId: Uuid;
  userId: Uuid;
  scoreTotal: number | null;
  breakdown: JsonObject | null;
  explanation: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};
