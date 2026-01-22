import type { Uuid } from "../shared";
import type { PlaceSummaryResponse, ExperienceSummaryResponse } from "../catalog";
import type { PostResponse } from "../social";
import type { UserSummaryResponse } from "../profile";

export type SearchResultType = "PLACE" | "EXPERIENCE" | "USER" | "POST";

export type UserSearchResult = UserSummaryResponse;

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
