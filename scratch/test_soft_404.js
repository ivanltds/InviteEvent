async function run() {
  const url = "https://www.amazon.com.br/dp/B08D6J3F8K";
  try {
    console.log(`Testando URL do print: ${url}`);
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      redirect: 'follow'
    });
    console.log(`HTTP Status Code: ${res.status}`);
    console.log(`res.ok: ${res.ok}`);
    
    const text = await res.text();
    console.log(`Tamanho da Resposta: ${text.length} bytes`);
    
    const containSoft404 = text.includes("não conseguimos encontrar esta página") || text.includes("não encontrada") || text.includes("dogs of Amazon") || text.includes("dog");
    console.log(`Contém padrão de Soft 404 (Não Encontrada): ${containSoft404}`);
    
  } catch (e) {
    console.error(`Erro na requisição: ${e.message}`);
  }
}

run();
