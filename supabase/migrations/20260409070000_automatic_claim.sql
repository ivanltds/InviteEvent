-- Migration: Automatic Claim of Legacy Event
-- Objetivo: Garantir que o primeiro usuário a logar reivindique o evento principal e que o admin possa acessar seus dados.

DO $$
BEGIN
    -- Se existir o evento legacy, mas não tiver dono, nós o marcamos para ser reivindicado
    -- Isso será feito via Trigger no auth.users
END $$;

CREATE OR REPLACE FUNCTION handle_new_user_claim()
RETURNS TRIGGER AS $$
DECLARE
    v_evento_id UUID;
    v_is_first BOOLEAN;
BEGIN
    -- Verifica se é o primeiro usuário do sistema (master)
    SELECT NOT EXISTS (SELECT 1 FROM public.perfis) INTO v_is_first;

    -- Cria o perfil
    INSERT INTO public.perfis (id, email, is_master)
    VALUES (NEW.id, NEW.email, v_is_first)
    ON CONFLICT (id) DO NOTHING;

    -- Se for o primeiro usuário, tenta reivindicar o evento principal
    IF v_is_first THEN
        -- Pega o primeiro evento criado (provavelmente o evento_id na configuracoes id=1 ou similar)
        SELECT evento_id INTO v_evento_id FROM configuracoes ORDER BY created_at ASC LIMIT 1;
        
        IF v_evento_id IS NOT NULL THEN
            -- Vincula como owner
            INSERT INTO evento_organizadores (evento_id, user_id, role)
            VALUES (v_evento_id, NEW.id, 'owner')
            ON CONFLICT DO NOTHING;
            
            -- Atualiza user_id legacy se existir
            UPDATE configuracoes SET user_id = NEW.id WHERE evento_id = v_evento_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_claim();

NOTIFY pgrst, 'reload schema';
