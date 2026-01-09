import type { IsoDateTime, Uuid } from "../shared";
import type { ExperienceSummaryResponse, PlaceSummaryResponse } from "../catalog";

export type FavoriteType = "PLACE" | "EXPERIENCE";

export type AddFavoriteRequest = {
  placeId?: Uuid | null;
  experienceId?: Uuid | null;
};

export type FavoriteResponse = {
  id: Uuid;
  type: FavoriteType;
  place: PlaceSummaryResponse | null;
  experience: ExperienceSummaryResponse | null;
  createdAt: IsoDateTime;
};
