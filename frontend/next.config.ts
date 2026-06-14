import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    // NEXT_PRIVATE_API_URL is available at both build and runtime in Next.js standalone mode.
    // Default to the Docker internal hostname (backend:8000) for production.
    const apiBase = process.env.NEXT_PRIVATE_API_URL || "http://backend:8000/api/:path*";
    return [
      {
        source: "/api/:path*",
        destination: apiBase,
      },
    ];
  },
};

export default nextConfig;
