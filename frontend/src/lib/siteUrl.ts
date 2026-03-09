/** Production canonical URL (used when no env is set). */
const PRODUCTION_SITE_URL = "https://www.syncroapp.it";

/**
 * Absolute base URL for the site. On server, prefers NEXT_PUBLIC_SITE_URL; falls back to
 * VERCEL_URL (when deployed on Vercel), then production URL, or http://localhost:3000 in dev.
 */
export function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  const envUrl =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) return envUrl.replace(/\/+$/, "");
  const vercelUrl =
    typeof process !== "undefined" && process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/+$/, "")}`;
  }
  const isDev =
    typeof process !== "undefined" &&
    process.env.NODE_ENV === "development";
  return isDev ? "http://localhost:3000" : PRODUCTION_SITE_URL;
}

/** Base URL to use for shared links (uses env in build, else runtime origin). */
export function getShareableBaseUrl(): string {
  const env =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env) return env.replace(/\/+$/, "");
  return getSiteUrl();
}

export function getShareUrl(params?: { ref?: string; id?: string }): string {
  const base = getSiteUrl();
  const path = "/login";
  const search = new URLSearchParams();
  if (params?.ref) search.set("ref", params.ref);
  if (params?.id) search.set("id", params.id);
  const q = search.toString();
  const pathWithQuery = q ? `${path}?${q}` : path;
  if (!base) return pathWithQuery;
  return `${base}${pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`}`;
}

export function getProfileUrl(userId: string): string {
  return `${getSiteUrl()}/profile/${userId}`;
}

/** Profile URL for sharing (uses shareable base so Facebook/crawlers get a public link). */
export function getShareableProfileUrl(userId: string): string {
  return `${getShareableBaseUrl()}/profile/${userId}`;
}

/** URL for shared links that should land on login (e.g. Moments post, recap without profile). Uses shareable base. */
export function getShareableShareUrl(params?: { ref?: string; id?: string }): string {
  const base = getShareableBaseUrl();
  const path = "/login";
  const search = new URLSearchParams();
  if (params?.ref) search.set("ref", params.ref);
  if (params?.id) search.set("id", params.id);
  const q = search.toString();
  const pathWithQuery = q ? `${path}?${q}` : path;
  if (!base) return pathWithQuery;
  return `${base}${pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`}`;
}

export function getShareablePlaceUrl(placeId: string): string {
  const base = getShareableBaseUrl();
  return base ? `${base}/places/${placeId}` : `/places/${placeId}`;
}

/** Experience detail path: UUID for DB experiences, viator-{productCode} for Viator live. */
export function getExperienceDetailPath(exp: {
  id: string;
  source?: string | null;
  provider?: string | null;
  externalId?: string | null;
}): string {
  if ((exp.source === "VIATOR" || exp.provider === "VIATOR") && exp.externalId) {
    return `/experiences/viator-${exp.externalId}`;
  }
  return `/experiences/${exp.id}`;
}

export function getShareableExperienceUrl(experienceId: string): string {
  const base = getShareableBaseUrl();
  return base ? `${base}/experiences/${experienceId}` : `/experiences/${experienceId}`;
}

export function getShareableMomentUrl(postId: string): string {
  const base = getShareableBaseUrl();
  return base ? `${base}/moments/${postId}` : `/moments/${postId}`;
}
