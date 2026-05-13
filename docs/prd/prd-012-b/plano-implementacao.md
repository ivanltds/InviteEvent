# 🏗️ Plano de Implementação Técnica: Motor de Monetização & Reservas (PRD-012-B)

> **Status:** 🏆 CONCLUÍDO (Aprovado em QA / DevOps)  
> **Data de Conclusão:** 13 de Maio de 2026  
> **Autor:** Arquiteto de Software (`@architect`) & DevOps (`@devops`)  
> **Contexto:** Concorrência de Vitrine, Redirecionamento Lomadee (3h Hold) e Compra PIX Acelerada.

---

## 1. Visão Geral do Escopo Técnico

Para mitigar a "Fuga de Receita" permitindo que convidados comprem presentes reais em varejistas externos (afiliados Lomadee/Magalu) sem correr risco de duplicidade, o sistema gerenciará uma **camada de travas voláteis de estoque** no Supabase de curta duração (3 horas). Além disso, introduzirá a **Soberania do PIX** e a aceleração de funil de presentes (compra direta).

---

## 2. Modelagem de Dados (Supabase / PostgreSQL)

### 2.1 Nova Tabela: `public.presentes_locks`
Armazenará exclusivamente as reservas temporárias. A dissociação evita inflar a tabela principal `presentes` e facilita as limpezas automáticas.

```sql
CREATE TABLE public.presentes_locks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    presente_id uuid NOT NULL REFERENCES public.presentes(id) ON DELETE CASCADE,
    session_id text NOT NULL, -- Identificador anônimo do visitante (LocalStorage/Cookie)
    expira_em timestamptz NOT NULL DEFAULT (now() + interval '3 hours'),
    criado_em timestamptz DEFAULT now()
);

-- Índices de Cobertura e Alta Concorrência
CREATE INDEX idx_presentes_locks_expiracao ON public.presentes_locks (expira_em);
CREATE INDEX idx_presentes_locks_presente ON public.presentes_locks (presente_id);
```

---

### 2.2 Políticas RLS (Row Level Security)
Segurança rigorosa para evitar que convidados forjem ou quebrem locks de terceiros.

```sql
ALTER TABLE public.presentes_locks ENABLE ROW LEVEL SECURITY;

-- 1. Qualquer visitante lê os locks válidos (expira_em > now)
CREATE POLICY "Locks visíveis publicamente"
ON public.presentes_locks FOR SELECT
USING (true);

-- 2. Inserções via RPC dedicada (garantia atômica)
-- Desabilitamos INSERT direto via client API por segurança concorrente.
```

---

### 2.3 RPC de Concorrência Atômica: `adquirir_lock_presente_v1`
Garante o bloqueio seguro evitando condições de corrida (*Race Conditions*) onde dois convidados tentam travar o mesmo produto no exato milissegundo.

```sql
CREATE OR REPLACE FUNCTION public.adquirir_lock_presente_v1(
    p_presente_id uuid,
    p_session_id text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Elevado para manipulação interna
AS $$
DECLARE
    v_total int;
    v_reservados int;
    v_locks_ativos int;
    v_ja_possui_lock boolean;
BEGIN
    -- 1. Verifica se esta mesma sessão já possui um lock ativo neste item
    SELECT EXISTS (
        SELECT 1 FROM public.presentes_locks 
        WHERE presente_id = p_presente_id 
          AND session_id = p_session_id 
          AND expira_em > now()
    ) INTO v_ja_possui_lock;

    IF v_ja_possui_lock THEN
        -- Se já possui, estende o tempo para garantir a usabilidade
        UPDATE public.presentes_locks 
        SET expira_em = now() + interval '3 hours'
        WHERE presente_id = p_presente_id AND session_id = p_session_id;
        
        RETURN jsonb_build_object('sucesso', true, 'mensagem', 'Lock estendido');
    END IF;

    -- 2. Bloqueia a linha do presente para leitura segura concorrente
    SELECT quantidade_total, quantidade_reservada
    INTO v_total, v_reservados
    FROM public.presentes
    WHERE id = p_presente_id
    FOR UPDATE;

    -- 3. Conta locks vigentes de terceiros
    SELECT COUNT(*)
    INTO v_locks_ativos
    FROM public.presentes_locks
    WHERE presente_id = p_presente_id
      AND expira_em > now();

    -- 4. Regra de Inventário Dinâmico (Total - Reservas Definitivas - Locks Temporários > 0)
    IF (v_total - v_reservados - v_locks_ativos) > 0 THEN
        INSERT INTO public.presentes_locks (presente_id, session_id)
        VALUES (p_presente_id, p_session_id);
        
        RETURN jsonb_build_object('sucesso', true, 'mensagem', 'Lock adquirido com sucesso');
    ELSE
        RETURN jsonb_build_object('sucesso', false, 'mensagem', 'Item sem unidades disponíveis ou temporariamente reservado');
    END IF;
END;
$$;
```

