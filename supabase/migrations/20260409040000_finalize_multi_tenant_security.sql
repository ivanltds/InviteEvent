-- Migration: Finalize Multi-Tenant Security and Unique Constraints
-- Objetivo: Garantir isolamento total entre eventos e permitir upsert de configurações.

-- 1. Unicidade de Configuração por Evento
-- Se houver duplicatas, removemos antes de aplicar a restrição (mantendo a mais recente)
DELETE FROM configuracoes
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY evento_id ORDER BY created_at DESC) as row_num
        FROM configuracoes
        WHERE evento_id IS NOT NULL
    ) t
    WHERE t.row_num > 1
);

ALTER TABLE configuracoes DROP CONSTRAINT IF EXISTS unique_evento_id;
ALTER TABLE configuracoes ADD CONSTRAINT unique_evento_id UNIQUE (evento_id);

-- 2. Limpar políticas antigas para evitar conflitos (Reset total de segurança)
DROP POLICY IF EXISTS "Leitura pública de configs" ON configuracoes;
DROP POLICY IF EXISTS "Admin update configs" ON configuracoes;
DROP POLICY IF EXISTS "Organizadores leem config do evento" ON configuracoes;
DROP POLICY IF EXISTS "Owners editam config do evento" ON configuracoes;
DROP POLICY IF EXISTS "Acesso público via slug" ON configuracoes;

-- 3. POLÍTICAS PARA CONFIGURACOES
-- Leitura Pública (Convidados)
CREATE POLICY "Leitura pública de configurações" ON configuracoes
    FOR SELECT USING (true);

-- Leitura Organizador/Master
CREATE POLICY "Organizadores podem ver configurações" ON configuracoes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true)
        OR
        EXISTS (SELECT 1 FROM evento_organizadores WHERE evento_id = configuracoes.evento_id AND user_id = auth.uid())
    );

-- Escrita (ALL) Owner/Master
CREATE POLICY "Owners podem gerenciar configurações" ON configuracoes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true)
        OR
        EXISTS (SELECT 1 FROM evento_organizadores WHERE evento_id = configuracoes.evento_id AND user_id = auth.uid() AND role = 'owner')
    );

-- 4. POLÍTICAS PARA CONVITES
DROP POLICY IF EXISTS "Leitura pública de convites" ON convites;
DROP POLICY IF EXISTS "Admin full access convites" ON convites;

CREATE POLICY "Leitura pública de convites" ON convites FOR SELECT USING (true);

CREATE POLICY "Organizadores gerenciam convites" ON convites
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true)
        OR
        EXISTS (SELECT 1 FROM evento_organizadores WHERE evento_id = convites.evento_id AND user_id = auth.uid())
    );

-- 5. POLÍTICAS PARA PRESENTES
DROP POLICY IF EXISTS "Leitura pública de presentes" ON presentes;
DROP POLICY IF EXISTS "Admin full access presentes" ON presentes;

CREATE POLICY "Leitura pública de presentes" ON presentes FOR SELECT USING (true);

CREATE POLICY "Organizadores gerenciam presentes" ON presentes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true)
        OR
        EXISTS (SELECT 1 FROM evento_organizadores WHERE evento_id = presentes.evento_id AND user_id = auth.uid())
    );

-- 6. POLÍTICAS PARA FAQ
DROP POLICY IF EXISTS "Organizadores gerenciam FAQ" ON faq;

CREATE POLICY "Leitura pública de FAQ" ON faq FOR SELECT USING (true);

CREATE POLICY "Organizadores gerenciam FAQ" ON faq
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true)
        OR
        EXISTS (SELECT 1 FROM evento_organizadores WHERE evento_id = faq.evento_id AND user_id = auth.uid())
    );

NOTIFY pgrst, 'reload schema';
