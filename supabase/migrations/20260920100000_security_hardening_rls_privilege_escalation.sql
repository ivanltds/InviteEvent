-- Migration: 20260920100000_security_hardening_rls_privilege_escalation
-- Objetivo: Fechar 4 vulnerabilidades críticas encontradas na auditoria de
-- 20/09/2026 (docs/analise/01-seguranca.md, SEG-03, SEG-04, SEG-05, SEG-07).
-- Cada bloco só remove/restringe acesso que não tinha função legítima
-- conhecida; os caminhos de acesso legítimos (organizador via
-- check_is_organizer/check_is_owner, convidado via políticas públicas
-- específicas) foram conferidos contra o catálogo real de produção antes
-- desta migration e permanecem intactos.

-- =====================================================================
-- 1) SEG-03: qualquer usuário autenticado podia virar "master".
--    Vetor A: UPDATE perfis SET is_master = true WHERE id = auth.uid()
--             (a policy de UPDATE não tinha WITH CHECK restringindo colunas).
--    Vetor B: supabase.auth.updateUser({ data: { is_master: true } }) —
--             as policies liam auth.jwt()->user_metadata->>'is_master',
--             um campo que o próprio usuário controla, sem tocar a tabela.
-- =====================================================================

-- Vetor A: ninguém além do service_role pode mais alterar a coluna is_master
-- diretamente. Os outros campos do próprio perfil continuam editáveis.
REVOKE UPDATE (is_master) ON public.perfis FROM authenticated, anon;

-- Vetor B: troca a fonte de verdade de "sou master?" do JWT (controlado pelo
-- cliente) para a função check_is_master(), que lê a coluna real da tabela
-- com SECURITY DEFINER.
DROP POLICY IF EXISTS "Perfis: Leitura" ON public.perfis;
CREATE POLICY "Perfis: Leitura" ON public.perfis
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.check_is_master());

DROP POLICY IF EXISTS "Perfis: Update" ON public.perfis;
CREATE POLICY "Perfis: Update" ON public.perfis
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.check_is_master());

-- =====================================================================
-- 2) SEG-05: qualquer autenticado podia se auto-inserir como "owner" de
--    QUALQUER evento (a policy de inserção inicial não checava se o evento
--    já tinha dono). "Inicial" agora significa, de fato, só a primeira vez.
--    Convites de co-organizador para um evento que já tem dono continuam
--    funcionando pela policy "Orgs: Gestão" (check_is_owner), que não muda.
-- =====================================================================
DROP POLICY IF EXISTS "Orgs: Inserção Inicial" ON public.evento_organizadores;
CREATE POLICY "Orgs: Inserção Inicial" ON public.evento_organizadores
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'owner'
    AND NOT EXISTS (
      SELECT 1 FROM public.evento_organizadores eo2
      WHERE eo2.evento_id = evento_organizadores.evento_id
    )
  );

-- =====================================================================
-- 3) SEG-04: policies residuais "USING (true) TO public" concediam
--    ALL (select/insert/update/delete) a QUALQUER pessoa da internet,
--    sem login, em 3 tabelas críticas. Pelo nome ("Admin full access ...")
--    parecem ter sido bypasses de debug esquecidos em produção. Os
--    caminhos legítimos de organizador (check_is_organizer /
--    "Organizer full access to rsvp") e de convidado (policies públicas
--    específicas de INSERT/SELECT/UPDATE já existentes) não usam estas
--    policies e continuam funcionando sem alteração.
-- =====================================================================
DROP POLICY IF EXISTS "Admin full access rsvp" ON public.rsvp;
DROP POLICY IF EXISTS "Admin full access convites" ON public.convites;

-- comprovantes só tinha esta policy "true" cobrindo SELECT/UPDATE/DELETE
-- (a outra existente é só INSERT público, para o convidado anexar o
-- comprovante). Antes de remover o acesso "true", criamos a policy correta
-- de gestão por organizador do evento, para não quebrar o painel de
-- comprovantes dos noivos.
CREATE POLICY "Comprovantes: Gestão" ON public.comprovantes
  FOR ALL TO authenticated
  USING (public.check_is_organizer(evento_id));

