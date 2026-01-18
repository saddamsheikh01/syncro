import { getPlaces, getExperiences } from "../catalog";
import { searchPosts } from "../social";
import type { GlobalSearchResponse } from "../../types/search";

export type GlobalSearchParams = {
  q: string;
  limit?: number;
};

export const globalSearch = async (
  params: GlobalSearchParams
): Promise<GlobalSearchResponse> => {
  const { q, limit = 5 } = params;

  if (!q || q.trim().length < 2) {
    return { places: [], experiences: [], users: [], posts: [] };
  }

  const [placesResult, experiencesResult, postsResult] = await Promise.all([
    getPlaces({ q, size: limit }),
    getExperiences({ q, size: limit }),
    searchPosts({ q, size: limit }),
  ]);

  return {
    places: placesResult.content,
    experiences: experiencesResult.content,
    users: [],
    posts: postsResult.content,
  };
};
