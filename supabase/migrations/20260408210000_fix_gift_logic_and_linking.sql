-- Migration: Fix Gift Logic and Linking
-- Objetivo: Corrigir o status do presente e associar convite ao comprovante

CREATE OR REPLACE FUNCTION reservar_presente_v1(
  p_presente_id UUID,
  p_url_comprovante TEXT,
  p_convite_id UUID DEFAULT NULL,
  p_convidado_nome TEXT DEFAULT 'Convidado via Site'
) RETURNS JSON AS $$
DECLARE
  v_total INTEGER;
  v_reservado INTEGER;
  v_new_status TEXT;
BEGIN
  -- Bloqueia a linha para evitar concorrência (SELECT FOR UPDATE)
  SELECT quantidade_total, quantidade_reservada, status INTO v_total, v_reservado, v_new_status
  FROM presentes WHERE id = p_presente_id FOR UPDATE;

  IF v_reservado >= v_total THEN
    RETURN json_build_object('success', false, 'message', 'Desculpe, este item acabou de ser esgotado.');
  END IF;

  -- Determinar novo status
  IF (v_reservado + 1) >= v_total THEN
    v_new_status := 'reservado';
  ELSE
    v_new_status := 'disponivel';
  END IF;

  -- Incrementar reserva
  UPDATE presentes 
  SET 
    quantidade_reservada = v_reservado + 1,
    status = v_new_status
  WHERE id = p_presente_id;

  -- Inserir comprovante com convite_id
  INSERT INTO comprovantes (presente_id, convite_id, convidado_nome, url_comprovante)
  VALUES (p_presente_id, p_convite_id, p_convidado_nome, p_url_comprovante);

  RETURN json_build_object('success', true, 'message', 'Reserva confirmada com sucesso!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
