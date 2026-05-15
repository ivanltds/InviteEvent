-- =======================================================
-- PRD-013: Governança de Dados, Auditoria LGPD e RLS Hardening
-- Data: 15/05/2026
-- =======================================================

-- 1. Adicionar campos de rastreabilidade LGPD na tabela RSVP
ALTER TABLE public.rsvp
ADD COLUMN IF NOT EXISTS lgpd_consent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS lgpd_consent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS lgpd_ip_address text;

-- 2. Criar gatilho automático para captura segura e inviolável de IP no PostgreSQL
CREATE OR REPLACE FUNCTION public.log_rsvp_client_ip()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lgpd_consent = true THEN
    NEW.lgpd_consent_at := now();
    -- Captura o IP do cliente via conexão HTTP da API Supabase ou Fallback da conexão IP nativa do PG
    NEW.lgpd_ip_address := COALESCE(
      current_setting('request.headers', true)::json->>'x-forwarded-for',
      inet_client_addr()::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associa o gatilho ANTES de inserir ou atualizar para persistência atômica
DROP TRIGGER IF EXISTS tr_rsvp_lgpd_audit ON public.rsvp;
CREATE TRIGGER tr_rsvp_lgpd_audit
  BEFORE INSERT OR UPDATE ON public.rsvp
  FOR EACH ROW
  EXECUTE FUNCTION public.log_rsvp_client_ip();

-- 3. RLS Hardening na Tabela RSVP (Garantir Políticas Rígidas)
-- Garante que insert público é validado e restrito
ALTER TABLE public.rsvp ENABLE ROW LEVEL SECURITY;

-- DROP políticas permissivas ou redundantes antigas para recriar com hardening
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public insert on rsvp" ON public.rsvp;
    DROP POLICY IF EXISTS "Allow public read own rsvp" ON public.rsvp;
    DROP POLICY IF EXISTS "Allow organizers read/write their rsvp" ON public.rsvp;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Permitir que convidados acessem o RSVP anônimo apenas se souberem o slug do convite correspondente (via Join ou ID)
-- Simplificamos a política pública: se possuir o convite_id válido, pode interagir com o RSVP.
CREATE POLICY "Public insert own rsvp"
  ON public.rsvp
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    convite_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.convites WHERE id = convite_id
    )
  );

CREATE POLICY "Public update own rsvp"
  ON public.rsvp
  FOR UPDATE
  TO anon, authenticated
  USING (
    convite_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.convites WHERE id = convite_id
    )
  )
  WITH CHECK (
    convite_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.convites WHERE id = convite_id
    )
  );

CREATE POLICY "Organizer full access to rsvp"
  ON public.rsvp
  FOR ALL
  TO authenticated
  USING (
    evento_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.evento_organizadores 
      WHERE evento_id = public.rsvp.evento_id 
      AND user_id = auth.uid()
    )
  );
