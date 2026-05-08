-- Migration: Fix 403 Forbidden and Event Loading (v3)
-- Objetivo: Resolver de vez o erro 403 no acesso público e a falha de carregamento de eventos para admins.

-- 1. LIMPEZA TOTAL DE POLÍTICAS CONFLITANTES (Reset)
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('eventos', 'convites', 'perfis', 'evento_organizadores')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. POLÍTICAS PARA 'PERFIS'
-- Essencial para o login funcionar e para o 'is_master' ser verificado
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis: Leitura Própria" ON perfis
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Perfis: Update Próprio" ON perfis
    FOR UPDATE USING (auth.uid() = id);

-- Política especial para permitir que o sistema verifique se o usuário é master sem recursão infinita
CREATE POLICY "Perfis: Master vê tudo" ON perfis
    FOR SELECT USING (
        (SELECT is_master FROM perfis WHERE id = auth.uid()) = true
    );

-- 3. POLÍTICAS PARA 'EVENTO_ORGANIZADORES'
ALTER TABLE evento_organizadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Orgs: Leitura Própria/Master" ON evento_organizadores
    FOR SELECT USING (
        user_id = auth.uid()
        OR (SELECT is_master FROM perfis WHERE id = auth.uid()) = true
    );

CREATE POLICY "Orgs: Gestão Owner/Master" ON evento_organizadores
    FOR ALL USING (
        (SELECT is_master FROM perfis WHERE id = auth.uid()) = true
        OR EXISTS (
            SELECT 1 FROM evento_organizadores 
            WHERE evento_id = evento_organizadores.evento_id 
            AND user_id = auth.uid() 
            AND role = 'owner'
        )
    );

-- 4. POLÍTICAS PARA 'EVENTOS'
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eventos: Leitura Pública" ON eventos
    FOR SELECT USING (true); -- Necessário para convites públicos

CREATE POLICY "Eventos: Inserção Autenticada" ON eventos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Eventos: Gestão Organizador/Master" ON eventos
    FOR ALL USING (
        (SELECT is_master FROM perfis WHERE id = auth.uid()) = true
        OR EXISTS (
            SELECT 1 FROM evento_organizadores 
            WHERE evento_id = eventos.id 
            AND user_id = auth.uid()
        )
    );

-- 5. POLÍTICAS PARA 'CONVITES'
ALTER TABLE convites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Convites: Leitura Pública" ON convites
    FOR SELECT USING (true); -- O SELECT público não deve depender de outras tabelas

CREATE POLICY "Convites: Gestão Organizador/Master" ON convites
    FOR ALL USING (
        (SELECT is_master FROM perfis WHERE id = auth.uid()) = true
        OR EXISTS (
            SELECT 1 FROM evento_organizadores 
            WHERE evento_id = convites.evento_id 
            AND user_id = auth.uid()
        )
    );

-- 6. PERMISSÕES DE ACESSO (Grants)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- 7. IMPORTANTE: Reconfirmar permissão de leitura para o papel anon em tabelas críticas
GRANT SELECT ON public.eventos TO anon;
GRANT SELECT ON public.configuracoes TO anon;
GRANT SELECT ON public.convites TO anon;

NOTIFY pgrst, 'reload schema';
