# Plano de Implementação de Arquitetura: PRD-009

**Data:** 11 de Maio de 2026
**Status:** Rascunho Inicial (Fase ARQUITETURA)
**Responsável:** @Architect

---

## 🏛️ 1. Visão Geral Técnica

Este documento detalha o modelo de dados, fluxos de backend e integrações de API necessárias para injetar a Inteligência Artificial Híbrida e o Rastreador de Issues no ecossistema `suporte` da plataforma.

## 💾 2. Modelagem de Banco de Dados (Supabase SQL)

### 2.1 Extensões no Schema Existente
Devemos modificar a tabela `public.suporte_tickets` para gerenciar os estados de controle da máquina vs. humano.

```sql
-- Alterações em suporte_tickets
ALTER TABLE public.suporte_tickets 
ADD COLUMN bot_active BOOLEAN DEFAULT true,
ADD COLUMN needs_human_attention BOOLEAN DEFAULT false;

-- Índices para otimização da consulta de badges no sidebar
CREATE INDEX idx_tickets_human_attention ON public.suporte_tickets(needs_human_attention) 
WHERE needs_human_attention = true;
```

### 2.2 Novas Tabelas de Domínio

#### Tabela: `public.issues`
Centralizará todos os bugs detectados ou chamados pendentes gerados automaticamente.

```sql
-- Criação do Enum de Status da Issue
CREATE TYPE public.issue_status AS ENUM ('aberta', 'visualizada', 'em_correcao', 'corrigida');

CREATE TABLE public.issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.suporte_tickets(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    status public.issue_status DEFAULT 'aberta',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Habilitar RLS (Acesso Apenas ao Master)
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas Master pode gerenciar issues"
    ON public.issues
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true));
```

#### Tabela: `public.ai_config`
Guarda a configuração neural editável pelo painel de configurações.

```sql
CREATE TABLE public.ai_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE DEFAULT 'master_prompt',
    system_prompt TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- RLS: Somente Masters lêem/editam
ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Somente Master acessa AI Config"
    ON public.ai_config
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true));
```

---

## 📡 3. Desenho das Rotas de API (Endpoints)

### 3.1 `POST /api/support/chat/webhook`
**Responsabilidade**: Escuta novas mensagens do cliente.
**Fluxo de Decisão**:
1. Consulta se `suporte_tickets.bot_active` é `TRUE`.
2. Se `TRUE`, busca o `ai_config.system_prompt`.
3. Agrega o histórico das últimas 5 mensagens da tabela `suporte_mensagens`.
4. Envia para o Modelo de Linguagem (LLM) com `Tool Calls` (Chamada de Função).
   - Se o Modelo decidir abrir uma issue: O backend cria a linha em `public.issues`, seta `bot_active = FALSE` e `needs_human_attention = TRUE`.
5. Salva a resposta da IA em `suporte_mensagens` com `remetente_id` nulo (ou um ID fixo para o Bot).

### 3.2 `PATCH /api/support/tickets/[id]/control`
**Body**: `{ mode: 'ai' | 'specialist' }`
**Responsabilidade**: Atualiza a flag `bot_active`. Se mudado para `specialist`, limpa a flag `needs_human_attention`.

---

## 🗺️ 4. Mapa de Execução (Sprints)

### Fase 1: Infraestrutura e Banco
- [x] Executar migrations SQL no Supabase (Issues, AI Config e novas colunas).
- [x] Alimentar Seed inicial com prompt padrão de IA.

### Fase 2: Conexão de Inteligência (Backend)
- [x] Configurar SDK de IA com streaming no backend do Next.js.
- [x] Criar rotas `/api/support/ai-prompt` para salvar/carregar as configurações do Modal.
- [x] Criar fluxo de injeção de contexto e resposta automática.

### Fase 3: Engenharia de Interface (Frontend real)
- [x] Injetar o Componente `Switcher` (Sem emojis) no `page.tsx` real do suporte.
- [x] Criar o Modal de Configuração de Prompt no Topo do suporte.
- [x] Implementar o Kanban real consumindo `supabase.from('issues')` em tempo real.

### Fase 4: Notificações Visuais
- [x] Alterar o componente global `Sidebar.tsx` para fazer subscribe em tempo real da tabela `suporte_tickets` filtrando por `needs_human_attention = true`.

---
> **Próximo Passo:** Com este plano documentado, estamos prontos para rodar a **Migration do Banco de Dados**! Aguardando ordem para iniciar implementação técnica! 🚀🏗️
