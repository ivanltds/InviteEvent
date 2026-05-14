const urls = [
  "https://www.amazon.com.br/dp/B07F2R9M8B?tag=ivanltds-20",
  "https://www.amazon.com.br/dp/B00J3K8Z8A?tag=ivanltds-20"
];

async function run() {
  for (const url of urls) {
    try {
      console.log(`Testando com tag: ${url}`);
      const res = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        redirect: 'follow'
      });
      console.log(`HEAD Status: ${res.status}`);
    } catch (e) {
      console.error(`Erro: ${e.message}`);
    }
  }
}

run();
