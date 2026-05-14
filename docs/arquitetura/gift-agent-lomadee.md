# Agente OpenAI — Busca de Presentes via Lomadee com Score SAF

## Visão Geral da Arquitetura

Este documento descreve a estrutura completa de um agente baseado no OpenAI Agents SDK que busca produtos na API Lomadee, calcula um **Score de Atratividade Final (SAF)** e persiste o melhor resultado no banco de dados de uma lista de presentes de casamento.

O fluxo consiste em três etapas sequenciais orquestradas pelo agente:
1. **Busca genérica** de produtos por nome na API Lomadee
2. **Cálculo SAF** ponderando preço final (valor + frete) e percentual de comissão
3. **Persistência** do item vencedor no banco de dados

---

## Cálculo SAF — Score de Atratividade Final

O SAF equilibra dois objetivos conflitantes: **menor custo para o presenteador** e **maior comissão para o afiliado**. Ambos são normalizados para uma escala 0–1 antes da ponderação, garantindo que nenhum domine o outro por diferença de escala.

### Normalização

Para um produto `i` dentro de uma lista de `n` candidatos:

\[
\text{norm\_preco}_i = 1 - \frac{P_i - P_{min}}{P_{max} - P_{min}}
\]

\[
\text{norm\_comissao}_i = \frac{C_i - C_{min}}{C_{max} - C_{min}}
\]

Onde:
- \(P_i = \text{price} + \text{freight}\) → preço final pago pelo presenteador
- \(C_i\) → percentual de comissão da oferta (campo `commission` na Lomadee)
- Quando todos os preços são iguais (denominador zero), `norm_preco = 1.0` para todos

### Fórmula SAF

\[
SAF_i = W_p \times \text{norm\_preco}_i + W_c \times \text{norm\_comissao}_i
\]

Pesos recomendados para equilíbrio saudável:

| Peso | Valor | Justificativa |
|---|---|---|
| \(W_p\) (preço) | **0.55** | Experiência do presenteador é prioridade — preço mais baixo converte melhor |
| \(W_c\) (comissão) | **0.45** | Monetização do afiliado é relevante mas não deve encarecer o presente |

> Os pesos somam 1.0. Ajuste conforme a estratégia: aumentar `W_c` prioriza receita, aumentar `W_p` prioriza conversão.

---

## Estrutura de Código Completa

### 1. Dependências e Configuração

```python
# requirements.txt
openai-agents>=0.1.0
httpx>=0.27.0
pydantic>=2.0.0
sqlalchemy>=2.0.0
python-dotenv>=1.0.0
```

```python
# config.py
import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY    = os.getenv("OPENAI_API_KEY")
LOMADEE_APP_TOKEN = os.getenv("LOMADEE_APP_TOKEN")
LOMADEE_SOURCE_ID = os.getenv("LOMADEE_SOURCE_ID")
DATABASE_URL      = os.getenv("DATABASE_URL", "sqlite:///gifts.db")

LOMADEE_BASE_URL  = f"https://api.lomadee.com/v2/{LOMADEE_APP_TOKEN}"

# Pesos SAF
SAF_WEIGHT_PRICE      = 0.55
SAF_WEIGHT_COMMISSION = 0.45
```

---

### 2. Modelos de Dados (Pydantic + SQLAlchemy)

```python
# models.py
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Float, DateTime, create_engine
from sqlalchemy.orm import DeclarativeBase, Session
from datetime import datetime, timezone
from config import DATABASE_URL

# --- Pydantic: contrato da API Lomadee ---
class LomadeeOffer(BaseModel):
    product_id:   str
    title:        str
    thumbnail:    str
    description:  str = ""
    price:        float
    freight:      float = 0.0
    commission:   float = 0.0   # % ex: 5.5 → 5.5%
    affiliate_link: str
    store_name:   str

# --- Pydantic: saída final do agente ---
class GiftResult(BaseModel):
    product_id:    str
    title:         str
    thumbnail:     str
    price:         float
    freight:       float
    total_price:   float
    commission:    float
    saf_score:     float
    affiliate_link: str
    store_name:    str

# --- SQLAlchemy: tabela de persistência ---
class Base(DeclarativeBase):
    pass

class GiftItem(Base):
    __tablename__ = "gift_items"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    wedding_gift_id = Column(String, nullable=False)   # ID do presente na sua lista
    title          = Column(String, nullable=False)
    thumbnail      = Column(String, nullable=False)
    affiliate_link = Column(String, nullable=False)
    price          = Column(Float,  nullable=False)
    total_price    = Column(Float,  nullable=False)
    commission     = Column(Float,  nullable=False)
    saf_score      = Column(Float,  nullable=False)
    store_name     = Column(String)
    updated_at     = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                            onupdate=lambda: datetime.now(timezone.utc))

engine = create_engine(DATABASE_URL)
Base.metadata.create_all(engine)
```

---

### 3. Ferramentas do Agente (Tools)

