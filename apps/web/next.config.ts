import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@tienlen/shared', '@tienlen/engine'],
};

export default nextConfig;
