async function run() {
  const url = "https://www.amazon.com.br/s?k=Frigideira+Antiaderente+28cm+Tramontina";
  try {
    console.log(`Testando GET na URL de Busca: ${url}`);
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Tamanho: ${text.length}`);
    const isCaptcha = text.includes("validateCaptcha");
    console.log(`Contém Captcha? ${isCaptcha}`);
  } catch (e) {
    console.error(e);
  }
}

run();
