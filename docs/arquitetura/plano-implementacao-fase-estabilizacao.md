# Plano de Implementação — Fase: Estabilização Técnica e Segurança

## Objetivo
Corrigir vulnerabilidades de segurança (RLS), bugs de UI e unificar o sistema de gerenciamento de banco de dados para garantir a confiabilidade da plataforma.

## Ações Prioritárias

### 1. Segurança e RLS (Prioridade 0)
- **Refatorar Políticas de Leitura**: 
  - Restringir `SELECT` na tabela `convites` para que convidados só vejam dados do seu próprio convite via `slug` (usando funções ou garantindo que a aplicação sempre filtre pelo slug).
  - Fechar `SELECT` público em `rsvp` e `convite_membros`. Apenas organizadores ou o próprio convidado (via token/slug validado) devem ler.
- **Validar Escrita (RSVP)**:
  - Criar uma RPC para submissão de RSVP que valide se o `convite_id` corresponde ao evento e se não houve manipulação de dados sensíveis.

### 2. Saneamento do Banco de Dados
- **Unificação de Migrações**:
  - Deletar `scripts/migrate.js` e `docs/architecture/supabase-schema.sql` para evitar uso acidental.
  - Consolidar todo o estado atual do banco em um `seed.sql` ou garantir que `supabase/migrations` seja a única fonte de verdade.
- **Atomicidade**:
  - Migrar lógica de `eventService.createEvent` para uma RPC `criar_novo_evento` no Supabase, garantindo que o evento, o dono e a config inicial sejam criados em uma única transação.

### 3. Correção de Bugs e Débito de UI
- **Dashboard Dinâmico**: 
  - Substituir data hardcoded no dashboard pela data real vinda de `configuracoes.data_casamento`.
- **Estatísticas Otimizadas**: 
  - Criar uma `VIEW` no Postgres `vw_estatisticas_evento` para calcular totais de convites e presentes de forma eficiente.
- **Tratamento de Datas**: 
  - Padronizar o uso de `date-fns` ou similar para evitar problemas de timezone identificados nos comentários do código.

### 4. Refatoração de Código
- **Abstração de Serviços**: 
  - Mover chamadas diretas de `supabase.from(...)` em componentes de página para métodos dedicados nos serviços.
- **Hooks de Tema**: 
  - Criar um hook `useTheme` para gerenciar as variáveis CSS de forma centralizada e reutilizável.

## Critérios de Aceite
- Nenhuma query `SELECT * FROM convites` executada anonimamente deve retornar dados de múltiplos eventos.
- O dashboard administrativo deve exibir o countdown correto para qualquer evento selecionado.
- `npm run migrate` (ou equivalente Supabase) deve ser o único comando necessário para configurar o banco.
