import type { IsoDateTime, JsonObject, Uuid } from "../shared";
import type { ExperienceSummaryResponse, PlaceSummaryResponse } from "../catalog";
import type { ProfileVisibility } from "../profile";

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
