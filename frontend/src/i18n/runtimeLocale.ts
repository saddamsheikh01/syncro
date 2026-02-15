import { userStore } from "@/stores/user/userStore";
import {
  DEFAULT_LOCALE,
  normalizeLocale,
  toBcp47,
  type SupportedLocale,
} from "./locales";

export const getRuntimeLocale = (): SupportedLocale => {
  const fromStore = normalizeLocale(userStore.getState().language);
  return fromStore ?? DEFAULT_LOCALE;
};

export const getRuntimeBcp47 = (): string => toBcp47(getRuntimeLocale());

