-- Migration: Fix Delete Cascade
-- Objetivo: Garantir que a exclusão de convites e presentes remova registros relacionados (RSVP e Comprovantes)

-- 1. RSVP -> Convites (O erro reportado)
ALTER TABLE rsvp
DROP CONSTRAINT IF EXISTS rsvp_convite_id_fkey,
ADD CONSTRAINT rsvp_convite_id_fkey
  FOREIGN KEY (convite_id)
  REFERENCES convites(id)
  ON DELETE CASCADE;

-- 2. Comprovantes -> Convites
-- Já existia como SET NULL, mudando para CASCADE para limpeza completa
ALTER TABLE comprovantes
DROP CONSTRAINT IF EXISTS comprovantes_convite_id_fkey,
ADD CONSTRAINT comprovantes_convite_id_fkey
  FOREIGN KEY (convite_id)
  REFERENCES convites(id)
  ON DELETE CASCADE;

-- 3. Comprovantes -> Presentes
-- Se um presente for excluído (ex: erro de cadastro), o comprovante perde o sentido
ALTER TABLE comprovantes
DROP CONSTRAINT IF EXISTS comprovantes_presente_id_fkey,
ADD CONSTRAINT comprovantes_presente_id_fkey
  FOREIGN KEY (presente_id)
  REFERENCES presentes(id)
  ON DELETE CASCADE;

-- Recarregar cache do PostgREST
NOTIFY pgrst, 'reload schema';
