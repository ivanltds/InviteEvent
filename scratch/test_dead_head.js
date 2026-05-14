async function run() {
  const url = "https://www.amazon.com.br/dp/B08D6J3F8K";
  try {
    console.log(`Testando HEAD na URL morta: ${url}`);
    const res = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log(`HEAD Status: ${res.status}`);
  } catch (e) {
    console.error(e);
  }
}

run();
