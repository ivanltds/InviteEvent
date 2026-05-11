# Registro de Entrega - Suporte de Inteligência V2 (Kanban & Realtime)

## 1. Mudanças Realizadas
### Backend & Arquitetura de Dados
- **Inversão de Chave Estrangeira:** Removido `ticket_id` da tabela `issues`. Adicionado `issue_id` na tabela `suporte_tickets`, permitindo que uma Issue contenha N chamados (Relação 1-para-N).
- **Correção de Vínculo (Join Erro 500):** Criada chave estrangeira direta `support_tickets_perfis_fk` entre `suporte_tickets(usuario_id)` e `perfis(id)`, resolvendo a falha no roteamento interno do Next.js.
- **Ativação de Replicação Realtime:** Executado `ALTER PUBLICATION supabase_realtime ADD TABLE public.issues`, permitindo que o quadro Kanban atualize sozinho sem F5.
- **Políticas de RLS:** Adicionadas políticas permissivas para `INSERT`, `SELECT` e `UPDATE` na tabela `issues` para que a API de backend e as consultas frontend funcionem sem bloqueios do Supabase.

### Engine de IA (`aiSupportService.ts`)
- **Atualização de Modelo:** Transição total de `gpt-3.5-turbo` para o avançado `gpt-4o-mini`.
- **Nova API de Tools:** Substituição da API depreciada de Functions pela nova API robusta de `tools`.
- **Motor de Deduplicação Semântica (`SmartEngine`):** Antes de criar qualquer issue, o sistema faz uma consulta real ao cérebro da IA comparando o novo relato com TODAS as issues ativas. Se o significado for o mesmo (mesmo com termos diferentes), a IA faz o agrupamento (Merge) automático em vez de gerar duplicatas.

### Frontend & UX (`admin/suporte/page.tsx`)
- **Visualizador de Impacto:** Adicionado badge `👥 X Chamados` em cada card do Kanban, indicando densidade do problema.
- **Identificação de Afetados:** Adicionada linha de contexto "Afeta: Nome/Email" embaixo do título da issue, com fallback inteligente (Nome -> E-mail -> Cliente).
- **Realtime Channel:** Instalado ouvinte global na tabela de issues no frontend, disparando rerender instantâneo na tela no recebimento de novas tarefas.
- **Broadcast de Resolução:** Configurada automação na API que ao arrastar um card para 'Corrigida', envia mensagens simultâneas para todos os chats atrelados àquela issue avisando do conserto.
