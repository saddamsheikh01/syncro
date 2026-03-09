import type { ApiError } from "@/types/api";

const VIATOR_UNAVAILABLE_STATUSES = new Set([0, 502, 503, 504]);

export const isViatorUnavailableError = (error: ApiError | null | undefined) => {
  if (!error) return false;
  if (VIATOR_UNAVAILABLE_STATUSES.has(error.status)) return true;

  const message = `${error.message ?? ""} ${error.error ?? ""}`.toLowerCase();
  return (
    message.includes("network error") ||
    message.includes("timeout") ||
    message.includes("temporarily unavailable") ||
    message.includes("servizio esterno non disponibile") ||
    message.includes("external service")
  );
};
