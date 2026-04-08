import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qyodfkdaoagreknfbiye.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
