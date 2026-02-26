import { getPlaces } from "../catalog";
import { searchPosts } from "../social";
import { searchUsers } from "../users";
import type { GlobalSearchResponse } from "../../types/search";

export type GlobalSearchParams = {
  q: string;
  limit?: number;
};

export const globalSearch = async (
  params: GlobalSearchParams
): Promise<GlobalSearchResponse> => {
  const { q, limit = 5 } = params;
  const normalizedQuery = q.trim();

  if (!normalizedQuery || normalizedQuery.length < 2) {
    return { places: [], experiences: [], users: [], posts: [] };
  }

  const isEmailQuery = normalizedQuery.includes("@");

  if (isEmailQuery) {
    const usersResult = await searchUsers({ q: normalizedQuery, size: limit });
    return {
      places: [],
      experiences: [],
      users: usersResult.content,
      posts: [],
    };
  }

  const [placesResult, usersResult, postsResult] = await Promise.allSettled([
    getPlaces({ q: normalizedQuery, size: limit }),
    searchUsers({ q: normalizedQuery, size: limit }),
    searchPosts({ q: normalizedQuery, size: limit }),
  ]);

  return {
    places:
      placesResult.status === "fulfilled" ? placesResult.value.content : [],
    experiences: [],
    users: usersResult.status === "fulfilled" ? usersResult.value.content : [],
    posts: postsResult.status === "fulfilled" ? postsResult.value.content : [],
  };
};
