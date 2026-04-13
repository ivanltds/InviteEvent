-- Migration: 20260413000000_auth_auto_confirm_test_emails
-- Descrição: Auto-confirma e-mails de teste (@example.com e @test.com) para ignorar limites de SMTP e atrito no Onboarding/E2E.

CREATE OR REPLACE FUNCTION public.handle_auth_auto_confirm()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o e-mail for de teste, marcamos como confirmado imediatamente
  IF NEW.email LIKE '%@example.com' OR NEW.email LIKE '%@test.com' THEN
    NEW.email_confirmed_at = NOW();
    NEW.confirmed_at = NOW();
    NEW.last_sign_in_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garante que o trigger rode ANTES da inserção para modificar os campos do registro
DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_auto_confirm();
