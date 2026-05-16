import fetch from 'node-fetch';
import https from 'https';

const APP_TOKEN = 'QoXqLRiZGhAGYyhDGitu1gAV2PRX-d6q';
const SOURCE_ID = '5082927';

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function tryEndpoint(name: string, url: string) {
  console.log(`\n--- Testando com SSL BYPASS: ${name} ---`);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      agent,
      // @ts-ignore
      timeout: 5000
    });
    console.log(`Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(`Retorno: ${text.slice(0, 500)}`);
  } catch (err: any) {
    console.log(`ERRO: ${err.message}`);
  }
}

async function run() {
  await tryEndpoint('Lomadi v2 Deeplink Generator', `https://api.lomadi.com/v2/${APP_TOKEN}/deeplink?sourceId=${SOURCE_ID}&url=https%3A%2F%2Fwww.amazon.com.br`);
  await tryEndpoint('Lomadi v2 Search', `https://api.lomadi.com/v2/${APP_TOKEN}/product/_search?sourceId=${SOURCE_ID}&keyword=Frigideira&size=1`);
}

run();
