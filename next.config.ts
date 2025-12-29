import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone', // Enable for Docker production builds
};

export default nextConfig;
