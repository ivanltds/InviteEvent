# Plano de Implementação: Telemetria de Suporte & IA (Fase 2 Extensão)
> Documento Oficial do Arquiteto | Data: 2026-05-11

## 🎯 Escopo Técnico
Integrar na tela de `/admin/intelligence` o novo módulo de análise de densidade semântica, medindo a eficácia do suporte automatizado, volume de chamados interceptados e saúde do classificador LLM.

---

## 📂 Fase 1: Backend & Agregações (API Layer)

### A. Novo Endpoint de Negócio
Criar `src/app/api/intelligence/support/route.ts` com suporte a `GET`.
- **Query 1 (Agregados Gerais):** Contar Total de Chamados, Chamados c/ `needs_human_attention=true` vs `false` (Taxa de Autonomia).
- **Query 2 (Densidade Semântica):** 
  ```sql
  SELECT i.id, i.titulo, COUNT(st.id) as ticket_count 
  FROM issues i 
  LEFT JOIN suporte_tickets st ON st.issue_id = i.id
  GROUP BY i.id, i.titulo
  ORDER BY ticket_count DESC
  LIMIT 5;
  ```
- **Query 3 (Série Temporal):** Agrupar por Dia/Hora para alimentar o gráfico de Correlação.

---

## 🖥️ Fase 2: Frontend & Visualização (UI Layer)

### A. Estrutura de Abas em `intelligence/page.tsx`
Refatorar o atual container de dashboard para introduzir o estado `activeTab`:
1. `Visão Geral` (Atual)
2. `🤖 Suporte & IA` (Nova)

### B. Implementação dos Componentes Gráficos
1. **KPI Matrix Container:** 4 Cards reutilizando o design system existente, mapeando as variáveis retornadas pela API.
2. **ChartJS Integration:** 
   - Tipo: `'line'`
   - Dataset 1: `Chamados Recebidos` (Volume Bruto)
   - Dataset 2: `Issues Criadas` (Volume Filtrado pelo Cérebro)
   - *Objetivo Visual:* O "Gap" entre a linha de chamados (alta) e a linha de issues (baixa) prova graficamente a eficiência da deduplicação.
3. **Heatmap Side-Panel:** Uma lista estilizada iterando as Issues Top 5 ranqueadas pela contagem de tickets agregados.

---

## 🧪 Fase 3: Observabilidade & CI (Audit)
Integrar os resultados do novo `tests/ai/pipeline_evaluator.ts` gravando o resultado final num histórico ou consumindo diretamente a volumetria de acertos para plotar o "Gauge de Saúde da IA" exibido no Wireframe.

---

## ✅ Checklist de Definição de Pronto (DoD)
- [ ] Endpoint `/api/intelligence/support` retorna dados agregados corretos.
- [ ] Interface de Dashboard suporta comutação limpa de Abas.
- [ ] Gráfico de correlação semanticamente fiel renderizado via Chart.js.
- [ ] Build produção (`npm run build`) limpo e validado.

*Aprovado por @architect em conformidade com o Plano Global.*
