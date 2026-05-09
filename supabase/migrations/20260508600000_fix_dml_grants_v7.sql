-- Migration: Fix DML Privileges for Authenticated Users (v7)
-- Objetivo: Garantir que usuários logados possam inserir, atualizar e deletar dados em suas tabelas, respeitando o RLS.

-- 1. GRANTS para Tabelas de Gestão
-- Estas tabelas precisam de permissões totais para o papel 'authenticated'. O RLS cuidará do isolamento.
GRANT ALL ON public.eventos TO authenticated;
GRANT ALL ON public.convites TO authenticated;
GRANT ALL ON public.configuracoes TO authenticated;
GRANT ALL ON public.presentes TO authenticated;
GRANT ALL ON public.faq TO authenticated;
GRANT ALL ON public.eventos_agenda TO authenticated;
GRANT ALL ON public.galeria_albuns TO authenticated;
GRANT ALL ON public.galeria_fotos TO authenticated;
GRANT ALL ON public.mural_mensagens TO authenticated;
GRANT ALL ON public.mural_fotos TO authenticated;
GRANT ALL ON public.rsvp TO authenticated;
GRANT ALL ON public.convite_membros TO authenticated;
GRANT ALL ON public.comprovantes TO authenticated;
GRANT ALL ON public.perfis TO authenticated;

-- 2. GRANTS para Tabelas Públicas (Papel 'anon')
-- Garantir que convidados possam inserir RSVP e Mensagens, mas apenas ler o resto.
GRANT SELECT ON public.eventos TO anon;
GRANT SELECT ON public.convites TO anon;
GRANT SELECT ON public.configuracoes TO anon;
GRANT SELECT ON public.presentes TO anon;
GRANT SELECT ON public.faq TO anon;
GRANT SELECT ON public.eventos_agenda TO anon;
GRANT SELECT ON public.galeria_albuns TO anon;
GRANT SELECT ON public.galeria_fotos TO anon;
GRANT SELECT ON public.mural_mensagens TO anon;
GRANT SELECT ON public.mural_fotos TO anon;

GRANT INSERT ON public.rsvp TO anon;
GRANT INSERT ON public.mural_mensagens TO anon;
GRANT INSERT ON public.mural_fotos TO anon;
GRANT INSERT ON public.convite_membros TO anon;

-- 3. Sequências (Necessário para inserts em tabelas com ID serial/identity)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

NOTIFY pgrst, 'reload schema';
