# STORY-048: Dashboard de Métricas do Evento (Refined)

## Descrição
Como organizador, desejo uma tela de resumo (Dashboard) para o evento selecionado, que me dê uma visão rápida do "pulso" do casamento sem precisar navegar em várias tabelas.

## Requisitos Detalhados
1. **Cards de Resumo:**
   - **Convidados:** Total vs Confirmados (barra de progresso visual).
   - **Presentes:** Valor total acumulado em R$ (estimado).
   - **Data:** Contagem regressiva (X dias para o Sim).
2. **Atividades Recentes:**
   - Lista das últimas 5 confirmações de RSVP.
   - Lista dos últimos 3 presentes reservados.
3. **Filtro Ativo:** Todos os dados devem ser filtrados rigorosamente pelo `currentEvent.id`.
4. **Gráfico de Status (Opcional/MVP+):** Gráfico de pizza simples mostrando Confirmados, Recusados e Pendentes.

## Critérios de Aceitação (QA)
- [ ] GIVEN um evento sem convites WHEN abrir dashboard THEN as métricas devem mostrar zero (não null).
- [ ] GIVEN uma nova confirmação de RSVP WHEN atualizar dashboard THEN o contador deve subir em tempo real (ou após refresh).
- [ ] GIVEN um evento passado THEN o contador de dias deve mostrar "Evento Realizado".

## Status: ✅ DONE 🏆

## Notas de Implementação
- `/admin/dashboard/page.tsx` (6KB) com cards de resumo e atividades recentes
- `Dashboard.module.css` com visual premium
- Filtrado por `currentEvent.id` via EventContext
