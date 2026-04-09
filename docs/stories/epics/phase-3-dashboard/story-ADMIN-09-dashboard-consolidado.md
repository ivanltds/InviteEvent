# Story: ADMIN-09 - Dashboard Consolidado de Presença

## Status: Ready 📋

### Story
Como noivo/admin do sistema,
Quero visualizar um dashboard com métricas consolidadas de presença,
Para que eu possa gerenciar os custos do buffet e a ocupação do espaço em tempo real.

### Critérios de Aceite
1. **Métricas de Convites:** Exibir total de convites enviados vs. respondidos.
2. **Métricas de Pessoas:** Exibir total de pessoas confirmadas, recusadas e pendentes (soma de todos os membros nominais).
3. **Alertas:** Destacar visualmente quando o número de confirmados exceder o limite planejado inicialmente.
4. **Resumo Financeiro (Opcional):** Valor total em presentes recebidos (se vinculado ao módulo de presentes).

### Dev Notes
- Utilizar `reduce` no array de convites para calcular totais.
- Criar componentes de "Stats Cards" reutilizáveis.
- Local: `src/app/(admin)/admin/dashboard/page.tsx`.
