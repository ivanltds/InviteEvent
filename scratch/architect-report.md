# Relatório Técnico de Arquitetura - Projeto InviteEventAI

## 1. Visão Geral da Arquitetura
O projeto InviteEventAI é uma plataforma SaaS para gestão de convites de casamento e eventos, utilizando uma stack moderna:
- **Frontend**: Next.js 16 (experimental) com React 19.
- **Backend**: Next.js API Routes e Supabase.
- **Banco de Dados**: PostgreSQL (Supabase) com Row Level Security (RLS).
- **Integrações**: Stripe (pagamentos), Cloudinary (mídia).

A estrutura está organizada em rotas públicas `(public)` para convidados e rotas administrativas `(admin)` para organizadores.

## 2. Mapeamento de Funcionalidades Implementadas
- [x] **Autenticação**: Integrada com Supabase Auth.
- [x] **Multi-tenancy**: Isolamento de dados por `evento_id` (via RLS e serviços).
- [x] **Convites Dinâmicos**: Rota `/inv/[slug]` com temas customizáveis via variáveis CSS.
- [x] **RSVP**: Fluxo completo de confirmação, incluindo membros da família e restrições.
- [x] **Lista de Presentes**: Sistema de reserva de presentes com integração de comprovante PIX (via RPC `reservar_presente_v1`).
- [x] **Dashboard Admin**: Visão geral de estatísticas, gestão de convites e configurações do evento.
- [x] **Onboarding**: Wizard inicial para configuração do evento.
- [x] **Checkout**: Integração inicial com Stripe para ativação de eventos.

## 3. Descobertas e Pontos de Atenção (Bugs e Débito Técnico)

### 3.1 Riscos de Segurança Críticos (RLS)
- **Leitura Pública Permissiva**: As tabelas `convites`, `rsvp`, `convite_membros`, `configuracoes` e `presentes` possuem políticas de `SELECT` abertas (`USING (true)`). Isso permite que qualquer pessoa com a URL do Supabase enumere todos os convidados e respostas de todos os casamentos da plataforma.
- **Vulnerabilidade de Escrita**: A política de `INSERT` e `UPDATE` para `rsvp` e `convite_membros` não valida se o usuário tem direito de alterar aquele convite específico (falta verificação de token ou sessão para convidados).

### 3.2 Inconsistência de Migrações
- Existe um conflito entre o diretório oficial `supabase/migrations/` e o script `scripts/migrate.js` (que usa `docs/architecture/supabase-schema.sql`).
- O arquivo `supabase-schema.sql` está **obsoleto**, mantendo a tabela `configuracoes` como singleton, enquanto o código e as novas migrações já suportam multi-tenancy. **Risco de perda de dados ou quebra do ambiente se executado.**

### 3.3 Bugs Identificados
- **Countdown Hardcoded**: No `DashboardPage`, o cálculo de dias restantes está fixo para `'2026-06-13'`, ignorando a data real configurada no evento.
- **Timezone Offset**: Identificado comentário no código (`InvitationPage`) sobre offset de 1 dia em datas, indicando uma correção parcial, mas que ainda pode ser instável em diferentes fusos horários.
- **Busca de Convite**: A função `searchInvite` permite busca por `ilike` no nome principal, facilitando a exposição de convites privados por tentativa e erro.

### 3.4 Performance e Escalabilidade
- **Cálculo de Stats em Memória**: O método `getEventStats` busca todos os convites e calcula totais no cliente/servidor Node. Para eventos com +500 convites, isso se tornará ineficiente. Deveria ser substituído por uma `VIEW` ou `RPC` no Postgres.

## 4. Oportunidades de Melhoria Técnica

### 4.1 Arquitetura de Dados
- **Uso de RPC para Criação de Evento**: Atualmente, `eventService.createEvent` faz múltiplas chamadas (`insert event`, `insert organizer`, `insert config`). Isso deve ser movido para uma transação DB ou RPC para garantir atomicidade.
- **Triggers para Auditoria**: Implementar triggers para `updated_at` de forma consistente em todas as tabelas (algumas possuem, outras não).

### 4.2 Frontend
- **Abstração de UI**: Muitos componentes de seção (Historia, RSVP, etc.) estão no mesmo diretório. Sugere-se uma separação clara entre componentes "Dumb/UI" e "Smart/Features".
- **Tokens de Tema**: O sistema de temas via variáveis CSS em linha é bom, mas poderia ser centralizado em um hook `useTheme` para evitar repetição de lógica.

### 4.3 Supabase Security (Prioridade 0)
- Refinar RLS para que `SELECT` em `convites` exija o `slug` específico na query ou um `token` de acesso.
- Bloquear `SELECT` em `rsvp` e `convite_membros` para o público geral.

## 5. Conclusão
O projeto está em um estágio avançado de funcionalidades (MVP+), mas possui falhas estruturais de segurança e consistência de banco de dados que precisam de atenção imediata antes de uma escala real. A escolha por versões experimentais (Next 16/React 19) exige monitoramento constante de breaking changes.

**Próximos Passos Sugeridos:**
1. Unificar sistema de migrações e deletar `scripts/migrate.js` e `supabase-schema.sql` obsoletos.
2. Corrigir políticas RLS para fechar brechas de exposição de dados.
3. Corrigir bugs de UI (countdown e datas).
4. Otimizar queries de estatísticas.

---
*Relatório gerado por ARCHITECT em 2026-05-08.*
