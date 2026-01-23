import type { NextConfig } from "next";

const resolveBackendBaseUrl = () => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8080";
  return raw.replace(/\/+$/, "").replace(/\/api\/v1$/, "");
};

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
        pathname: "/maps/api/place/photo**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    const backendBaseUrl = resolveBackendBaseUrl();

    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendBaseUrl}/api/v1/:path*`,
      },
      {
        source: "/media/:path*",
        destination: `${backendBaseUrl}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
