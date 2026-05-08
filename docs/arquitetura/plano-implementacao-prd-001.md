# Plano de Implementação: PRD-001 — Mural, Presentes e RSVP Seguro

Este documento detalha a fundação técnica necessária para a implementação das funcionalidades do PRD-001.

## 1. Modelo de Dados (Supabase/PostgreSQL)

### 1.1. Tabela: `mural_fotos`
Armazena as imagens enviadas pelos convidados.
```sql
CREATE TABLE mural_fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  url_foto TEXT NOT NULL,
  legenda TEXT,
  guest_name TEXT, -- Nome preenchido pelo convidado no upload
  is_approved BOOLEAN DEFAULT false, -- Moderação
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE mural_fotos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fotos visíveis para todos se aprovadas" 
ON mural_fotos FOR SELECT 
USING (is_approved = true);

CREATE POLICY "Admin pode tudo na mural_fotos" 
ON mural_fotos FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM evento_organizadores WHERE event_id = mural_fotos.event_id AND user_id = auth.uid()));

CREATE POLICY "Convidados podem inserir fotos" 
ON mural_fotos FOR INSERT 
WITH CHECK (true); -- Validar event_id no nível da aplicação/RPC
```

### 1.2. Tabela: `mural_reactions`
Controle de reações (ex: ❤️).
```sql
CREATE TABLE mural_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES mural_fotos(id) ON DELETE CASCADE,
  user_fingerprint TEXT, -- Identificador anônimo (browser) ou user_id
  reaction_type TEXT DEFAULT 'heart',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.3. Tabela: `presentes`
Catálogo de itens e cotas.
```sql
CREATE TABLE presentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  valor_total DECIMAL(10,2),
  quantidade_total INT DEFAULT 1,
  quantidade_reservada INT DEFAULT 0,
  categoria TEXT, -- Ex: 'Lua de Mel', 'Cozinha'
  imagem_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.4. Tabela: `transacoes_presentes`
Registro de pagamentos (PIX/Stripe).
```sql
CREATE TABLE transacoes_presentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presente_id UUID REFERENCES presentes(id),
  event_id UUID REFERENCES eventos(id),
  nome_pagador TEXT NOT NULL,
  mensagem TEXT,
  valor DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pendente', -- 'pendente', 'confirmado', 'cancelado'
  metodo_pagamento TEXT DEFAULT 'pix',
  comprovante_url TEXT, -- Upload do print do PIX
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 2. Supabase Storage (Buckets)

1.  **Bucket `mural`**: 
    *   Estrutura: `/[event_id]/[photo_uuid].jpg`
    *   Configuração: Público para leitura, restrito por tamanho (max 10MB).
2.  **Bucket `presentes`**: 
    *   Estrutura: `/[event_id]/[gift_uuid].jpg`
    *   Configuração: Público para leitura, upload apenas por admins.
3.  **Bucket `comprovantes`**: 
    *   Estrutura: `/[event_id]/[transaction_uuid].jpg`
    *   Configuração: Privado (apenas Admin pode ler).

## 3. Integração de Pagamento (PIX Direto)

Para o MVP, utilizaremos a estratégia de **PIX Estático**:
1.  **Configuração**: O Admin insere sua Chave PIX nas configurações do evento.
2.  **Exibição**: No checkout do presente, o sistema gera um QR Code estático baseado na chave ou simplesmente exibe a chave para "Copia e Cola".
3.  **Confirmação**: O convidado anexa o comprovante (opcional).
4.  **Fluxo Admin**: O organizador recebe uma notificação (ou vê no dashboard) e marca como "Confirmado" manualmente após verificar o saldo na conta.

## 4. Endpoints e RPCs

### 4.1. `confirm_rsvp` (RPC)
Garante que a confirmação de múltiplos membros de um grupo seja atômica.
- **Entrada**: `convite_id`, `array de membros_status {id, status, observacoes}`.
- **Lógica**: Atualiza `convite_membros` e insere/atualiza registros em `rsvp`.

### 4.2. `reserve_gift_quota` (RPC)
Evita race conditions ao reservar o último item de um presente.
- **Entrada**: `presente_id`, `quantidade`.
- **Lógica**: Verifica `quantidade_reservada` + `quantidade` <= `quantidade_total`. Se sim, incrementa.

## 5. Estratégia de Segurança (RLS)

- **Proteção contra IDOR**: Todas as queries de convidados devem filtrar por `event_id` extraído do `slug` da URL, nunca confiando apenas no ID enviado pelo cliente sem validação.
- **Limitação de Rate**: Implementar no Next.js (Middleware ou API Routes) limites para upload de fotos (max 20 por convidado via cookie/IP).

## 6. Próximos Passos para DEV
1. Criar migração SQL com as novas tabelas e políticas.
2. Implementar `UploadService` com integração Supabase Storage.
3. Desenvolver componentes de UI baseados nos wireframes (Mural e GiftList).
4. Criar fluxos de API para processamento de transações pendentes.
