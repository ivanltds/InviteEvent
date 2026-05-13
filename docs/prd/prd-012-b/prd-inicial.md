# PRD-012-B: Smart Gift List — Motor de Monetização & Reservas
> **Fase:** DESCOBERTA (Escopo Consolidado - Bloco B)  
> **Autor:** @marketplace-expert & @maestro  
> **Status:** PLANEJADO (Fase 2)  
> **Objetivo:** Monetizar tráfego qualificando cliques de parceiros Lomadee, garantindo integridade de estoque por 3h e transparência total ao convidado.

---

## 1. Visão Geral do Bloco B
Esta fase introduz o motor de faturamento indireto. Ao direcionar convidados para lojas de varejo parceiras, a plataforma gera receita via afiliados Lomadee. Para evitar duplicidade de presentes e conflitos, implementamos a Trava Curta de Estoque (3 horas) e o redirecionamento transparente com observabilidade sobre o tráfego externo.

---

## 2. Requisitos Funcionais Detalhados

### RF01 - Motor Dinâmico de Lojas (Affiliate Rules Engine)
*   Criação da tabela `public.plataformas_afiliados` gerenciada via banco de dados pelo Master.
*   Deve conter: `nome_loja`, `dominio_regex` (ex: `.*magazineluiza.*`), `template_url_afiliado` (ex: `https://lomadee.com/click?u={{link}}&source={{clique_token}}`) e flag `ativa`.
*   **Comportamento:** Permite adicionar novas lojas ou remover/romper contratos instantaneamente sem mexer no código da aplicação (Deploy Zero).

### RF02 - Intersticial de Transparência & Consentimento (3s Hold)
*   Ao clicar em "Comprar na Loja Parceira", a aplicação intercepta a navegação e renderiza um modal/tela intermediária elegante por 3 a 4 segundos.
*   **Texto Mandatório:** *"Redirecionando com segurança... Para evitar presentes duplicados, estamos reservando este item por até 3 horas na nossa lista para que você finalize a compra!"*.
*   Deve fornecer um botão visual de "Ir Agora" e uma barra de carregamento progressiva.

### RF03 - Trava Curta de Estoque (Reserva de 3 Horas)
*   No momento do clique, uma entrada é inserida em `public.presente_cliques` registrando o UUID exclusivo de rastreio e gerando a `data_expiracao = NOW() + INTERVAL '3 hours'`.
*   Durante esse intervalo, o card exibe a etiqueta *"Reservado por [Nome]"* e impede que outros convidados o cliquem ou comprem via PIX.
*   **Sinalização:** Disparo automático (trigger/webhook) para notificar sobre a reserva via WhatsApp (noivos/convidados conforme configuração existente).

### RF04 - Auto-Liberação de Reserva (Self-Release Button)
*   Se o convidado que realizou a reserva desistir da compra e reabrir a lista do casamento usando o mesmo convite/sessão, o card exibirá um botão exclusivo de desbloqueio.
*   **Ação:** `[ Cancelar Reserva / Liberar Item ]`. O clique invalida o timestamp imediatamente no banco, liberando o presente na vitrine sem precisar esperar o fim das 3 horas.

### RF05 - Soberania de PIX Concorrente (Lock Integrity)
*   O fluxo de arrecadação em PIX/Cotas virtuais permanece com a prioridade mais alta.
*   Se o convidado que **detém a reserva de 3h** decidir, dentro do prazo, efetuar o PIX direto em vez de comprar fora, a transação de PIX cancela a trava temporária e tranca o item em definitivo como "Ganho via PIX". Concorrentes não conseguem intervir.

### RF06 - Gateway de Redirecionamento (Attribution Tracking)
*   A rota `/api/redirect/gift?id=XXX` resolve o link final substituindo o token dinâmico de clique Lomadee no template da tabela de regras, gravando a intenção de tráfego antes do HTTP 302 Redirect.

---

## 3. Entidades de Banco de Dados (DDL Rascunho)
*   `public.plataformas_afiliados`: RegEx, templates de links, status ativo.
*   `public.presente_cliques`: FK presente, token de rastreio, expiracao da reserva (3h), feedback de compra.

---

## 4. Critérios de Aceite (Milestone B)
1. [ ] O link externo abre já envelopado com a tag Lomadee e o UUID de rastreamento correto.
2. [ ] A tela intermediária avisa com clareza sobre a reserva de 3 horas antes de direcionar o usuário.
3. [ ] O convidado que reservou consegue destravar o item manualmente no card.
4. [ ] Ao expirar 3 horas, a rotina do banco devolve o item à vitrine automaticamente.
