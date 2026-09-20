-- Migration: 20260920140000_add_modo_convite
-- Feature: Convite por Link Único (alternativa ao convite individual por
-- pessoa/família). Adiciona o modo de convite do evento e as policies de
-- RLS necessárias para o auto-cadastro público de convidados. Idempotente,
-- não remove nem altera nada existente.

ALTER TABLE public.configuracoes
  ADD COLUMN IF NOT EXISTS modo_convite text NOT NULL DEFAULT 'individual'
    CHECK (modo_convite IN ('individual', 'link_unico'));

COMMENT ON COLUMN public.configuracoes.modo_convite IS
  'individual: noivos cadastram cada convite. link_unico: convidados se auto-cadastram via /inv/evento/[slug].';

-- Convite: INSERT público, mas só para eventos com modo_convite='link_unico'
-- (defesa em profundidade — evento_id já é público no link; a checagem
-- evita aceitar convite anônimo em eventos que usam o modelo tradicional).
DROP POLICY IF EXISTS "Convites: Inserção Pública (Link Único)" ON public.convites;
CREATE POLICY "Convites: Inserção Pública (Link Único)" ON public.convites
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.configuracoes c
      WHERE c.evento_id = convites.evento_id AND c.modo_convite = 'link_unico'
    )
  );

-- Membros: mesmo padrão já usado em "Public insert own rsvp" (rsvp) — só
-- confere que o convite_id existe, sem checagem de dono (convidado
-- autocadastrado não tem dono).
DROP POLICY IF EXISTS "Convite Membros: Inserção Pública" ON public.convite_membros;
CREATE POLICY "Convite Membros: Inserção Pública" ON public.convite_membros
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    convite_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.convites WHERE convites.id = convite_membros.convite_id)
  );
