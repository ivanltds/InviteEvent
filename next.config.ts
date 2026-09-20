import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // ignoreBuildErrors removido em 20/09/2026 (docs/analise/02-infra.md):
  // o projeto já está com 0 erros de tsc, então deixar isso ligado só
  // escondia regressões futuras até elas quebrarem em produção.
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
