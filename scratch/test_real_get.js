async function run() {
  const url = "https://www.amazon.com.br/dp/B07WFHZQ2T"; // 100% GUARANTEED LIVE ASIN FOUND BY BROWSER
  try {
    console.log(`Testando GET /dp/ com Mobile User-Agent na ASIN 100% VIVA: ${url}`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36'
      }
    });
    const text = await res.text();
    console.log(`Status da Resposta HTTP: ${res.status}`);
    console.log(`Tamanho da Resposta: ${text.length} bytes`);
    const isCaptcha = text.includes("validateCaptcha");
    console.log(`Contém Captcha? ${isCaptcha}`);
    
    // Tentamos achar o nome do produto no HTML
    const hasTitle = text.includes("Mondial") || text.includes("Fritadeira");
    console.log(`Achou o nome do produto no HTML (Mondial/Fritadeira)? ${hasTitle}`);
    
  } catch (e) {
    console.error(e);
  }
}

run();
