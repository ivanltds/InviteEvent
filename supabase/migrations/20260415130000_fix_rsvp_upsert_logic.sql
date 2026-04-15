-- Migration: Clean duplicates and add unique constraint to rsvp
-- Objetivo: Remover RSVPs duplicados e garantir 1 registro por convite para permitir Upsert

-- 1. Limpar duplicatas: Mantém apenas o registro mais recente (maior ID ou mais novo) para cada convite
DELETE FROM rsvp a
USING rsvp b
WHERE a.id < b.id 
  AND a.convite_id = b.convite_id;

-- 2. Adicionar a trava de unicidade (agora que os dados estão limpos)
ALTER TABLE rsvp DROP CONSTRAINT IF EXISTS rsvp_convite_id_key;
ALTER TABLE rsvp ADD CONSTRAINT rsvp_convite_id_key UNIQUE (convite_id);

-- 3. Garantir que a tabela rsvp tenha permissões de INSERT e UPDATE para o Upsert funcionar via RLS
DROP POLICY IF EXISTS "Inserção pública de RSVP" ON rsvp;
CREATE POLICY "Inserção pública de RSVP" ON rsvp FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Update público de RSVP" ON rsvp;
CREATE POLICY "Update público de RSVP" ON rsvp FOR UPDATE USING (true);

-- 4. Garantir que a tabela convite_membros também tenha permissões de Upsert
DROP POLICY IF EXISTS "Inserção pública membros" ON convite_membros;
CREATE POLICY "Inserção pública membros" ON convite_membros FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Update público membros" ON convite_membros;
CREATE POLICY "Update público membros" ON convite_membros FOR UPDATE USING (true);

-- 5. Grants explícitos (redundância de segurança para anon)
GRANT INSERT, UPDATE, SELECT ON public.rsvp TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, SELECT ON public.convite_membros TO anon, authenticated, service_role;

-- 6. Recarregar Cache
NOTIFY pgrst, 'reload schema';
