import type { Messages } from "./dictionaries";

const getByPath = (obj: unknown, path: string): unknown => {
  if (!obj || typeof obj !== "object") return undefined;
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
};

const interpolate = (
  template: string,
  values?: Record<string, string | number>
): string => {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = values[key];
    return value === undefined || value === null ? `{${key}}` : String(value);
  });
};

export type Translator = {
  t: (key: string, values?: Record<string, string | number>) => string;
};

export const createTranslator = (params: {
  messages: Messages;
  fallbackMessages: Messages;
  onMissingKey?: (key: string) => void;
}): Translator => {
  const { messages, fallbackMessages, onMissingKey } = params;

  const t = (key: string, values?: Record<string, string | number>): string => {
    // 1) Fast path: allow using "raw" keys (e.g. the English phrase) directly.
    const direct =
      (messages as Record<string, unknown>)[key] ??
      (fallbackMessages as Record<string, unknown>)[key] ??
      undefined;

    const raw =
      (typeof direct === "string" ? direct : undefined) ??
      getByPath(messages, key) ??
      getByPath(fallbackMessages, key) ??
      null;

    if (typeof raw !== "string") {
      onMissingKey?.(key);
      // For phrase-keys (English text as key), we still want interpolation to work
      // even when we don't have an explicit translation entry (common for `en`).
      return interpolate(key, values);
    }

    return interpolate(raw, values);
  };

  return { t };
};
