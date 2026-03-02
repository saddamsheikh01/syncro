/**
 * Geocode a place name to latitude/longitude using OpenStreetMap Nominatim.
 * No API key required. Use sparingly (Nominatim usage policy: max 1 req/sec).
 */

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  displayName?: string;
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "SyncroApp/1.0 (birth-chart place lookup)";

export async function geocodePlace(place: string): Promise<GeocodeResult | null> {
  const trimmed = place.trim();
  if (!trimmed) return null;

  const params = new URLSearchParams({
    q: trimmed,
    format: "json",
    limit: "1",
    addressdetails: "0",
  });

  const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    method: "GET",
    headers: { "Accept": "application/json", "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const first = data[0];
  const lat = Number(first.lat);
  const lon = Number(first.lon);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

  return {
    latitude: lat,
    longitude: lon,
    displayName: first.display_name,
  };
}

const BIGDATACLOUD_REVERSE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

/**
 * Get IANA timezone (e.g. "Europe/Rome") for coordinates. Used for correct Ascendant (local time → UTC).
 * Uses BigDataCloud free client API; no API key required.
 */
export async function getTimezoneForCoordinates(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      localityLanguage: "en",
    });
    const res = await fetch(`${BIGDATACLOUD_REVERSE_URL}?${params.toString()}`, {
      method: "GET",
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      localityInfo?: {
        informative?: Array<{ name?: string; description?: string }>;
      };
    };
    const informative = data?.localityInfo?.informative;
    if (!Array.isArray(informative)) return null;
    const tz = informative.find((i) => i.description === "time zone");
    const name = tz?.name;
    return typeof name === "string" && name.length > 0 ? name : null;
  } catch {
    return null;
  }
}