```python
# tools.py
import httpx
from agents import function_tool
from pydantic import BaseModel
from typing import List
from models import LomadeeOffer, GiftResult
from config import LOMADEE_BASE_URL, LOMADEE_SOURCE_ID, SAF_WEIGHT_PRICE, SAF_WEIGHT_COMMISSION

# ── Tool 1: Busca genérica na Lomadee ─────────────────────────────────────────
class SearchInput(BaseModel):
    gift_name: str   # nome do presente (será tornado genérico pelo agente)

@function_tool
async def search_lomadee_offers(gift_name: str) -> List[LomadeeOffer]:
    """
    Busca ofertas na API Lomadee para um nome de presente.
    Retorna lista de produtos com preço, frete, comissão e link afiliado.
    O nome deve ser genérico (ex: 'jogo de panelas' ao invés de 'Tramontina 7 peças inox').
    """
    url = f"{LOMADEE_BASE_URL}/offer/_search"
    params = {
        "sourceId": LOMADEE_SOURCE_ID,
        "keyword": gift_name,
        "size": 30,          # busca ampla para o SAF ter candidatos suficientes
        "sort": "price_asc", # pré-ordenar por preço ajuda o modelo a ter contexto
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()

    offers = []
    for item in data.get("offers", []):
        try:
            offer = LomadeeOffer(
                product_id    = str(item["id"]),
                title         = item["name"],
                thumbnail     = item.get("thumbnail", ""),
                description   = item.get("description", ""),
                price         = float(item.get("price", 0)),
                freight       = float(item.get("freight", {}).get("price", 0)),
                commission    = float(item.get("store", {}).get("commissionRate", 0)),
                affiliate_link= item.get("link", ""),
                store_name    = item.get("store", {}).get("name", ""),
            )
            if offer.price > 0 and offer.affiliate_link:
                offers.append(offer)
        except Exception:
            continue  # ignora itens malformados

    return offers


# ── Tool 2: Cálculo SAF ────────────────────────────────────────────────────────
@function_tool
def calculate_saf(offers: List[LomadeeOffer]) -> List[GiftResult]:
    """
    Calcula o Score de Atratividade Final (SAF) para cada oferta.
    Normaliza preço_final e comissão para [0,1] e pondera:
    SAF = 0.55 * norm_preco + 0.45 * norm_comissao
    Retorna a lista ordenada do maior para o menor SAF.
    """
    if not offers:
        return []

    totals      = [o.price + o.freight for o in offers]
    commissions = [o.commission for o in offers]

    p_min, p_max = min(totals), max(totals)
    c_min, c_max = min(commissions), max(commissions)

    p_range = p_max - p_min if p_max != p_min else 1.0
    c_range = c_max - c_min if c_max != c_min else 1.0

    results = []
    for offer, total in zip(offers, totals):
        norm_price = 1.0 - (total - p_min) / p_range
        norm_comm  = (offer.commission - c_min) / c_range
        saf        = SAF_WEIGHT_PRICE * norm_price + SAF_WEIGHT_COMMISSION * norm_comm

        results.append(GiftResult(
            product_id    = offer.product_id,
            title         = offer.title,
            thumbnail     = offer.thumbnail,
            price         = offer.price,
            freight       = offer.freight,
            total_price   = round(total, 2),
            commission    = offer.commission,
            saf_score     = round(saf, 4),
            affiliate_link= offer.affiliate_link,
            store_name    = offer.store_name,
        ))

    return sorted(results, key=lambda x: x.saf_score, reverse=True)


# ── Tool 3: Persistência no banco ─────────────────────────────────────────────
@function_tool
def persist_best_offer(wedding_gift_id: str, best: GiftResult) -> str:
    """
    Persiste ou atualiza o melhor produto encontrado para um presente da lista.
    Salva: título, thumbnail, link afiliado, preço, score SAF.
    Retorna confirmação com o ID gerado.
    """
    from sqlalchemy.orm import Session
    from models import GiftItem, engine

    with Session(engine) as session:
        existing = session.query(GiftItem).filter_by(
            wedding_gift_id=wedding_gift_id
        ).first()

        if existing:
            existing.title          = best.title
            existing.thumbnail      = best.thumbnail
            existing.affiliate_link = best.affiliate_link
            existing.price          = best.price
            existing.total_price    = best.total_price
            existing.commission     = best.commission
            existing.saf_score      = best.saf_score
            existing.store_name     = best.store_name
            record_id = existing.id
        else:
            item = GiftItem(
                wedding_gift_id = wedding_gift_id,
                title           = best.title,
                thumbnail       = best.thumbnail,
                affiliate_link  = best.affiliate_link,
                price           = best.price,
                total_price     = best.total_price,
                commission      = best.commission,
                saf_score       = best.saf_score,
                store_name      = best.store_name,
            )
            session.add(item)
            session.flush()
            record_id = item.id

        session.commit()

    return f"✅ Presente '{best.title}' salvo com ID={record_id} | SAF={best.saf_score} | R$ {best.total_price}"
```

