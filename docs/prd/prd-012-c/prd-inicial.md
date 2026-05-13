# PRD-012-C: Smart Gift List — Cérebro Autônomo (Self-Healing AI)
> **Fase:** DESCOBERTA (Escopo Consolidado - Bloco C)  
> **Autor:** @catalog-expert & @maestro  
> **Status:** PLANEJADO (Fase 3)  
> **Objetivo:** Escalar a gestão de catálogo de forma autônoma, garantir preços ótimos, autorregenerar links quebrados (Self-Healing) e munir o Master de observabilidade total.

---

## 1. Visão Geral do Bloco C
Esta fase consolida a automação por Inteligência Artificial. Ativamos o bot/agente `@catalog-expert` para atuar nos bastidores da plataforma, livrando o Master do trabalho operacional. Ele vigiará preços e estoques da Watchlist diariamente, e autogerenciará a integridade de todos os links do gateway, auto-reparando links caídos (404) com total rastreabilidade em logs para o Cockpit administrativo.

---

## 2. Requisitos Funcionais Detalhados

### RF01 - Agente de Catálogo Autônomo (@catalog-expert Daemon)
*   Um processo recorrente acionado diariamente (cron/edge execution).
*   Consome a lista de monitoramento da tabela `public.watchlist_itens` (definida em conjunto pelo Master e pela IA).
*   **Varredura Diária:** Consulta as APIs conectadas para buscar ofertas atualizadas, menores preços de mercado e indisponibilidade de estoque.

### RF02 - Otimização e Comparação de Custo Total (Preço + Frete)
*   Sempre que a API parceira retornar estimativas de logística, o Agente deve calcular a soma `Custo Total = Preço de Vitrine + Frete Médio`.
*   O sistema altera a URL padrão do produto base para apontar **exclusivamente para o parceiro campeão de menor preço total**, economizando o bolso do convidado e forçando a conversão de afiliado.

### RF03 - Deduplicação Absoluta de SKUs
*   Mecânica em banco para evitar duplicidade de cadastros.
*   Se duas lojas oferecerem exatamente a mesma batedeira EAN/SKU, o Agente unifica o card em apenas 1 registro no Catálogo SaaS Base, definindo a melhor loja como link primário e as demais como redundância no banco.

### RF04 - Fila de Ajuste e Auto-Recuperação de Links (Self-Healing)
*   **Mapeador de Quebras:** Todo clique monitorado pelo gateway que falhar, ou scraping de catalogação que retorne 404 (Produto Removido), cria uma entrada automática na tabela `public.fila_ajuste_links`.
*   **Cura Autônoma:** O Agente `@catalog-expert` escuta essa fila, lê o EAN/Título, aciona a API Lomadee/Lojas em busca de uma nova URL ativa para o mesmo produto e, ao obter sucesso, aplica o "patch" autônomo na base restaurando o link funcional na hora.

### RF05 - Cockpit de Observabilidade Operacional (Audit Trails)
*   O cockcpit registrará logs visíveis detalhando cada passo da autorregeneração para que você acompanhe o trabalho da IA nos bastidores.
*   **Passos do Rastreio:** `Erro Mapeado` -> `Enfileirado para IA` -> `Busca de Fallback via API` -> `URL Substituída` -> `Status: Resolvido com Sucesso`.

### RF06 - Evolução do Cockpit Master Intelligence (Painel Unificado)
*   Incrementar a página administrativa já existente (`src/app/(admin)/admin/intelligence/page.tsx`) com a terceira Tab: **"Monetização & Automação"**.
*   **Área de Observabilidade:** Exibir a tabela da Fila de Ajuste (Logs da IA) e o status ativo dos rastreadores da Watchlist.
*   **Área de Reconciliação:** Interface de Drag-and-Drop para Upload do CSV de vendas mensal da Lomadee. O sistema cruza as transações offline com a tabela `presente_cliques` populando o faturamento e KPIs de comissão consolidados.

---

## 3. Entidades de Banco de Dados (DDL Rascunho)
*   `public.watchlist_itens`: Monitoramento diário de SKUs e menor preço.
*   `public.fila_ajuste_links`: Fila de observabilidade e status da cura autônoma (logs).

---

## 4. Critérios de Aceite (Milestone C)
1. [ ] O painel Master Intelligence exibe a tabela de erros com logs de "Cura" da IA em tempo real.
2. [ ] O Agente consolida a melhor oferta somando frete e atualiza a base de preços diariamente.
3. [ ] Upload do CSV da Lomadee identifica e credita compras com tokens de clique gerados anteriormente.
