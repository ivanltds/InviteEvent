async function run() {
  // A known fake link
  const fakeUrl = "https://www.magazineluiza.com.br/p/9999999999999/ud/pan/";
  // A known real link (we can try a real generic search, or a popular product code)
  // Let's try to fetch some popular product to test 200 vs 404
  
  const urls = [fakeUrl];
  
  for (const url of urls) {
    try {
      console.log(`Testando GET Magalu: ${url}`);
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      console.log(`GET Status: ${res.status}`);
    } catch (e) {
      console.error(e);
    }
  }
}

run();
