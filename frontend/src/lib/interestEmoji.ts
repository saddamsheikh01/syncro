import { capitalizeFirst } from "./formatters";

const INTEREST_EMOJI_MAP: Record<string, string> = {
  travel: "\u{1F30D}",
  viaggi: "\u{1F30D}",
  viaggio: "\u{1F30D}",
  food: "\u{1F37D}",
  cibo: "\u{1F37D}",
  cucina: "\u{1F37D}",
  culture: "\u{1F3DB}",
  cultura: "\u{1F3DB}",
  wellness: "\u{1F9D8}",
  benessere: "\u{1F9D8}",
  networking: "\u{1F91D}",
  network: "\u{1F91D}",
  music: "\u{1F3B5}",
  musica: "\u{1F3B5}",
  art: "\u{1F3A8}",
  arte: "\u{1F3A8}",
  sport: "\u{26BD}",
  sports: "\u{26BD}",
  tech: "\u{1F4BB}",
  tecnologia: "\u{1F4BB}",
  business: "\u{1F4BC}",
  lavoro: "\u{1F4BC}",
  photography: "\u{1F4F7}",
  fotografia: "\u{1F4F7}",
  events: "\u{1F389}",
  eventi: "\u{1F389}",
};

const INTEREST_EMOJI_ENTRIES = Object.entries(INTEREST_EMOJI_MAP);

export const getInterestEmoji = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  const exactMatch = INTEREST_EMOJI_MAP[normalized];
  if (exactMatch) return exactMatch;
  const partialMatch = INTEREST_EMOJI_ENTRIES.find(([key]) =>
    normalized.includes(key)
  );
  return partialMatch ? partialMatch[1] : "";
};

export const formatInterestLabel = (value: string) => {
  const emoji = getInterestEmoji(value);
  const label = capitalizeFirst(value);
  return emoji ? `${emoji} ${label}` : label;
};
