const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function test() {
  const nomeOriginal = "Frigideira Antiaderente 28cm Tramontina";
  const categoriaNome = "Cozinha";
  const precoOriginal = 120;

  const promptCura = `Você é o especialista em curadoria de varejo e monetização do @catalog-expert.
Sua tarefa é encontrar até 3 alternativas reais de produtos comerciais ativamente vendidos na internet para substituir o quebrado, focando EXCLUSIVAMENTE nas lojas "Amazon Brasil" e "Magalu".

PRODUTO ORIGINAL QUEBROU:
- Nome: "${nomeOriginal}"
- Categoria: "${categoriaNome}"
- Preço Original Esperado: R$ ${precoOriginal}

🚨 REGRAS DE NEGÓCIO MANDATÓRIAS (ESTRITAMENTE OBRIGATÓRIO):
1. A "retail_url" DEVE ser um LINK DIRETO DE PRODUTO INDIVIDUAL (ex: contendo "/dp/ASIN" para Amazon ou "/p/codigo" para Magalu).
2. NUNCA, JAMAIS retorne links de páginas de busca (como "/s?k=" ou similares). O convidado DEVE abrir a página para comprar o item na hora!
3. Se você não souber a URL exata com 100% de certeza, gere uma URL estruturalmente plausível de produto real (ex: https://www.amazon.com.br/dp/B07XXXXXXX). Nosso validador testará o link via ping e rejeitará URLs falsas automaticamente em cascata até encontrar a ativa!

Retorne rigorosamente este JSON estruturado:
{
  "alternativas": [
    {
      "store_name": "Amazon Brasil",
      "product_name": "Nome Comercial Completo e Elegante",
      "estimated_price": 0.00,
      "commission_percent": 8.0,
      "retail_url": "https://www.amazon.com.br/dp/B07XXXXXXX",
      "description": "Texto comercial de luxo destacando benefícios.",
      "suggested_image_url": "https://images.unsplash.com/photo-..."
    },
    {
      "store_name": "Magalu",
      "product_name": "Nome Comercial Completo e Elegante",
      "estimated_price": 0.00,
      "commission_percent": 4.0,
      "retail_url": "https://www.magazineluiza.com.br/p/XXXXXXX/ud/pan/",
      "description": "Texto comercial elegante com descrição técnica apurada.",
      "suggested_image_url": "https://images.unsplash.com/photo-..."
    }
  ]
}`;

  try {
    console.log("Chamando OpenAI...");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você opera em modo rigorosamente estruturado JSON. Responda apenas com o objeto solicitado." },
        { role: "user", content: promptCura }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    console.log("Resposta da OpenAI:");
    console.log(completion.choices[0].message.content);
  } catch (e) {
    console.error("Erro:", e);
  }
}

test();
