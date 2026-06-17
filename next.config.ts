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

  // sharp uses a platform-specific native binary. Bundling it into the
  // serverless function breaks it on Vercel (Linux x64). Keep it external so
  // it is require()d at runtime from node_modules instead.
  serverExternalPackages: ["sharp"],

  // Vercel's automatic file tracer can miss sharp's native libvips .so file
  // since it's loaded via dlopen() rather than require(), which throws
  // ERR_DLOPEN_FAILED at runtime even though npm installed it correctly.
  // Force it into the deployed function bundle explicitly.
  outputFileTracingIncludes: {
    "/api/admin/compress": ["./node_modules/@img/**/*", "./node_modules/sharp/**/*"],
  },

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
