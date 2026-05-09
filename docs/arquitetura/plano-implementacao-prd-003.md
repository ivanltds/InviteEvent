# Plano de Implementação de Arquitetura — PRD-003 🧭
> Responsável: Software Architect | Data: 2026-05-09 | Status: ARQUITETURA (Em Revisão)

Este plano descreve o design de arquitetura, modelagem de tabelas de banco de dados, políticas de RLS de segurança e endpoints de API para implementar o suporte por chat e gestão do Master.

---

## 1. Modelagem do Banco de Dados (Supabase / PostgreSQL)

Seguindo a política do **DevOps** de manter rigor técnico absoluto, criaremos duas tabelas fundamentais.

### 1.1. Tabela `suporte_tickets`
Responsável por persistir o cabeçalho e estado de cada sessão de conversa:
```sql
CREATE TYPE support_status AS ENUM ('aguardando_atendimento', 'em_atendimento', 'finalizado', 'cancelado');

CREATE TABLE public.suporte_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    evento_id UUID REFERENCES public.eventos(id) ON DELETE SET NULL,
    status support_status NOT NULL DEFAULT 'aguardando_atendimento',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### 1.2. Tabela `suporte_mensagens`
Responsável por registrar as mensagens trocadas dentro de cada ticket:
```sql
CREATE TABLE public.suporte_mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.suporte_tickets(id) ON DELETE CASCADE,
    remetente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conteudo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);
```

### 1.3. Índices de Desempenho
```sql
CREATE INDEX idx_tickets_usuario ON public.suporte_tickets(usuario_id);
CREATE INDEX idx_tickets_status ON public.suporte_tickets(status);
CREATE INDEX idx_mensagens_ticket ON public.suporte_mensagens(ticket_id);
```

---

## 2. Estratégia de Segurança (RLS Políticas)
A segurança contra vazamento de conversas é vital. Somente o criador do ticket e o Master global (`role = master` ou claims customizados) podem interagir com as conversas.

### 2.1. Políticas para `suporte_tickets`
- **SELECT**: Permitido para o criador do ticket (`auth.uid() = usuario_id`) OU para o Master Admin.
- **INSERT**: Permitido para qualquer usuário autenticado (que vira o `usuario_id`).
- **UPDATE**: Permitido apenas para o Master Admin para gerenciar o ciclo de vida do status.

### 2.2. Políticas para `suporte_mensagens`
- **SELECT**: Permitido se o usuário for o criador do ticket associado ou for o Master Admin.
- **INSERT**: Permitido se o remetente for participante ativo daquele ticket (criador do ticket ou Master Admin).

---

## 3. Endpoints de API (Next.js App Router)

Criaremos endpoints estruturados para comunicação reativa:
1. `GET /api/support/tickets`:
   - Lista tickets do usuário ativo (ou todos se for o Master).
2. `POST /api/support/tickets`:
   - Cria um novo ticket sob o status `aguardando_atendimento`.
3. `POST /api/support/messages`:
   - Envia uma mensagem em um ticket específico.
4. `PATCH /api/support/tickets/[id]`:
   - Permite que o Master atualize o status do ticket.

---

## 4. Próximos Passos
1. Validação do plano arquitetural pelo Operador.
2. Autorização ao **DevOps** para provisionar as migrações do Supabase de forma segura.
3. Autorização ao **Dev** para iniciar o TDD (criar os testes em RED).
