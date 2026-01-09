import type { NextConfig } from "next";

const resolveBackendBaseUrl = () => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8080";
  return raw.replace(/\/+$/, "").replace(/\/api\/v1$/, "");
};

const nextConfig: NextConfig = {
  async rewrites() {
    const backendBaseUrl = resolveBackendBaseUrl();

    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendBaseUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
