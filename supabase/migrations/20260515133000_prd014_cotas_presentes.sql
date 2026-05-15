-- Migração: PRD-014 - Extensão do Schema para Suporte a Cotas de Presentes
-- Objetivo: Adicionar campos de controle de cotas, registro fracionado em locks e stored procedure transacional ACID.
-- Autor: @dev / Maestro AI
-- Data: 2026-05-15

-- 1. Extensão da tabela de presentes ativos
ALTER TABLE public.presentes 
ADD COLUMN IF NOT EXISTS permite_cotas BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS total_cotas INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cotas_compradas INTEGER DEFAULT 0;

COMMENT ON COLUMN public.presentes.permite_cotas IS 'Sinaliza se o presente pode ser adquirido em frações/cotas.';
COMMENT ON COLUMN public.presentes.total_cotas IS 'Quantidade total de cotas que compõem o valor total.';
COMMENT ON COLUMN public.presentes.cotas_compradas IS 'Soma consolidada das cotas já vendidas e faturadas.';

-- 2. Extensão dos Locks Temporários
ALTER TABLE public.presentes_locks 
ADD COLUMN IF NOT EXISTS quantidade_cotas INTEGER DEFAULT 1;

COMMENT ON COLUMN public.presentes_locks.quantidade_cotas IS 'Quantidade de cotas que estão presas neste lock temporário de 3h.';

-- 3. Extensão dos Comprovantes
ALTER TABLE public.comprovantes 
ADD COLUMN IF NOT EXISTS cotas_pagas INTEGER DEFAULT 1;

COMMENT ON COLUMN public.comprovantes.cotas_pagas IS 'Quantas cotas foram adquiridas nesta transação PIX comprovada.';

-- 4. Stored Procedure Transacional (RPC) para Reserva Atômica
-- Previne Race Conditions e garante isolamento estrito das cotas finais de um item
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
    -- A. Lock de Linha Explícito para garantir que nenhuma outra transação altere estes valores simultaneamente
    SELECT total_cotas, cotas_compradas 
    INTO v_total_cotas, v_cotas_compradas
    FROM public.presentes
    WHERE id = p_presente_id AND permite_cotas = true
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Presente não encontrado ou não configurado para cotas';
    END IF;

    -- B. Calcular soma das cotas que estão reservadas por outros usuários no momento (locks válidos)
    SELECT COALESCE(SUM(quantidade_cotas), 0)
    INTO v_cotas_bloqueadas
    FROM public.presentes_locks
    WHERE presente_id = p_presente_id AND expira_em > now();

    -- C. Calcular disponibilidade atual real
    v_disponivel := v_total_cotas - (v_cotas_compradas + v_cotas_bloqueadas);

    -- D. Validar saldo e criar a reserva temporária de 3 horas
    IF v_disponivel >= p_quantidade_solicitada THEN
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

COMMENT ON FUNCTION public.reservar_cotas_presente IS 'Reserva atômica de cotas com prevenção de race conditions usando SELECT FOR UPDATE.';

-- 5. Governança e Segurança RLS/Grants (SEC-001)
-- Revoga o execute default do PUBLIC e concede estritamente aos papéis autenticados e anônimos para acesso via API segura
REVOKE EXECUTE ON FUNCTION public.reservar_cotas_presente(UUID, UUID, TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reservar_cotas_presente(UUID, UUID, TEXT, INT) TO anon, authenticated, service_role;
