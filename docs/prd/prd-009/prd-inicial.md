# PRD-009: Omniscient Support Bot & Smart Issue Desk

## 📖 Visão Geral
O objetivo deste projeto é implementar um sistema de suporte de inteligência artificial híbrido (Bot + Humano) integrado a uma central de rastreamento de Issues (Erros e Chamados). A IA atuará como a primeira linha de defesa, treinada no contexto do ecossistema, capaz de criar tickets automaticamente e ceder o controle ao Master quando necessário.

## 🎯 Objetivos de Negócio
- **Redução de Custo Operacional**: Absorver 80% das dúvidas repetitivas de organizadores e convidados automaticamente.
- **Rastreabilidade de Erros**: Centralizar falhas técnicas ou situações não mapeadas em um "Kanban" de Issues para priorização.
- **Continuidade Híbrida**: Permitir que o administrador Master assuma o controle de conversas sensíveis instantaneamente sem perder o histórico.

---

## 🧱 Requisitos Funcionais (RF)

### RF001 - Painel de Treinamento da IA (Exclusivo Master)
- **Edição de Prompt Master**: O Administrador terá uma tela para definir o prompt sistêmico ("Core Directives") do Bot.
- **Contexto Estático e Dinâmico**: O campo de treinamento deve aceitar textos estruturados explicando os fluxos (RSVP, Presentes, Pagamentos, Configurações).
- **Base de Consulta de Issues**: O bot deve ter acesso em tempo real ao banco de dados de Issues anteriores (resolvidas ou abertas) como RAG ou contexto injetado para evitar redescobrir falhas já conhecidas.

### RF002 - Comportamento e Ética do Bot (Guardrails)
- **Tom de Voz**: Estritamente cordial, prestativo e resolutivo.
- **Bouncer de Segurança**: Proibido revelar regras de precificação interna, dados de outros usuários, arquitetura de banco de dados ou lógica de negócio confidencial.
- **Fallback Ativo**: Em caso de ambiguidade, incerteza ou loops de frustração do cliente, o bot DEVE pausar e invocar o suporte humano.

### RF003 - Fluxo Híbrido de Controle (Bot Flag)
- **Flag `bot_active`**: Por padrão, o chat opera sob o controle da IA.
- **Intervenção Manual**: O Master pode clicar em "Assumir Controle". 
  - **Ação**: O bot para de gerar respostas e envia uma mensagem padronizada avisando que um atendente assumiu o canal.
- **Notificação Visual**: Se o bot transferir o chat, o item de menu lateral "Suporte" no Admin receberá um Badge de Notificação (`Counter`) com o número de chats pendentes de ação humana.

### RF004 - Central de Rastreamento de Issues
- **Abertura Automática**: Se o Bot detectar que o usuário reportou um erro ("Página não abre", "PIX falhou") ou situação não documentada, ele gera um registro na tabela `issues`.
- **Congelamento de Resposta**: Após abrir uma issue, o bot suspende sua própria execução naquele chat para evitar agravar a situação com respostas genéricas.
- **Estados da Issue**:
  - `Aberta`: Criada automaticamente ou manualmente.
  - `Visualizada`: O master visualizou no painel.
  - `Em Correção`: Flag indicando que o time dev está atuando.
  - `Corrigida`: Estado final.
- **Auto-Reabertura**: Se a IA identificar um novo reporte com características idênticas a uma issue `Corrigida`, ela pode alterá-la para `Aberta` ou criar uma nova vinculada como reincidência.

---

## 📐 Requisitos Não Funcionais e Arquitetura de Dados

### Novas Tabelas Supabase Sugeridas:
1. `ai_training_config`: Registro único do prompt do bot (`system_prompt`).
2. `issues`: 
   - `id`, `title`, `description`, `status` (enum), `severity`, `chat_id` (opcional), `created_at`, `updated_at`.
3. `chat_sessions` (Extensão da tabela de suporte existente):
   - Coluna `bot_control_active` (boolean, default true).
   - Coluna `needs_human_attention` (boolean, default false).

### Integração de IA:
- Utilização do SDK OpenRouter/DeepSeek ou OpenAI com streaming.
- Criação de uma Edge Function ou API Route `/api/support/chat` gerenciando a orquestração de contexto (Histórico + System Prompt + Issues Recentes).

---

## 🛣️ Plano de Entregas Proposto (Fases)

1. **Fase 1 - Infra & Database**: Criação do schema de Issues, Configuração de Treinamento e Flags de Sessão.
2. **Fase 2 - Painel Admin do Master**: Tela de edição de treinamento + Tela Kanban de Issues.
3. **Fase 3 - Motor de Orquestração do Bot**: API de chat inteligente com injeção de contexto e detecção de erros.
4. **Fase 4 - Integração de UX Front**: Chat Widget atualizado, Badge no Sidebar e Alternador de Controle Manual.
5. **Fase 5 - Validação QA**: Simulação de cenários de fuga, tentativas de "jailbreak" da IA e testes de carga.

---
> **Aprovação Requerida:** @Operador, o PRD contempla fielmente o seu desejo de automação e controle para o suporte? Posso acionar a fase de Arquitetura?
