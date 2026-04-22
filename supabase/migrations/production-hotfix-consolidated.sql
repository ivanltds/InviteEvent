-- =========================================================
-- HOTFIX CONSOLIDADO: Estabilização de Produção (STORY-060)
-- Data: 2026-04-23
-- Erros Corrigidos: 
-- 1. 400 Bad Request em evento_organizadores (Join Fail)
-- 2. Schema Cache Error (link_externo em presentes)
-- =========================================================

BEGIN;

-- 1. ADICIONAR COLUNA link_externo NA TABELA presentes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='presentes' AND column_name='link_externo') THEN
        ALTER TABLE public.presentes ADD COLUMN link_externo TEXT;
    END IF;
END $$;

-- 2. SINCRONIZAR PERFIS FALTANTES (Evita erro de Foreign Key Violation)
-- Garante que todo user_id em evento_organizadores tenha um correspondente em public.perfis
INSERT INTO public.perfis (id, email)
SELECT u.id, u.email 
FROM auth.users u
JOIN public.evento_organizadores eo ON eo.user_id = u.id
LEFT JOIN public.perfis p ON p.id = u.id
WHERE p.id IS NULL;

-- 3. CORRIGIR RELACIONAMENTO DE ORGANIZADORES
-- Removemos a FK legada
ALTER TABLE public.evento_organizadores 
DROP CONSTRAINT IF EXISTS evento_organizadores_user_id_fkey;

-- Adicionamos a FK apontando para public.perfis(id)
ALTER TABLE public.evento_organizadores
ADD CONSTRAINT evento_organizadores_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.perfis(id) ON DELETE CASCADE;

-- 4. RECARREGAR CACHE DO ESQUEMA
-- Garante que as novas colunas e relacionamentos apareçam na API imediatamente
NOTIFY pgrst, 'reload schema';

COMMIT;

-- LOG DE SUCESSO
SELECT 'Hotfix aplicado com sucesso! Verifique a tela de configurações.' as status;
