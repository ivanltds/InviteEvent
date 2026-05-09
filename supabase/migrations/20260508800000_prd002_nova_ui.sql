-- Migration: PRD-002 Nova UI (Mural Itens, Presentes e Hero Videos)
-- Objetivo: Estruturar tabelas para o Mural Vivo e expandir links de presentes e vídeos.

-- 1. Nova Tabela `mural_itens`
CREATE TABLE IF NOT EXISTS public.mural_itens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  evento_id uuid REFERENCES public.eventos(id) ON DELETE CASCADE NOT NULL,
  tipo varchar(20) NOT NULL CHECK (tipo IN ('FOTO', 'MENSAGEM', 'HIBRIDO', 'VIDEO')),
  url_midia text,
  mensagem text,
  autor varchar(100),
  aprovado boolean DEFAULT false NOT NULL,
  criado_em timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.mural_itens ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- Qualquer convidado pode inserir registros pendentes
CREATE POLICY "Convidados podem submeter lembranças"
ON public.mural_itens FOR INSERT
WITH CHECK (true);

-- Convidados só visualizam mídias previamente aprovadas
CREATE POLICY "Público pode ver apenas lembranças aprovadas"
ON public.mural_itens FOR SELECT
USING (aprovado = true OR public.check_is_organizer(evento_id));

-- Organizadores/Admin possuem controle total (CRUD) sobre itens do seu evento
CREATE POLICY "Organizadores possuem controle total de suas mídias"
ON public.mural_itens FOR ALL
USING (public.check_is_organizer(evento_id));

-- Grants
GRANT SELECT, INSERT ON public.mural_itens TO anon, authenticated;
GRANT ALL ON public.mural_itens TO service_role;

-- 2. Coluna `link_externo` na Tabela `presentes`
ALTER TABLE public.presentes 
ADD COLUMN IF NOT EXISTS link_externo text;

-- 3. Coluna `hero_videos` na Tabela `configuracoes`
ALTER TABLE public.configuracoes
ADD COLUMN IF NOT EXISTS hero_videos text[] DEFAULT '{}';

NOTIFY pgrst, 'reload schema';
