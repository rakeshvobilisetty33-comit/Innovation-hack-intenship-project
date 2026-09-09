import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Keep large server-only packages out of the bundler graph; require them
  // at runtime via Node instead. This reduces dev-server compile time/heap.
  serverExternalPackages: [
    "z-ai-web-dev-sdk",
    "mongoose",
    "mongodb-memory-server",
    "bcryptjs",
    "jsonwebtoken",
  ],
};

export default nextConfig;
