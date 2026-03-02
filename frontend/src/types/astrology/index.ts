/** Zodiac sign enum matching backend */
export type ZodiacSign =
  | "ARIES"
  | "TAURUS"
  | "GEMINI"
  | "CANCER"
  | "LEO"
  | "VIRGO"
  | "LIBRA"
  | "SCORPIO"
  | "SAGITTARIUS"
  | "CAPRICORN"
  | "AQUARIUS"
  | "PISCES"
  | "UNKNOWN";

export type PlacementDTO = {
  sign: ZodiacSign;
  degreeInSign: number;
};

export type AstrologyCalculationRequest = {
  birthDate: string; // ISO date YYYY-MM-DD
  birthTime?: string | null; // HH:mm or HH:mm:ss (local at place of birth)
  birthLatitude: number;
  birthLongitude: number;
  /** IANA timezone of place of birth (e.g. Europe/Rome). Required for correct Ascendant. */
  birthTimezone?: string | null;
};

export type AstrologyCalculationResponse = {
  sun: PlacementDTO;
  moon: PlacementDTO;
  ascendant: PlacementDTO | null;
  venus: PlacementDTO;
  mars: PlacementDTO;
  hasBirthTime: boolean;
  /** Set when returned from calculate-and-save (cached on profile for reuse). */
  interpretation?: string | null;
};
