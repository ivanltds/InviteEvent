-- Migration: Cleanup and Fix RSVP Admin
-- Objetivo: Resolver problema do status não atualizar no Admin limpando duplicatas e ajustando RLS.

-- 1. Limpar RSVPs duplicados (Mantém apenas o mais recente)
DELETE FROM rsvp a
USING rsvp b
WHERE a.created_at < b.created_at 
  AND a.convite_id = b.convite_id;

-- 2. Forçar a restrição de unicidade em convite_id (Impede duplicatas futuras e permite Upsert)
ALTER TABLE rsvp DROP CONSTRAINT IF EXISTS rsvp_convite_id_key;
ALTER TABLE rsvp ADD CONSTRAINT rsvp_convite_id_key UNIQUE (convite_id);

-- 3. Garantir colunas essenciais para o novo fluxo
ALTER TABLE rsvp ADD COLUMN IF NOT EXISTS evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE;
ALTER TABLE convite_membros ADD COLUMN IF NOT EXISTS restricoes TEXT;
ALTER TABLE convite_membros ADD COLUMN IF NOT EXISTS evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE;

-- 4. Ajustar RLS para visibilidade total no Admin
-- Permitir que o Admin (ou qualquer pessoa com acesso à lista) leia os registros
DROP POLICY IF EXISTS "Leitura pública de RSVP" ON rsvp;
CREATE POLICY "Leitura pública de RSVP" ON rsvp FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura pública membros" ON convite_membros;
CREATE POLICY "Leitura pública membros" ON convite_membros FOR SELECT USING (true);

-- 5. Garantir permissões de escrita para o convidado (Anon)
DROP POLICY IF EXISTS "Inserção pública de RSVP" ON rsvp;
CREATE POLICY "Inserção pública de RSVP" ON rsvp FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Update público de RSVP" ON rsvp;
CREATE POLICY "Update público de RSVP" ON rsvp FOR UPDATE USING (true);

-- 6. Grants explícitos
GRANT ALL ON TABLE public.rsvp TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.convite_membros TO anon, authenticated, service_role;

-- 7. Forçar recarga do cache do Supabase
NOTIFY pgrst, 'reload schema';
