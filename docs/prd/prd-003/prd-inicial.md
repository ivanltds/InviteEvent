# PRD-003 — Gestão do Master e Suporte por Chat (SLA 2h) 💬
> Versão: 1.0 | Data: 2026-05-09 | Status: CONCLUÍDO (Concluído)

## 1. Visão Geral do Produto
Para elevar a maturidade do SaaS **InviteEventAI**, precisamos prover um canal de comunicação de alta fidelidade e suporte direto para os organizadores e donos de eventos (donos de contas/Admins/Owners). O **Master Admin** (administrador global do sistema) atuará como agente solucionador, gerindo tickets gerados por sessões de chat em tempo real com um acordo de nível de serviço (SLA) agressivo de 2 horas.

## 2. O Problema
Atualmente, donos de casamentos e eventos não possuem um canal direto de ajuda dentro da plataforma quando se deparam com dúvidas de configuração de cotas, uploads de vídeos grandes ou edição de convidados. Isso aumenta a insatisfação e pode levar ao churn. Para o Master, falta uma visão consolidada e analítica da saúde do suporte, volumetria de dúvidas e performance de atendimento.

## 3. Objetivos de Negócio
- **Reter Clientes**: Reduzir o tempo médio de resposta para dúvidas críticas, aumentando o NPS.
- **Suporte de Elite**: Garantir SLA de no máximo 2 horas em todas as sessões de suporte abertas.
- **Centralização Administrativa**: Oferecer ao Master uma tela única com histórico completo de interações por cliente/evento.
- **Gestão Baseada em Dados**: Monitorar performance, picos de atendimento e tempos de resolução.

---

## 4. Escopo Funcional Detalhado

### 4.1. O Botão Flutuante de Chat (Admin View)
- **Localização**: Canto inferior direito das telas do painel administrativo do organizador.
- **Visual**: Ícone flutuante animado, minimalista e de alta-costura, perfeitamente integrado ao design system (cores Royal Gold e Midnight Ink).
- **Interface do Usuário (Organizador)**:
  - Ao clicar, abre um painel de chat compacto.
  - Exibe o histórico de atendimentos anteriores daquele usuário específico.
  - Opção para iniciar uma nova conversa. Ao fazer isso, cria-se automaticamente um novo **Ticket de Atendimento**.

### 4.2. O Ciclo de Vida do Ticket e SLA
- **Campos do Ticket**: ID, UUID do Usuário, Evento associado, Status, Data de Abertura, Data de Atualização, Tempo de SLA restante.
- **Statuses permitidos**:
  1. `aguardando_atendimento` (Aguardando resposta inicial do Master)
  2. `em_atendimento` (Master respondeu e está conversando)
  3. `finalizado` (Resolvido)
  4. `cancelado` (Interrompido)
- **Regra de SLA (2 horas)**:
  - O relógio de SLA começa a correr a partir do momento em que o ticket é criado (`aguardando_atendimento`).
  - O painel do Master exibe alertas visuais regressivos (verde -> amarelo -> vermelho urgente) baseados no tempo restante do SLA.

### 4.3. Painel do Master (Master Control View)
- **Histórico de Clientes**: Lista unificada de todos os organizadores cadastrados na plataforma.
- **Histórico de Atendimentos**: Detalhes de todas as conversas anteriores e tickets daquele cliente, permitindo auditar o canal.
- **Controle de Status**: Somente o Master tem permissão para alterar o status do ticket (`em_atendimento`, `finalizado`, `cancelado`).

### 4.4. Dashboard de Métricas de Atendimento (Master Stats)
Painel analítico e visual contendo:
- **Atendimentos por Evento/Cliente**: Volumetria de suporte demandada por cada casamento/evento.
- **Picos de Períodos**: Gráficos de atendimentos diários, semanais ou mensais.
- **Tempo Médio de SLA**: Média geral de tempo decorrido entre a abertura do ticket e o primeiro contato/resolução.
- **Distribuição de Status**: Gráfico circular/barra mostrando a proporção de tickets ativos, finalizados ou pendentes.

---

## 5. Arquitetura de Banco de Dados Sugerida (DevOps Core)
Duas novas tabelas serão criadas sob o esquema público:
1. `suporte_tickets`:
   - `id` (UUID, PK)
   - `usuario_id` (UUID, FK para auth.users)
   - `evento_id` (UUID, FK para eventos)
   - `status` (Enum: aguardando_atendimento, em_atendimento, finalizado, cancelado)
   - `created_at` (Timestamp)
   - `updated_at` (Timestamp)
2. `suporte_mensagens`:
   - `id` (UUID, PK)
   - `ticket_id` (UUID, FK para suporte_tickets)
   - `remetente_id` (UUID, FK para auth.users)
   - `conteudo` (Text)
   - `created_at` (Timestamp)

---

## 6. Fases de Implementação Propostas
Seguindo o feedback de **Melhoria Contínua**, o PRD-003 será dividido nas seguintes fases modulares e incrementais:

### 🚀 Fase 1: Infraestrutura de Banco e API de Tickets
- Criação das tabelas no Supabase com RLS rígido (Usuários comuns só veem seus tickets; Master vê tudo).
- Rotas de API (`/api/support/tickets` e `/api/support/messages`).
- **Validação de QA (TDD)**: Testes unitários de inserção e RLS.

### 🎨 Fase 2: Interface do Usuário (Botão Flutuante & Chat)
- Botão flutuante no painel admin com animação de entrada.
- Chat Widget compacto com mensagens reativas e histórico do cliente.
- **Validação de QA (TDD)**: Testes E2E simulando a abertura de chat e envio de mensagens pelo organizador.

### 🧭 Fase 3: Central do Master (Histórico e Gestão de Status)
- Painel exclusivo do Master em `/admin/master/suporte`.
- Listagem de clientes com histórico de tickets associados.
- Controle reativo de status do ticket.
- **Validação de QA (TDD)**: Testes E2E de alteração de status pelo Master e sincronização no chat do usuário.

### 📊 Fase 4: Suporte Dashboard (Métricas e SLA Analytics)
- Visualização de KPIs de performance (média de SLA de 2h, contagem de status, volumetria por período).
- Alertas visuais regressivos de estouro de SLA.
- **Validação de QA (TDD)**: Testes unitários para cálculos de médias de SLA e cobertura total.
