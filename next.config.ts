import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/invite/:slug',
        destination: '/inv/:slug',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
