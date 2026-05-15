# Plano de Implementação Técnica: PRD-014 Group Gifting

> **Responsável:** @architect (Arquiteto de Software)  
> **Status:** PLANO DEFINIDO / PRONTO PARA CODIFICAÇÃO  
> **Foco:** Extensão de schema, concorrência atômica ACID em locks fracionados e serviços encapsulados.

---

## 📋 1. Visão Técnica e Objetivos

O objetivo técnico é estender a infraestrutura de presentes existente para suportar o conceito de **Cotas de Presentes**. Isso exige controle absoluto de concorrência em nível de banco (PostgreSQL) para evitar "overbooking" de cotas e garantir integridade ACID sem alterar a arquitetura central de checkout PIX.

---

## 🗄️ 2. Extensão do Banco de Dados (Migração Supabase)

Utilizaremos a estrutura atual, estendendo campos de forma retrocompatível para não quebrar os dados existentes dos casamentos ativos.

### A. Tabela `public.presentes` (Novas Colunas)
- `permite_cotas`: `boolean` DEFAULT `false`
- `total_cotas`: `integer` DEFAULT `NULL` (Quantidade total de cotas que compõem o valor)
- `cotas_compradas`: `integer` DEFAULT `0` (Quantidade de cotas já pagas e consolidadas)

### B. Tabela `public.presentes_locks` (Extensão de Lock)
- `quantidade_cotas`: `integer` DEFAULT `1`
  - *Nota:* Para presentes não fracionados, assume `1`. Para fracionados, grava a quantidade reservada pelo convidado na transação de 3h.

### C. Tabela `public.comprovantes` (Associação de Cotas)
- `cotas_pagas`: `integer` DEFAULT `1` (Registra no recibo quantas cotas foram liquidadas).

---

## 🛡️ 3. Modelo de Concorrência Atômica (Race Conditions)

Para evitar que dois convidados comprem a última cota restante simultaneamente, implementaremos uma Stored Procedure (RPC) no Postgres rodando sob a transação padrão `SERIALIZABLE` ou via lock explícito `SELECT FOR UPDATE`.

### Algoritmo de Validação de Cota (PostgreSQL Logic):
```sql
CREATE OR REPLACE FUNCTION public.reservar_cotas_presente(
    p_presente_id UUID,
    p_convite_id UUID,
    p_session_id TEXT,
    p_quantidade_solicitada INT
) RETURNS BOOLEAN AS $$
DECLARE
    v_total_cotas INT;
    v_cotas_compradas INT;
    v_cotas_bloqueadas INT;
    v_disponivel INT;
BEGIN
    -- 1. Lock de Linha Explícito no Presente para Evitar Concorrência (Race Condition)
    SELECT total_cotas, cotas_compradas 
    INTO v_total_cotas, v_cotas_compradas
    FROM public.presentes
    WHERE id = p_presente_id AND permite_cotas = true
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Presente não encontrado ou não fracionável';
    END IF;

    -- 2. Calcular somatório de cotas presas em locks ativos expirando no futuro
    SELECT COALESCE(SUM(quantidade_cotas), 0)
    INTO v_cotas_bloqueadas
    FROM public.presentes_locks
    WHERE presente_id = p_presente_id AND expira_em > now();

    -- 3. Calcular disponibilidade real
    v_disponivel := v_total_cotas - (v_cotas_compradas + v_cotas_bloqueadas);

    -- 4. Verificar se há saldo
    IF v_disponivel >= p_quantidade_solicitada THEN
        -- Cria o Lock Temporário Fracionado
        INSERT INTO public.presentes_locks (
            presente_id, 
            convite_id, 
            session_id, 
            quantidade_cotas, 
            expira_em
        ) VALUES (
            p_presente_id, 
            p_convite_id, 
            p_session_id, 
            p_quantidade_solicitada, 
            now() + interval '3 hours'
        );
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🏗️ 4. Arquitetura de Serviços (Clean Code)

Seguindo as regras de descontinuar queries cruas no frontend, encapsularemos toda a nova inteligência em `src/lib/services/giftService.ts`:

### Funções de Serviço a Implementar:
1. **`getGiftProgress(presenteId: string)`**: Retorna o total, compradas e bloqueadas. Se `cotas_compradas > 0`, a API de resposta omitirá a URL de afiliado/externa para ocultar o botão na UI pública (segurança de integridade).
2. **`reserveGiftFraction(presenteId: string, totalCotas: number)`**: Dispara a RPC do banco.
3. **`updateGiftQuotaConfiguration(presenteId: string, config: QuotaConfig)`**: Handler administrativo que calcula a divisão fracionada e assegura que nenhuma cota valha menos de R$ 50,00.

---

## 🧪 5. Plano de Testes TDD (Fases de Validação)

Para manter o rigor TDD no desenvolvimento:
- **Cenário 1 (RED):** Criar teste de unidade onde requisitar mais cotas que o limite retorna erro transacional.
- **Cenário 2 (GREEN):** Implementar a RPC SQL e validar que a transação é segura.
- **Cenário 3 (E2E):** Simular dois navegadores via Playwright clicando simultaneamente na última cota de uma TV 4K. Somente um deve ser levado ao PIX, o outro deve ver o aviso "Saldo Esgotado".

---

## 🚦 6. Plano de Sprints

*   **Sprint 1: Data & Core Security (1 Dia)**
    *   Execução do SQL de migration.
    *   Deploy da RPC `reservar_cotas_presente`.
    *   Ajuste de RLS Policies nas novas colunas.
*   **Sprint 2: Backend & Clean Service Layer (1 Dia)**
    *   Implementação das funções em `giftService.ts` com tipagem estrita TypeScript.
    *   Criação da suíte de testes unitários TDD.
*   **Sprint 3: UI/UX Interativo (1 Dia)**
    *   Construção da Barra de Progresso CSS.
    *   Injeção do Drawer Multi-Contador no checkout público.
    *   Update no Admin Panel com Switch Toggle.

---
**Arquitetura Consolidada. Pronto para Revisão Global e Abertura do Ciclo de Desenvolvimento!**  
@architect: O plano é altamente resiliente e 100% retrocompatível. 🎻🎷🎹🥂
