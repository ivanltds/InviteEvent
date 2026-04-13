-- Migration: Fix Activation RLS and Proxy Access
-- Objetivo: Permitir leitura pública dos eventos e reabilitar as políticas do evento_organizadores

-- 1. Leitura Pública para Eventos (Necessário para a Barreira de Ativação)
-- Isso permite que o proxy e usuários não autenticados verifiquem se o evento está ativo via slug.
CREATE POLICY "Eventos: Leitura Pública" ON eventos
    FOR SELECT USING (true);

-- 2. Recriar Políticas Essenciais para evento_organizadores
-- A migração anterior havia dropado as políticas dessa tabela, bloqueando acessos e updates de Owners.
CREATE POLICY "Orgs: Leitura" ON evento_organizadores
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true)
        OR user_id = auth.uid()
        OR evento_id IN (SELECT evento_id FROM evento_organizadores WHERE user_id = auth.uid())
    );

CREATE POLICY "Orgs: Gestão Master/Owner" ON evento_organizadores
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_master = true)
        OR EXISTS (SELECT 1 FROM evento_organizadores orgs WHERE orgs.evento_id = evento_organizadores.evento_id AND orgs.user_id = auth.uid() AND orgs.role = 'owner')
    );

NOTIFY pgrst, 'reload schema';
