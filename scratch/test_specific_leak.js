async function run() {
  const url = "https://www.amazon.com.br/dp/B08D6J3F8K"; // User's dead ASIN
  try {
    console.log(`Testando GET com Mobile User-Agent na ASIN do print: ${url}`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36'
      }
    });
    const text = await res.text();
    console.log(`Status HTTP Recebido: ${res.status}`);
    console.log(`Tamanho HTML: ${text.length}`);
    const hasCaptcha = text.includes("validateCaptcha");
    const hasSoft404 = text.includes("não conseguimos encontrar esta página") || text.includes("Cachorros da Amazon") || text.includes("Não foi possível encontrar esta página");
    console.log(`Contém Captcha? ${hasCaptcha}`);
    console.log(`Contém Soft 404? ${hasSoft404}`);
  } catch (e) {
    console.error(e);
  }
}

run();
