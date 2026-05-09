import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
