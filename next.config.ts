import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["node:sqlite"],
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
