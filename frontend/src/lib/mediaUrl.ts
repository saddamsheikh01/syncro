const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export const resolveMediaUrl = (rawUrl?: string | null): string | null => {
  if (!rawUrl) return null;
  if (rawUrl.startsWith("/")) return rawUrl;

  try {
    const parsed = new URL(rawUrl);
    if (LOOPBACK_HOSTS.has(parsed.hostname) && parsed.pathname.startsWith("/media/")) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
};
