-- Migration: 20260516000000_stabilization_and_auto_curation.sql
-- Description: Estabilização crítica do app, correção de recursividade RLS e persistência de varejistas na autocura.

-- 1. Quebra a recursividade infinita permitindo que o owner (postgres) ignore RLS na tabela perfis
-- Isso resolve o erro "stack depth limit exceeded" quando check_is_master() é chamado por uma política
ALTER TABLE public.perfis NO FORCE ROW LEVEL SECURITY;

-- 2. Adiciona persistência do nome da loja no presente (solicitado pelo usuário)
ALTER TABLE public.presentes ADD COLUMN IF NOT EXISTS parceiro_nome TEXT;

-- 3. Atualiza a função de autocura para propagar o nome da loja para o presente
CREATE OR REPLACE FUNCTION public.apply_healed_link(
    p_id uuid, 
    p_new_link text, 
    p_logs jsonb, 
    p_new_price numeric DEFAULT NULL, 
    p_status text DEFAULT 'CURADO', 
    p_new_title text DEFAULT NULL, 
    p_new_image text DEFAULT NULL, 
    p_new_desc text DEFAULT NULL, 
    p_new_store text DEFAULT NULL
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_base_id UUID;
    v_gift_id UUID;
    v_old_price NUMERIC;
BEGIN
    -- 1. Obtém referências do registro antes do update
    SELECT presente_base_id, presente_id
    INTO v_base_id, v_gift_id
    FROM public.fila_ajuste_links
    WHERE id = p_id;

    -- 2. Atualiza a linha da fila com os dados curados ou erro definitivo
    UPDATE public.fila_ajuste_links
    SET 
        status = p_status,
        link_substituto = CASE WHEN p_status = 'CURADO' THEN p_new_link ELSE link_substituto END,
        parceiro_nome = CASE WHEN p_status = 'CURADO' THEN p_new_store ELSE parceiro_nome END,
        logs_cura = p_logs,
        atualizado_em = now(),
        motivo_quebra = CASE WHEN p_status = 'FALHA_MANUAL' THEN p_new_link ELSE motivo_quebra END
    WHERE id = p_id;

    -- Aborta propagação se for erro da IA
    IF p_status = 'FALHA_MANUAL' THEN
        RETURN;
    END IF;

    -- 3. Atualiza Catálogo Mestre e Clones Vinculados
    IF v_base_id IS NOT NULL THEN
        SELECT preco INTO v_old_price FROM public.presentes_base WHERE id = v_base_id;

        UPDATE public.presentes_base
        SET 
            link_varejo_padrao = p_new_link,
            parceiro_nome = COALESCE(p_new_store, parceiro_nome),
            nome = COALESCE(p_new_title, nome),
            imagem_url = COALESCE(p_new_image, imagem_url),
            descricao = COALESCE(p_new_desc, descricao),
            preco_de = CASE 
                         WHEN p_new_price IS NOT NULL AND p_new_price < v_old_price THEN v_old_price 
                         ELSE preco_de 
                       END,
            preco = COALESCE(p_new_price, preco)
        WHERE id = v_base_id;

        -- Propaga para todos os presentes da vitrine vinculados a essa base
        UPDATE public.presentes
        SET 
            link_externo = p_new_link,
            nome = COALESCE(p_new_title, nome),
            imagem_url = COALESCE(p_new_image, imagem_url),
            descricao = COALESCE(p_new_desc, descricao),
            parceiro_nome = COALESCE(p_new_store, parceiro_nome),
            preco_de = CASE 
                         WHEN p_new_price IS NOT NULL AND p_new_price < v_old_price THEN v_old_price 
                         ELSE preco_de 
                       END,
            preco = COALESCE(p_new_price, preco)
        WHERE base_id = v_base_id;
    END IF;

    -- 4. Atualiza Presente Avulso / Independente diretamente
    IF v_gift_id IS NOT NULL THEN
        SELECT preco INTO v_old_price FROM public.presentes WHERE id = v_gift_id;

        UPDATE public.presentes
        SET 
            link_externo = p_new_link,
            nome = COALESCE(p_new_title, nome),
            imagem_url = COALESCE(p_new_image, imagem_url),
            descricao = COALESCE(p_new_desc, descricao),
            parceiro_nome = COALESCE(p_new_store, parceiro_nome),
            preco_de = CASE 
                         WHEN p_new_price IS NOT NULL AND p_new_price < v_old_price THEN v_old_price 
                         ELSE preco_de 
                       END,
            preco = COALESCE(p_new_price, preco)
        WHERE id = v_gift_id;
    END IF;
END;
$function$;

-- 4. Otimização de Performance (Índices)
CREATE INDEX IF NOT EXISTS idx_presentes_base_id ON public.presentes(base_id);
CREATE INDEX IF NOT EXISTS idx_fila_ajuste_base_id ON public.fila_ajuste_links(presente_base_id);
CREATE INDEX IF NOT EXISTS idx_fila_ajuste_presente_id ON public.fila_ajuste_links(presente_id);
CREATE INDEX IF NOT EXISTS idx_comprovantes_presente_id ON public.comprovantes(presente_id);
CREATE INDEX IF NOT EXISTS idx_comprovantes_evento_id ON public.comprovantes(evento_id);

-- 5. Refinamento de RLS para Performance e Segurança
DROP POLICY IF EXISTS "Master total access fila_ajuste_links" ON public.fila_ajuste_links;
CREATE POLICY "Master total access fila_ajuste_links" ON public.fila_ajuste_links
FOR ALL TO authenticated USING (check_is_master());
