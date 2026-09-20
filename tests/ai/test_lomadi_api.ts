// Script manual de diagnóstico da API da Lomadee/Lomadi (não faz parte da
// suíte Jest nem do CI — rode com `npx tsx tests/ai/test_lomadi_api.ts`).
//
// Correção de 20/09/2026 (docs/analise/05-privacidade-e-higiene-repo.md,
// HIG-03): o token e o sourceId da Lomadee estavam hardcoded em texto puro
// aqui. Agora vêm de variáveis de ambiente — defina LOMADEE_APP_TOKEN e
// LOMADEE_SOURCE_ID no seu .env antes de rodar.
//
// Também trocou `node-fetch` (nunca foi uma dependência real do projeto,
// só compilava por acaso via um pacote transitivo) pelo `fetch` nativo do
// Node 18+, removendo o bypass de verificação de certificado TLS.

const APP_TOKEN = process.env.LOMADEE_APP_TOKEN;
const SOURCE_ID = process.env.LOMADEE_SOURCE_ID;

async function tryEndpoint(name: string, url: string) {
  console.log(`\n--- Testando: ${name} ---`);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    console.log(`Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(`Retorno: ${text.slice(0, 500)}`);
  } catch (err: any) {
    console.log(`ERRO: ${err.message}`);
  }
}

async function run() {
  if (!APP_TOKEN || !SOURCE_ID) {
    console.error('Defina LOMADEE_APP_TOKEN e LOMADEE_SOURCE_ID no .env antes de rodar este script.');
    process.exit(1);
  }
  await tryEndpoint('Lomadi v2 Deeplink Generator', `https://api.lomadi.com/v2/${APP_TOKEN}/deeplink?sourceId=${SOURCE_ID}&url=https%3A%2F%2Fwww.amazon.com.br`);
  await tryEndpoint('Lomadi v2 Search', `https://api.lomadi.com/v2/${APP_TOKEN}/product/_search?sourceId=${SOURCE_ID}&keyword=Frigideira&size=1`);
}

run();
