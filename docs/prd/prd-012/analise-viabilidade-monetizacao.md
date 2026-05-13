# Análise de Viabilidade & Estratégia de Monetização — PRD-012
> **Autor:** @marketplace-expert  
> **Status:** EM REVISÃO  
> **Foco:** Integrações, Attribution Tracking, Gateway de Redirecionamento e Compliance.

---

## 1. Introdução & Avaliação Geral

A proposta do **PRD-012** é brilhante do ponto de vista de **SaaS Economics**. Ao integrar links de afiliados no core do produto, a plataforma InviteEvent transforma um custo operacional (tráfego de convidados visualizando listas) em um gerador de receita passiva (monetização por tráfego qualificado), mantendo a essência de UX (foco nos noivos e na experiência elegante).

Do ponto de vista de mercado, **lista de presentes de casamento é tráfego de altíssima conversão**, pois o usuário que clica já possui a intenção de compra declarada.

Contudo, para que o motor funcione sem quebrar a experiência do usuário e sem violar regras das grandes redes (como a Amazon Associates), precisamos resolver **lacunas críticas de atribuição e UX** abaixo delineadas.

---

## 2. Lacunas Críticas & Questionamentos (Missing Definitions)

### ❓ Q1: Prevenção de Abuso no Loop de Feedback ("Já Comprei")
*   **O Problema:** O convidado clica no link externo, desiste da compra, volta para o convite e clica em *"Sim, já comprei"*, bloqueando o item para sempre de outros interessados.
*   **Decisão Validada:** **Reserva Temporária Curta (3 Horas).** O item ganha a etiqueta "Reservado" e sai temporariamente da listagem ativa por apenas 3 horas. Após esse período, se a compra não for consolidada via webhook/feedback, o item retorna automaticamente para garantir fluidez à lista e oportunidade para outros convidados.

### ❓ Q2: Centralização e Flexibilidade de Lojas (Não se Limitar a Poucas Lojas)
*   **O Requisito:** A comissão é sua (SaaS), mas a plataforma deve permitir a agregação de dezenas de lojas de múltiplos segmentos com facilidade. O processo de adicionar e "romper" (excluir) parcerias deve ser dinâmico.
*   **Arquitetura Adotada:** **Affiliate Rules Engine (Tabela de Regras).** Não faremos if/else fixos no código. Teremos a tabela `public.plataformas_afiliados`. Para adicionar uma loja de decoração nova, basta inserir a expressão regular do domínio e o template de URL de afiliado. Para romper com uma loja, basta setar `ativa = false`. Flexibilidade total e imediata em banco de dados.

### ❓ Q3: Transparência Absoluta na UX do Convidado
*   **O Requisito:** O convidado deve ser notificado de todo o processo de redirecionamento e da mecânica da reserva temporária de 3 horas ANTES de sair do site.
*   **Decisão Validada:** **Intersticial Gateway Transparente.** O clique no botão "Comprar Fora" abrirá um modal/tela intermediária elegante de 3-4 segundos com uma mensagem clara: *"Você está sendo direcionado para a [Loja]. Para garantir que ninguém compre o mesmo item, estamos reservando este presente para você por até 3 horas. Desejamos uma boa compra!"* com um botão de progresso e CTA imediato.

---

## 3. Insights Estratégicos & Sugestões de Otimização

### 💡 Insight A: Adoção de SubIDs / Dynamic Tracking ID
*   Para o seu objetivo de saber **qual clique converteu em venda**, não basta usar sua tag global. Precisamos usar o parâmetro de rastreamento dinâmico das redes (conhecido como `subID` na Lomadee, `tracking_id` ou `tag` variável na Amazon, e `sub_id` na Shopee).
*   **Como Faremos:** Ao gerar o redirect, a URL final será acrescida do ID do clique local.
    *   *Exemplo Amazon:* `&tag=seuIDglobal-20&ascsubtag=ID_DO_CLIQUE_NO_SUPABASE`
    *   *Benefício:* Quando você baixar o relatório de vendas na Amazon, o campo `ascsubtag` terá o UUID exato da nossa tabela `public.presente_cliques`. Assim, um simples upload de CSV mensal ou script cron poderá casar 100% das vendas reais com os presentes do app!

