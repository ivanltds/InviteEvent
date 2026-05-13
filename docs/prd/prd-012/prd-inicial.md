# PRD-012: Smart Gift List & Affiliate Engine (Cura Autônoma)
> **Fase:** DESCOBERTA (PRD Consolidado - v2)  
> **Autor:** @ba, @marketplace-expert & @maestro  
> **Status:** 100% VALIDADO & CONSOLIDADO  
> **Objetivo:** Vitrine base inteligente, monetização Lomadee, reserva de 3h via WhatsApp e Motor de Cura Autônoma de Catálogo por Agente de IA.

---

## 1. Escopo Consolidado de Funcionalidades

### 📦 Experiência dos Noivos & Curadoria
1.  **Categorias Dinâmicas:** 8 a 12 categorias canônicas definidas (Cozinha, Eletrodomésticos, Cama & Banho, Decoração, Lazer, Eletrônicos, Móveis, Lua de Mel/Cotas).
    *   **Ordenação Inteligente de Categorias:** Na vitrine, as abas/chips de categorias são reordenadas dinamicamente priorizando as categorias com maior CTR/CVR combinado no momento, elevando a conversão visual.
2.  **Importação 1-Clique:** Copia instantaneamente presentes do Catálogo Base Global para a lista privada dos noivos.
3.  **Widget de Tendências Diário:** Painel exibe atualizações diárias (antes semanais) de produtos em alta no mercado de casamentos.

### 🎁 Experiência do Convidado & Reservas
4.  **Transparência & Consentimento (Reserva de 3h):** Antes do redirecionamento, modal intersticial de 3 segundos explica a trava de 3 horas.
5.  **Notificação WhatsApp & Liberação de Trava:** 
    *   Disparo de confirmação de reserva no WhatsApp do Convidado/Noivos (se integrado).
    *   **Remoção Ativa de Reserva:** Se o mesmo convidado reabrir a lista usando o mesmo token/convite, um botão `[ Cancelar Reserva ]` estará disponível no card, permitindo que ele libere o produto voluntariamente antes das 3 horas caso desista.
6.  **Regra PIX Prioritário:** O fluxo de PIX é soberano. Se o mesmo convidado que realizou a reserva concluir o PIX, a reserva de 3h cai e o item é trancado em definitivo como "Ganho". Outros convidados não conseguem efetuar PIX enquanto a reserva de 3h de terceiro estiver ativa.

### 🧠 Inteligência, Automação & Cura (Self-Healing Ecosystem)
7.  **Tela Master Intelligence Incrementada:** O painel administrativo já existente (`src/app/(admin)/admin/intelligence`) ganhará a aba "Afiliados & Monetização", contendo os relatórios de conversão e a área de Upload de CSV de consolidação da Lomadee.
8.  **Fila de Ajustes & Observabilidade (Self-Healing Links):** Sistema em background que mapeia cliques que falham ou URLs offline (404), enviando-as para uma Fila de Erros visível no Cockpit Intelligence, com rastreabilidade total de cada passo da correção autônoma.
9.  **Agente de Catálogo Autônomo (@catalog-expert):** Um processo/agente dedicado que varre diariamente a `public.watchlist_itens` (lista de monitoramento diário construída pelo Master e pelo Agente). 
    *   Busca promoções e menor preço total (considerando frete via API).
    *   Elimina duplicidades de produtos de forma autônoma.
    *   Atualiza a Vitrine Global sempre priorizando a loja parceira com melhor margem de preço ao convidado.

---

## 2. Entidades de Dados Adicionais
*   `public.categorias`: Tabela de controle de slugs, nomes e contadores de pesos para ordenação dinâmica.
*   `public.watchlist_itens`: SKU, EAN e URLs monitorados diariamente pelo motor de comparação de preços.
*   `public.fila_ajuste_links`: Registro de links monitorados que falharam, tentativas de cura automática e logs de observabilidade (status: `pendente`, `corrigindo`, `resolvido`).

---

## 3. Critérios de Aceite Atualizados
1. [ ] O convidado consegue cancelar uma reserva ativa dele antes das 3 horas na própria listagem.
2. [ ] A vitrine de categorias ordena as abas dinamicamente conforme a popularidade (CTR/CVR).
3. [ ] O painel Master Intelligence exibe a fila de erros de links com rastreamento e botão para "Cura Manual/Autônoma".
4. [ ] O Agente de Catálogo processa diariamente a watchlist e atualiza o melhor preço, frete e link limpo.
