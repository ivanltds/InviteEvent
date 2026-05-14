async function run() {
  const url = "https://www.amazon.com.br/dp/B00B9H9F8G";
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36'
      }
    });
    const text = await res.text();
    console.log("=== INÍCIO DO HTML MOBILE ===");
    console.log(text);
    console.log("=== FIM DO HTML MOBILE ===");
  } catch (e) {
    console.error(e);
  }
}

run();
