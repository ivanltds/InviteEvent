-- Migração de Sincronização (Sync Manual Changes)
-- Objetivo: Consolidar mudanças feitas via scripts .js para manter o repositório em dia com o banco real.

-- 1. Narrativa em Configuracoes (Story: EPIC-006)
ALTER TABLE configuracoes 
ADD COLUMN IF NOT EXISTS historia_titulo TEXT DEFAULT 'Nossa História',
ADD COLUMN IF NOT EXISTS historia_subtitulo TEXT DEFAULT 'O Início de Tudo',
ADD COLUMN IF NOT EXISTS historia_texto TEXT DEFAULT 'Tudo começou através de um amigo distante do primo da noiva. O que era para ser apenas um encontro casual se transformou no momento mais importante das nossas vidas. Foi amor à primeira vista. A conexão foi tão forte e imediata que, pouco tempo depois, já estávamos namorando.',
ADD COLUMN IF NOT EXISTS noiva_bio TEXT DEFAULT 'Intensa, forte e decidida. Layslla é o coração vibrante dessa união.',
ADD COLUMN IF NOT EXISTS noivo_bio TEXT DEFAULT 'Paciente, leve e equilibrado. Marcus é o porto seguro e a calmaria que complementa tudo.',
ADD COLUMN IF NOT EXISTS noiva_foto_url TEXT,
ADD COLUMN IF NOT EXISTS noivo_foto_url TEXT,
ADD COLUMN IF NOT EXISTS historia_conclusao TEXT DEFAULT 'E o melhor ainda está por vir.',
ADD COLUMN IF NOT EXISTS noivos_conclusao TEXT DEFAULT 'Estamos ansiosos para celebrar com você!';

-- 2. Tabela de FAQ (Story: EPIC-006)
CREATE TABLE IF NOT EXISTS faq (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE,
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS e Políticas FAQ
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública de faq" ON faq;
CREATE POLICY "Leitura pública de faq" ON faq FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin full access faq" ON faq;
CREATE POLICY "Admin full access faq" ON faq FOR ALL USING (true);
GRANT ALL ON faq TO anon, authenticated, service_role;

-- 3. Mensagem em Comprovantes (Story: STORY-052)
ALTER TABLE comprovantes ADD COLUMN IF NOT EXISTS mensagem TEXT;

-- 4. Função RPC para Reserva de Múltiplos Presentes (Story: STORY-052)
-- Removemos primeiro para garantir a assinatura correta e evitar "not unique"
DROP FUNCTION IF EXISTS reservar_multiplos_presentes_v1(UUID[], TEXT, TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS reservar_multiplos_presentes_v1(UUID[], TEXT, UUID, UUID, TEXT, TEXT);

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
  IF array_length(p_presentes_ids, 1) IS NULL OR array_length(p_presentes_ids, 1) = 0 THEN
    RETURN json_build_object('success', false, 'message', 'Nenhum presente selecionado.');
  END IF;

  FOREACH v_presente_id IN ARRAY p_presentes_ids
  LOOP
    SELECT quantidade_total, quantidade_reservada INTO v_total, v_reservado
    FROM presentes WHERE id = v_presente_id FOR UPDATE;

    IF v_reservado < v_total THEN
      UPDATE presentes 
      SET 
        quantidade_reservada = v_reservado + 1,
        status = CASE WHEN (v_reservado + 1) >= v_total THEN 'reservado' ELSE 'disponivel' END
      WHERE id = v_presente_id;

      INSERT INTO comprovantes (presente_id, convite_id, evento_id, convidado_nome, url_comprovante, mensagem)
      VALUES (v_presente_id, p_convite_id, p_evento_id, p_convidado_nome, p_url_comprovante, p_mensagem);
      
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

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- 5. Recarregar Cache
NOTIFY pgrst, 'reload schema';
