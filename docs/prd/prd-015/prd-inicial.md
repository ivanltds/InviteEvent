# PRD-015 — Emergência de Conversão & FOMO Ativo (O Booster de 30 Dias) 🚨🔥

> **Versão:** 1.0 | **Fase:** DESCOBERTA | **Data:** 15 de Maio de 2026  
> **Status:** AGUARDANDO REVISÃO / ARQUITETURA  
> **Contexto de Valor:** Resgate de receita e aceleração tática de transações para casamentos que estão na reta final (30 dias do evento) com 0 presentes adquiridos.

---

## 1. Visão Geral do Negócio & Problema
Estamos lidando com um gargalo emocional e financeiro crítico. O usuário escolheu nossa plataforma, mas conforme o casamento se aproxima, a ausência de presentes comprados gera ansiedade e insegurança no ROI do produto. 

A psicologia do consumidor no e-commerce nos diz que o ser humano age sob **Prova Social (Social Proof)** e **Urgência (FOMO)**. Se a lista de presentes parecer abandonada, os próximos convidados também hesitarão em ser os primeiros a comprar.

### 🎯 Meta Comercial
*   **Destravar a inércia:** Garantir a primeira venda em casamentos estagnados em até **72 horas** pós-ativação do módulo.
*   **Efeito manada:** Aumentar a conversão de checkout em no mínimo **35%** através de prompts de psicologia comportamental.

---

## 2. Requisitos Funcionais (RF)

### RF001 — Motor de Badges Pulsantes (FOMO Visual)
*   **Descrição:** Injetar badges interativos e elegantes nos cards de presente na vitrine pública de convidados baseados na telemetria viva.
*   **Regras de Injeção Visual:**
    *   **Selo "Favorito dos Convidados" (🔥):** Atribuído aos 3 itens com maior soma de cliques (`gift_click`) na telemetria histórica do evento.
    *   **Selo "Destaque da Semana" (⭐):** Para o item com mais views ou adições à cesta nas últimas 48h.
    *   **Badge de Visualização Simultânea (⚡):** Um alerta sutil: *"X pessoas viram recentemente"*, ativado se o item tiver mais de 2 visualizações individuais distintas nas últimas 24 horas.
*   **UX/UI:** Estética premium, com micro-animações suaves (fade in/out ou shimmer dourado) para não parecer um site de spam, e sim um clube de luxo.

### RF002 — Vitrine Autônoma (Smart Sorting AI Light)
*   **Descrição:** Reordenar a lista de presentes dinamicamente com base no engajamento real da telemetria.
*   **Mecânica do Algoritmo:**
    *   **Fator de Peso (Score de Interesse):**
        *   Clique em comprar/PIX: **+5 pontos**
        *   Adição à Cesta: **+3 pontos**
        *   Visualização do Modal (>5 segundos): **+1 ponto**
    *   Os itens com maior pontuação são **puxados para o topo da vitrine** automaticamente ao invés de seguir estritamente a ordem de inserção manual.
    *   *Exceção de Resiliência:* Itens que já estão 100% comprados (ou com todas as cotas esgotadas) continuam sendo empurrados para o final da lista para não bloquear itens disponíveis.

### RF003 — O Price Suggester (Advisory Admin para os Noivos)
*   **Descrição:** Central de avisos e sugestões no dashboard do admin para ajudar os noivos a destravarem seus próprios itens estagnados.
*   **Lógica do Consultor de IA:**
    *   Se o casamento está a `< 45 dias` do evento AND a receita acumulada é `zero`:
        *   O admin exibe um Card de Alerta Inteligente: *"Queremos te ajudar a ganhar seus primeiros presentes! 🎁"*.
    *   **Gatilhos de Sugestão Específicos:**
        *   **Ticket Alto sem Cota:** Se houver item individual com preço `> R$ 350` e `permite_cotas = false`, sugerir ativamente um botão de ação rápida: *"Que tal dividir o item [Nome] em 5 cotas de [Valor]? Isso aumenta as chances de venda em 35%!"*
        *   **Corte de Preço:** Identificar itens visualizados, mas não convertidos (fuga) e sugerir um desconto real ou quebra em cotas menores.
*   **Ação Rápida:** O noivo clica em "Aplicar Sugestão" e o sistema altera instantaneamente o registro no Supabase sem precisar abrir o formulário de edição de presentes.

---

## 3. Requisitos Não-Funcionais (RNF)
1.  **Performance de Renderização:** O processamento do Score de Interesse para ordenação da vitrine deve rodar em menos de **100ms** no servidor ou ser efetuado client-side com os dados já hidratados, evitando atrasos visualmente perceptíveis (FCP) na abertura da vitrine.
2.  **Cache de Agregação:** A consulta na tabela `analytics_events` para coletar cliques e visualizações do dia deve ser cacheada por 1 minuto (60s) para não sobrecarregar as conexões do Supabase se muitos convidados acessarem a vitrine ao mesmo tempo.

---

## 4. O Que NÃO Entra Neste Escopo (Out of Scope)
*   Envio automático de e-mails ou disparos de WhatsApp ativamente (essas notificações ficam para a FASE 3 do Roadmap).
*   Reordenamento baseado em Inteligência Artificial complexa/Machine Learning na nuvem (usaremos agregações SQL simples para o MVP do Algoritmo).

---

## 5. Matriz de Aceite do QA (Draft)
*   **Cenário 1:** Convidado abre a lista de presentes. Os 3 itens mais clicados historicamente aparecem obrigatoriamente nas primeiras posições da lista e carregam o selo "Favorito".
*   **Cenário 2:** Noivo acessa painel de presentes. O sistema exibe um banner de alerta inteligente sugerindo o fracionamento de uma geladeira de R$ 1.500 em cotas. Ao aceitar, o item é atualizado instantaneamente e o alerta some.

---

> **Validação Requerida:** Operador (@Ivan), este PRD Inicial cobre a dor do seu casamento piloto e as mecânicas táticas que você espera ver em produção? Se sim, avançaremos para a fase de **Experiência/Arquitetura**.
