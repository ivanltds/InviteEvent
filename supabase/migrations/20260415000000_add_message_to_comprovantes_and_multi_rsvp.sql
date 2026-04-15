-- Migration: Add Message to Comprovantes and Multi-RSVP
-- Objetivo: Suporte a múltiplos presentes no carrinho e mensagens personalizadas

-- 1. Adicionar coluna mensagem em comprovantes
ALTER TABLE comprovantes ADD COLUMN IF NOT EXISTS mensagem TEXT;

-- 2. Garantir que comprovantes tenha evento_id (para multi-tenancy)
ALTER TABLE comprovantes ADD COLUMN IF NOT EXISTS evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE;

-- 3. Função Atômica para Reserva de Múltiplos Presentes (Story: STORY-052)
CREATE OR REPLACE FUNCTION reservar_multiplos_presentes_v1(
  p_presentes_ids UUID[],
  p_url_comprovante TEXT,
  p_convite_id UUID DEFAULT NULL,
  p_evento_id UUID DEFAULT NULL,
  p_convidado_nome TEXT DEFAULT 'Convidado via Site',
  p_mensagem TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_presente_id UUID;
  v_total INTEGER;
  v_reservado INTEGER;
  v_success_count INTEGER := 0;
BEGIN
  -- 1. Validar inputs básicos
  IF array_length(p_presentes_ids, 1) IS NULL OR array_length(p_presentes_ids, 1) = 0 THEN
    RETURN json_build_object('success', false, 'message', 'Nenhum presente selecionado.');
  END IF;

  -- 2. Iterar sobre os presentes para reservar
  FOREACH v_presente_id IN ARRAY p_presentes_ids
  LOOP
    -- Bloqueia a linha para evitar concorrência
    SELECT quantidade_total, quantidade_reservada INTO v_total, v_reservado
    FROM presentes WHERE id = v_presente_id FOR UPDATE;

    -- Verificar disponibilidade
    IF v_reservado < v_total THEN
      -- Incrementar reserva
      UPDATE presentes 
      SET 
        quantidade_reservada = v_reservado + 1,
        status = CASE WHEN (v_reservado + 1) >= v_total THEN 'reservado' ELSE 'disponivel' END
      WHERE id = v_presente_id;

      -- Inserir comprovante para este presente específico
      INSERT INTO comprovantes (presente_id, convite_id, evento_id, convidado_nome, url_comprovante, mensagem)
      VALUES (v_presente_id, p_convite_id, p_evento_id, p_convidado_nome, p_url_comprovante, p_mensagem);
      
      v_success_count := v_success_count + 1;
    END IF;
  END LOOP;

  -- 3. Retorno baseado no resultado
  IF v_success_count = 0 THEN
    RETURN json_build_object('success', false, 'message', 'Desculpe, todos os itens selecionados acabaram de ser esgotados.');
  ELSIF v_success_count < array_length(p_presentes_ids, 1) THEN
    RETURN json_build_object('success', true, 'message', format('Reserva parcial concluída! %s de %s itens foram reservados.', v_success_count, array_length(p_presentes_ids, 1)));
  ELSE
    RETURN json_build_object('success', true, 'message', 'Todos os presentes foram reservados com sucesso!');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grants
GRANT EXECUTE ON FUNCTION reservar_multiplos_presentes_v1 TO anon, authenticated, service_role;

-- 5. Recarregar Cache
NOTIFY pgrst, 'reload schema';
