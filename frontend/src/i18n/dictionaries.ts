import type { SupportedLocale } from "./locales";

import en from "./messages/en.json";
import it from "./messages/it.json";
import es from "./messages/es.json";
import fr from "./messages/fr.json";

import enPhrases from "./messages/phrases.en.json";
import itPhrases from "./messages/phrases.it.json";
import esPhrases from "./messages/phrases.es.json";
import frPhrases from "./messages/phrases.fr.json";

export type Messages = Record<string, unknown>;

export const DICTIONARIES: Record<SupportedLocale, Messages> = {
  en: { ...en, ...enPhrases },
  it: { ...it, ...itPhrases },
  es: { ...es, ...esPhrases },
  fr: { ...fr, ...frPhrases },
};