### 💡 Insight B: Usar Redes Agregadoras (Hubs de Afiliados)
*   Se afiliar diretamente à Amazon é fácil. Mas se afiliar diretamente ao Magazine Luiza, Shopee, Casas Bahia, Ponto Frio individualmente gerará 5 a 10 painéis administrativos e 5 a 10 limites mínimos de saque (ex: R$ 100 em cada) dispersando sua receita.
*   **Sugestão:** Utilizar um agregador brasileiro robusto como a **Lomadee** ou a **Socialsell**. 
    *   Com um único cadastro e uma única API, você tem acesso a Magalu, Amazon, Shopee, Americanas, etc.
    *   Toda a receita cai na mesma conta, facilitando o resgate do dinheiro e centralizando o rastreamento técnico via SubID unificado.

### 💡 Insight C: A Experiência "Urgência Comercial" (Gatilho Psicológico)
*   Muitas APIs de afiliados fornecem a ferramenta de "Consulta de Preço" (Product Advertising API).
*   **Ideia para a UI do Convidado:** No card do presente, podemos adicionar um aviso: *"🔥 15% OFF na Amazon hoje! Preço estimado de R$ 120 por R$ 102"*. Isso não apenas ajuda os noivos a ganharem o presente mais rápido, como empurra o convidado para o clique de afiliado em vez da transferência PIX comum, maximizando sua receita.

---

## 4. Proposta de Modelo de Dados (Revisão de Banco)

Para suportar essa arquitetura inteligente, proponho o seguinte esquema estendido ao **@architect**:

### Tabela `public.plataformas_afiliados` (Gerenciador Dinâmico de Lojas)
*   `id`: UUID (PK)
*   `nome_loja`: TEXT (ex: "Magazine Luiza")
*   `dominio_regex`: TEXT (ex: `.*magazineluiza\.com\.br.*` ou `.*magalu.*`)
*   `template_url_afiliado`: TEXT (ex: `https://url-da-rede.com/click?u={{url_limpa}}&subid={{clique_token}}`)
*   `segmento`: VARCHAR (ex: "eletro", "viagem", "decoracao")
*   `ativa`: BOOLEAN (Default TRUE - permite romper parcerias setando FALSE)

### Tabela `public.presentes_base` (O Catálogo Mestre)
*   `id`: UUID (PK)
*   `titulo`: TEXT
*   `imagem_url`: TEXT
*   `categoria`: TEXT
*   `preco_referencia`: DECIMAL
*   `ean_sku`: TEXT (Mapeamento cross-store)
*   `link_referencia`: TEXT

### Tabela `public.presente_cliques` (Log de Conversão & Reservas)
*   `id`: UUID (PK)
*   `presente_id`: UUID (FK para presentes)
*   `convidado_nome`: TEXT
*   `plataforma_afiliado_id`: UUID (FK para a tabela de regras dinâmicas)
*   `clique_token`: UUID (O subID enviado)
*   `feedback_status`: ENUM ('pendente', 'confirmou_compra', 'desistiu')
*   `data_reserva_expiracao`: TIMESTAMP (Gerado como NOW() + 3 horas para expiração automática)
*   `venda_consolidada`: BOOLEAN
*   `valor_comissao`: DECIMAL

---

## 5. Próximos Passos Recomendados

1.  **Definição da Tabela de Regras:** O **@architect** deve projetar os índices na nova tabela de Regex de Plataformas.
2.  **Criação do Modal Transparente:** O **@ux-ui** desenhará a jornada de transição explicativa do Convidado de 3 horas.
3.  **Trigger de Expiração Crítica:** Criar uma rotina de banco de dados (ex: pg_cron ou rotina de limpeza do Supabase Edge Function) que varre `presente_cliques` a cada N minutos e remove a flag de 'Reservado' caso a `data_reserva_expiracao` seja menor que NOW().

Excelente progresso, Operador! Avançamos para consolidar este plano refinado.
