-- Migration: Add evento_id to rsvp
-- Objetivo: Suporte a multi-tenancy na tabela de RSVP

ALTER TABLE rsvp ADD COLUMN IF NOT EXISTS evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE;

-- Atualizar Políticas de RLS
DROP POLICY IF EXISTS "Inserção pública de RSVP" ON rsvp;
CREATE POLICY "Inserção pública de RSVP" ON rsvp FOR INSERT WITH CHECK (true);

-- Permitir Select público (para o convidado ver que já confirmou)
DROP POLICY IF EXISTS "Leitura pública de RSVP" ON rsvp;
CREATE POLICY "Leitura pública de RSVP" ON rsvp FOR SELECT USING (true);

-- Permitir Update público (para o convidado editar seu RSVP)
DROP POLICY IF EXISTS "Update público de RSVP" ON rsvp;
CREATE POLICY "Update público de RSVP" ON rsvp FOR UPDATE USING (true);

-- Recarregar Cache
NOTIFY pgrst, 'reload schema';
