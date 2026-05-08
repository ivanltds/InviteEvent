-- Adiciona status e valor aos comprovantes para controle financeiro e moderação
ALTER TABLE comprovantes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado'));
ALTER TABLE comprovantes ADD COLUMN IF NOT EXISTS valor DECIMAL(10,2);

-- Atualiza a função de reserva para incluir o valor atual do presente no comprovante
CREATE OR REPLACE FUNCTION reservar_multiplos_presentes_v2(
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
  v_preco DECIMAL(10,2);
  v_success_count INTEGER := 0;
BEGIN
  IF array_length(p_presentes_ids, 1) IS NULL OR array_length(p_presentes_ids, 1) = 0 THEN
    RETURN json_build_object('success', false, 'message', 'Nenhum presente selecionado.');
  END IF;

  FOREACH v_presente_id IN ARRAY p_presentes_ids
  LOOP
    SELECT quantidade_total, quantidade_reservada, preco INTO v_total, v_reservado, v_preco
    FROM presentes WHERE id = v_presente_id FOR UPDATE;

    IF v_reservado < v_total THEN
      UPDATE presentes 
      SET 
        quantidade_reservada = v_reservado + 1,
        status = CASE WHEN (v_reservado + 1) >= v_total THEN 'reservado' ELSE 'disponivel' END
      WHERE id = v_presente_id;

      INSERT INTO comprovantes (presente_id, convite_id, evento_id, convidado_nome, url_comprovante, mensagem, valor, status)
      VALUES (v_presente_id, p_convite_id, p_evento_id, p_convidado_nome, p_url_comprovante, p_mensagem, v_preco, 'pendente');
      
      v_success_count := v_success_count + 1;
    END IF;
  END LOOP;

  IF v_success_count = 0 THEN
    RETURN json_build_object('success', false, 'message', 'Desculpe, todos os itens selecionados acabaram de ser esgotados.');
  ELSIF v_success_count < array_length(p_presentes_ids, 1) THEN
    RETURN json_build_object('success', true, 'message', format('Reserva parcial concluída! %s de %s itens foram reservados.', v_success_count, array_length(p_presentes_ids, 1)));
  ELSE
    RETURN json_build_object('success', true, 'message', 'Todos os presentes foram reservados com sucesso!');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION reservar_multiplos_presentes_v2 TO anon, authenticated, service_role;