---

### 2.4 RPC para Liberação Voluntária: `liberar_lock_presente_v1`
Permite que o dono do lock libere o item voluntariamente.

```sql
CREATE OR REPLACE FUNCTION public.liberar_lock_presente_v1(
    p_presente_id uuid,
    p_session_id text
) RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
    DELETE FROM public.presentes_locks
    WHERE presente_id = p_presente_id AND session_id = p_session_id;
$$;
```

---

## 3. Camada de Frontend (Next.js / TypeScript)

### 3.1 Identificação de Sessão do Convidado
Injetar um utilitário para resgatar ou gerar um `guest_session_id` único e salvá-lo no `localStorage` para persistência entre sessões de navegação.

### 3.2 Modificação no `giftService.ts`
Adicionar as seguintes assinaturas:
```typescript
/**
 * Tenta adquirir um lock de 3 horas para compras em lojas externas.
 */
async lockGift(presenteId: string, sessionId: string): Promise<{ sucesso: boolean; mensagem: string }>

/**
 * Libera voluntariamente um lock ativo pela sessão atual.
 */
async unlockGift(presenteId: string, sessionId: string): Promise<void>
```

### 3.3 Componentes de UI a Alterar: `app/(public)/presentes/page.tsx`

1. **Carregamento da Lista**:
   * Incluir join no `select()` de presentes: `presentes_locks(session_id, expira_em)`.
   * Computar estados `isLockedByOther` e `isLockedByMe` em tempo de execução comparando a data local vs `expira_em`.
2. **Cards**:
   * Exibir badge laranja se `isLockedByOther` e desabilitar o CTA de abrir detalhes.
   * Exibir badge verde se `isLockedByMe`.
3. **Modal de Detalhes**:
   * Se `isLockedByMe`: renderizar componente do contador regressivo dinâmico e o botão *"Liberar Presente"* (executa `unlockGift`).
   * Injetar novo botão no rodapé: **"⚡ Presentear via PIX Agora"**.
4. **Novo Fluxo de Redirecionamento (Interstitial Component)**:
   * Componente sobreposto (`AnimatePresence`) disparado ao clicar em "Comprar Online".
   * Bloqueia a tela por 4 segundos, exibe o aviso de reserva, executa `lockGift` em background e ao concluir dispara o `window.open(link_externo, '_blank')`.
5. **Aceleração de Funil PIX**:
   * Ao clicar em *"⚡ Presentear via PIX Agora"*, dispara `addToCart()` e imediatamente altera a variável de controle local do Next `showModal` com o `step === 'checkout'` aberto.

---

## 4. Estratégia de Manutenção de Infra (Garbage Collection)

Como o frontend desconsidera registros antigos por meio da data `expira_em`, a aplicação continuará operando livremente. Contudo, para evitar acúmulo inútil de registros expirados no Supabase, propomos a adição de uma trigger periódica ou cronjob:

```sql
-- Limpeza diária física opcional via pg_cron (se disponível)
SELECT cron.schedule('limpar-locks-expirados', '0 0 * * *', $$
    DELETE FROM public.presentes_locks WHERE expira_em < now();
$$);
```

---

## 5. Matriz de Testes Exigidos (TDD / Playwright)

| Cenário | Passos | Resultado Esperado |
|---------|--------|--------------------|
| **T1: Concorrência Concorrente** | Usuário A bloqueia item X. Usuário B tenta abrir o mesmo item X. | Item X deve aparecer cinza/reservado para Usuário B sem permitir abertura. |
| **T2: Soberania do PIX** | Usuário A tem lock do item Y. Ele clica em Presentear via PIX e completa. | Lock temporário deve ser deletado e item passa a `ganho/reservado` em definitivo. |
| **T3: Expiração de Lock** | Ajustar banco para lock expirar em 1 min. Esperar. | Card volta a ficar com o botão dourado "VER DETALHES" plenamente funcional. |
| **T4: Compra Direta PIX** | Clicar no botão "⚡ Presentear via PIX Agora" no modal de detalhes. | Detalhes fecham, item adicionado e modal de checkout/cesta com QR Code abre instantaneamente. |
