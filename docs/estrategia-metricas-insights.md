# Framework de Estratégia de Métricas e Insights Operacionais
> Status: Oficial | Versão: 1.0 | Responsável: BA / Maestro

## 📈 Visão Geral
Com a implantação do Suporte Inteligente V2, passamos de uma arquitetura plana (Ticket Isolado) para uma arquitetura de **Grafos Semânticos Correlacionados** (Issues X Clientes Afetados). Essa mudança estrutural permite que extraiamos valor de BI (Business Intelligence) exponencial em tempo real.

---

## 📊 Matriz de KPIs Estratégicos

### 1. Índice de Gravidade por Impacto Acumulado (Heatmap)
*   **Como calcular:** Quantidade de `suporte_tickets` vinculados a uma única `issue` ativa.
*   **O Insight:** Identificar qual falha está incomodando mais PESSOAS simultaneamente, em vez de apenas qual foi reportada primeiro.
*   **Ação de Negócio:** Ordenar o backlog de correções (Kanban) automaticamente pelo peso de chamados vinculados para maximizar o NPS instantaneamente.

### 2. Eficiência de Deduplicação Semântica (Clustering)
*   **Como calcular:** `Total de Chamados Interceptados / Total de Issues Únicas Criadas`.
*   **O Insight:** Mede o quanto a plataforma está sofrendo de falhas "sistêmicas" (um bug que quebrou para todos) versus falhas "pontuais" (erros individuais de uso).
*   **Ação de Negócio:** Um aumento repentino neste rácio aponta para um "incidente crítico" de plataforma que requer reversão de código imediata (Rollback).

### 3. ROI do Desbloqueio Coletivo (Multi-Resolver Time)
*   **Como calcular:** Quantidade de chamados resolvidos simultaneamente em uma única transição de status no Kanban.
*   **O Insight:** Cada Issue arrastada para "Corrigida" economiza `N * tempo_médio_de_resposta_humano`.
*   **Ação de Negócio:** Monitorar o tempo total economizado da equipe técnica pela automação de broadcast de mensagens pós-correção.

### 4. Taxa de Transição Bot -> Humano (Escalation Rate)
*   **Como calcular:** Porcentagem de chamados onde `needs_human_attention` tornou-se `true`.
*   **O Insight:** Quanto maior essa taxa, menor está sendo a utilidade autônoma da IA nas dúvidas gerais.
*   **Ação de Negócio:** Recalibrar o `System Prompt` na tela de "Configuração Neural" para dar mais autonomia ou contexto ao bot sobre temas que geram muitas fugas para o suporte humano.

---

## 🚀 Direcionamento do Produto (Próximos Passos)

1.  **Módulo de Telemetria:** Criar futuramente uma view SQL Materializada agregando o agrupamento de Issues por volume para plotagem de gráficos no Dashboard Admin (`/admin/intelligence`).
2.  **Filtro de Prioridade:** Atualizar o frontend do Kanban para opcionalmente ordenar as colunas colocando as Issues com MAIS chamados no topo automaticamente.

*Documento consolidado pelo Agente @ba em conformidade com a diretriz de Melhoria Contínua.*
