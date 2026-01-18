import type { Uuid } from "../shared";
import type { PlaceSummaryResponse, ExperienceSummaryResponse } from "../catalog";
import type { PostResponse } from "../social";

export type SearchResultType = "PLACE" | "EXPERIENCE" | "USER" | "POST";

export type UserSearchResult = {
  id: Uuid;
  fullName: string | null;
  city: string | null;
  country: string | null;
};

export type SearchResult = {
  type: SearchResultType;
  place: PlaceSummaryResponse | null;
  experience: ExperienceSummaryResponse | null;
  user: UserSearchResult | null;
  post: PostResponse | null;
};

export type GlobalSearchResponse = {
  places: PlaceSummaryResponse[];
  experiences: ExperienceSummaryResponse[];
  users: UserSearchResult[];
  posts: PostResponse[];
};
