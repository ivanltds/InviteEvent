async function run() {
  const url = "https://www.amazon.com.br/dp/B08D6J3F8K";
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const text = await res.text();
    console.log("=== INÍCIO DO HTML ===");
    console.log(text);
    console.log("=== FIM DO HTML ===");
  } catch (e) {
    console.error(e);
  }
}

run();
