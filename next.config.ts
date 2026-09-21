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
      // Correção de 20/09/2026: o slug do evento "Andréia e Thiago" foi
      // cadastrado com um typo ("thaigo") e corrigido no banco pra
      // "casamento-de-andreia-e-thiago" — este redirect cobre quem já
      // recebeu/salvou o link com o erro antes da correção.
      {
        source: '/inv/evento/casamento-de-andreia-e-thaigo',
        destination: '/inv/evento/casamento-de-andreia-e-thiago',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
