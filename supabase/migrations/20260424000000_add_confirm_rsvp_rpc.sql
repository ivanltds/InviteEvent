-- Migration: Atomic RSVP Confirmation
-- Objetivo: Garantir que a confirmação de múltiplos membros e o registro de RSVP sejam atômicos.

-- Adicionar restrição única para permitir UPSERT se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'rsvp_convite_id_key'
    ) THEN
        ALTER TABLE rsvp ADD CONSTRAINT rsvp_convite_id_key UNIQUE (convite_id);
    END IF;
END $$;

CREATE OR REPLACE FUNCTION confirm_rsvp_v1(
  p_convite_id UUID,
  p_membros JSONB,
  p_rsvp_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_membro RECORD;
  v_evento_id UUID;
BEGIN
  -- 1. Obter o evento_id do convite
  SELECT evento_id INTO v_evento_id FROM convites WHERE id = p_convite_id;

  -- 2. Atualizar Membros
  FOR v_membro IN SELECT * FROM jsonb_to_recordset(p_membros) AS x(id UUID, confirmado BOOLEAN, restricoes TEXT)
  LOOP
    UPDATE convite_membros
    SET 
      confirmado = v_membro.confirmado,
      restricoes = v_membro.restricoes,
      updated_at = NOW()
    WHERE id = v_membro.id AND convite_id = p_convite_id;
  END LOOP;

  -- 3. Inserir ou Atualizar RSVP
  INSERT INTO rsvp (
    convite_id,
    evento_id,
    confirmados,
    mensagem,
    telefone,
    status,
    created_at
  )
  VALUES (
    p_convite_id,
    v_evento_id,
    COALESCE((p_rsvp_data->>'confirmados')::INTEGER, 0),
    p_rsvp_data->>'mensagem',
    p_rsvp_data->>'telefone',
    COALESCE(p_rsvp_data->>'status', 'confirmado'),
    NOW()
  )
  ON CONFLICT (convite_id) 
  DO UPDATE SET
    confirmados = EXCLUDED.confirmados,
    mensagem = EXCLUDED.mensagem,
    telefone = EXCLUDED.telefone,
    status = EXCLUDED.status,
    updated_at = NOW();

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution
GRANT EXECUTE ON FUNCTION confirm_rsvp_v1 TO anon, authenticated, service_role;
