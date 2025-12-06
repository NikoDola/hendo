import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**"
      }
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60
  },

  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  // Add this so Next.js 16 + Turbopack stops throwing errors
  turbopack: {},

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "firebase-admin": false
      };
    }
    return config;
  }
};

export default nextConfig;