DROP POLICY IF EXISTS "Admin full access comprovantes" ON public.comprovantes;

-- configuracoes já tem "Config: Gestão" (check_is_owner) cobrindo UPDATE
-- para o dono legítimo; a policy "true" era redundante e mais permissiva.
DROP POLICY IF EXISTS "Admin update configs" ON public.configuracoes;

-- =====================================================================
-- 4) SEG-07: conciliar_vendas_offline (grava dados de conciliação
--    financeira de comissão de afiliado) era SECURITY DEFINER, sem checagem
--    interna de autorização, e executável por "anon" — qualquer pessoa da
--    internet, sem login, podia forjar conciliação de comissão.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.conciliar_vendas_offline(p_vendas jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_venda RECORD;
    v_token TEXT;
    v_comissao NUMERIC;
    v_valor_venda NUMERIC;

    v_event_id UUID;
    v_meta_atual JSONB;
    v_meta_novo JSONB;

    v_match_count INTEGER := 0;
    v_total_comissao_conciliada NUMERIC := 0;
    v_total_vendas_conciliadas NUMERIC := 0;

    v_resultado jsonb;
BEGIN
    -- Guarda de autorização adicionada em 20/09/2026: só master pode
    -- conciliar vendas. Antes desta migration não havia checagem nenhuma
    -- aqui (SEG-07).
    IF NOT public.check_is_master() THEN
        RAISE EXCEPTION 'Acesso negado: apenas administradores podem conciliar vendas.';
    END IF;

    -- P_VENDAS deve ser uma array JSON: [{"token": "AEG...", "valor": 1500.0, "comissao": 45.0}]
    FOR v_venda IN SELECT * FROM jsonb_to_recordset(p_vendas) AS x(token text, valor numeric, comissao numeric)
    LOOP
        v_token := v_venda.token;
        v_valor_venda := COALESCE(v_venda.valor, 0);
        v_comissao := COALESCE(v_venda.comissao, 0);

        IF v_token IS NOT NULL AND v_token != '' THEN
            -- Localiza o evento de clique correspondente que gerou essa venda
            SELECT id, metadata
            INTO v_event_id, v_meta_atual
            FROM public.analytics_events
            WHERE metadata->>'token' = v_token
            LIMIT 1;

            -- Se achamos o evento no nosso BigData de Telemetria:
            IF v_event_id IS NOT NULL THEN
                -- Merge dos dados de conciliação no metadata existente
                v_meta_novo := v_meta_atual || jsonb_build_object(
                    'status_conciliacao', 'CONCILIADO_CSV',
                    'valor_comissao_lomadee', v_comissao,
                    'valor_venda_lomadee', v_valor_venda,
                    'conciliado_em', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
                );

                -- Persiste a reconciliação
                UPDATE public.analytics_events
                SET metadata = v_meta_novo
                WHERE id = v_event_id;

                v_match_count := v_match_count + 1;
                v_total_comissao_conciliada := v_total_comissao_conciliada + v_comissao;
                v_total_vendas_conciliadas := v_total_vendas_conciliadas + v_valor_venda;
            END IF;
        END IF;
    END LOOP;

    -- Constrói objeto de retorno consolidado
    v_resultado := jsonb_build_object(
        'sucesso', true,
        'match_count', v_match_count,
        'total_comissao', v_total_comissao_conciliada,
        'total_vendas', v_total_vendas_conciliadas
    );

    RETURN v_resultado;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.conciliar_vendas_offline(jsonb) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.conciliar_vendas_offline(jsonb) TO authenticated;

-- =====================================================================
-- Nota: esta migration NÃO mexe nas policies públicas de RSVP/convites
-- (leitura por link, inserção/edição de RSVP sem login) nem na tabela
-- de configuracoes/PIX. Essas ficam de propósito para revisão humana —
-- ver docs/analise/01-seguranca.md e o comentário no topo de
-- 20260920100200_rascunho_rsvp_scoping_NAO_APLICADO.sql.
-- =====================================================================