---

### 4. Definição do Agente

```python
# agent.py
from agents import Agent
from tools import search_lomadee_offers, calculate_saf, persist_best_offer

gift_agent = Agent(
    name="GiftSearchAgent",
    model="gpt-4o-mini",   # custo-benefício ideal para tool calling
    instructions="""
Você é um agente especialista em lista de presentes de casamento com foco em afiliados.

FLUXO OBRIGATÓRIO para cada presente recebido:
1. Use `search_lomadee_offers` com uma keyword GENÉRICA do produto.
   - Nunca use marcas ou especificações técnicas na busca.
   - Exemplos: "jogo de panelas" (não "Tramontina inox 7 peças"), 
     "liquidificador" (não "Oster 1000W 12v"), "toalha de banho" (não "Buddemeyer Egito").
   - Isso maximiza o número de candidatos comparáveis.

2. Use `calculate_saf` passando os resultados retornados.
   - O SAF pondera preço final (55%) e comissão (45%).
   - O primeiro item da lista retornada é o vencedor.

3. Use `persist_best_offer` com o wedding_gift_id e o item de índice 0 da lista SAF.

Nunca pule uma etapa. Nunca selecione o produto manualmente; sempre confie no SAF.
""",
    tools=[search_lomadee_offers, calculate_saf, persist_best_offer],
)
```

---

### 5. Execução do Agente

```python
# main.py
import asyncio
from agents import Runner
from agent import gift_agent

async def update_gift_list(gifts: list[dict]):
    """
    gifts: lista de dicionários com 'id' e 'name'
    Exemplo: [{"id": "gift-001", "name": "Jogo de Panelas"}]
    """
    for gift in gifts:
        print(f"\n🔍 Processando: {gift['name']}")

        result = await Runner.run(
            gift_agent,
            input=f"Busque o melhor produto para o presente ID '{gift['id']}' com nome '{gift['name']}'."
        )

        print(result.final_output)

# Uso
if __name__ == "__main__":
    minha_lista = [
        {"id": "gift-001", "name": "Jogo de Panelas"},
        {"id": "gift-002", "name": "Liquidificador"},
        {"id": "gift-003", "name": "Toalha de Banho"},
        {"id": "gift-004", "name": "Cafeteira"},
        {"id": "gift-005", "name": "Jogo de Cama"},
    ]

    asyncio.run(update_gift_list(minha_lista))
```

---

## Diagrama de Fluxo do Agente

```
Input: {id, name}
       │
       ▼
[LLM] Torna keyword genérica
       │
       ▼
[Tool 1] search_lomadee_offers(keyword)
         → retorna até 30 LomadeeOffer
       │
       ▼
[Tool 2] calculate_saf(offers)
         → normaliza preço + comissão
         → aplica pesos (0.55 / 0.45)
         → ordena por SAF desc
         → retorna List[GiftResult]
       │
       ▼
[Tool 3] persist_best_offer(id, results[0])
         → UPSERT no banco (SQLite/Postgres)
         → salva: title, thumbnail,
           affiliate_link, price, saf_score
       │
       ▼
Output: "✅ Salvo com ID=X | SAF=0.87 | R$ 129.90"
```

---

## Variáveis de Ambiente Necessárias

```dotenv
# .env
OPENAI_API_KEY=sk-...
LOMADEE_APP_TOKEN=seu_app_token_aqui
LOMADEE_SOURCE_ID=seu_source_id_aqui
DATABASE_URL=sqlite:///gifts.db
# Para produção: DATABASE_URL=postgresql://user:pass@host/dbname
```

---

## Campos Persistidos no Banco

| Campo | Tipo | Origem |
|---|---|---|
| `wedding_gift_id` | String | ID do presente na sua lista de casamento |
| `title` | String | `name` da oferta Lomadee |
| `thumbnail` | String | URL da imagem do produto |
| `affiliate_link` | String | Link rastreado com `sourceId` |
| `price` | Float | Preço do produto (sem frete) |
| `total_price` | Float | `price + freight` (base do SAF) |
| `commission` | Float | % de comissão da loja |
| `saf_score` | Float | Score 0.0–1.0 calculado |
| `store_name` | String | Nome da loja afiliada |
| `updated_at` | DateTime | Timestamp da última atualização |

---

## Extensões Recomendadas

- **Atualização periódica:** Rodar o agente semanalmente via cron/Cloud Scheduler para manter preços frescos
- **Multi-fonte:** Adicionar tools para Amazon PA-API e Mercado Livre e criar uma `Tool 2b` de `merge_and_rank` que consolida candidatos de todas as fontes antes do SAF
- **Cache:** Adicionar Redis com TTL de 6h nas buscas para respeitar o rate limit de 10 req/min da Lomadee
- **Fallback:** Se `freight` não vier na resposta da Lomadee, usar `0.0` (já implementado) ou chamar uma API de simulação de frete
