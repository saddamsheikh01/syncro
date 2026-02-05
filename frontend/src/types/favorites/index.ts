import type { IsoDateTime, Uuid } from "../shared";
import type { ExperienceSummaryResponse, PlaceSummaryResponse } from "../catalog";
import type { PostSummaryResponse } from "../social";

export type FavoriteType = "PLACE" | "EXPERIENCE" | "POST";

export type AddFavoriteRequest = {
  placeId?: Uuid | null;
  experienceId?: Uuid | null;
  postId?: Uuid | null;
};

export type FavoriteResponse = {
  id: Uuid;
  type: FavoriteType;
  place: PlaceSummaryResponse | null;
  experience: ExperienceSummaryResponse | null;
  post: PostSummaryResponse | null;
  createdAt: IsoDateTime;
};
