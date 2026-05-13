-- PRD-012-A: Fundação Smart Gift List
-- Criação de Categorias Canônicas, Catálogo Base SaaS e Links de Rastreabilidade de Clones.

-- ==========================================
-- 1. TABELAS E ESTRUTURA DE DADOS
-- ==========================================

-- 1.1 Criar Tabela de Categorias Canônicas
CREATE TABLE IF NOT EXISTS public.presentes_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    ordem_padrao INT DEFAULT 0,
    criado_em TIMESTAMPTZ DEFAULT now()
);

-- 1.2 Criar Tabela do Catálogo SaaS Base
CREATE TABLE IF NOT EXISTS public.presentes_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    preco NUMERIC NOT NULL,
    descricao TEXT,
    imagem_url TEXT,
    categoria_id UUID REFERENCES public.presentes_categorias(id) ON DELETE RESTRICT,
    link_varejo_padrao TEXT,
    parceiro_nome TEXT,
    criado_em TIMESTAMPTZ DEFAULT now()
);

-- 1.3 Estender Tabela de Presentes Legada de Forma Não-Bloqueante (Retrocompatibilidade Rígida)
-- 🚨 Colunas incluídas como NULLABLE para garantir compatibilidade com o casamento em prod.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='presentes' AND column_name='categoria_id') THEN
        ALTER TABLE public.presentes ADD COLUMN categoria_id UUID REFERENCES public.presentes_categorias(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='presentes' AND column_name='base_id') THEN
        ALTER TABLE public.presentes ADD COLUMN base_id UUID REFERENCES public.presentes_base(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ==========================================
-- 2. SEGURANÇA E POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ==========================================

-- Habilitar RLS
ALTER TABLE public.presentes_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentes_base ENABLE ROW LEVEL SECURITY;

-- Dropar se já existirem (segurança contra re-runs)
DROP POLICY IF EXISTS "Leitura pública de categorias" ON public.presentes_categorias;
DROP POLICY IF EXISTS "Modificações permitidas apenas para Masters (Categorias)" ON public.presentes_categorias;
DROP POLICY IF EXISTS "Leitura de catálogo base por casais logados" ON public.presentes_base;
DROP POLICY IF EXISTS "Modificações permitidas apenas para Masters (Catalogo Base)" ON public.presentes_base;

-- Criar Políticas
CREATE POLICY "Leitura pública de categorias" 
ON public.presentes_categorias FOR SELECT USING (true);

CREATE POLICY "Modificações permitidas apenas para Masters (Categorias)"
ON public.presentes_categorias FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.perfis 
        WHERE perfis.id = auth.uid() AND perfis.is_master = true
    )
);

CREATE POLICY "Leitura de catálogo base por casais logados" 
ON public.presentes_base FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Modificações permitidas apenas para Masters (Catalogo Base)"
ON public.presentes_base FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.perfis 
        WHERE perfis.id = auth.uid() AND perfis.is_master = true
    )
);

-- ==========================================
-- 3. SEED INICIAL DE DADOS CANÔNICOS
-- ==========================================

-- 3.1 Inserção de 8 Categorias Canônicas com IDs Fixos para Rastreabilidade
INSERT INTO public.presentes_categorias (id, nome, slug, ordem_padrao) VALUES
('d13fb749-f7ad-41e8-876d-32a5f74689ea', 'Cozinha & Utensílios', 'cozinha-utensilios', 1),
('e24fc850-a8be-42f9-987e-43b6a85790fb', 'Eletrodomésticos', 'eletrodomesticos', 2),
('f35ad961-b9cf-530a-098f-54c7b96801ac', 'Cama, Mesa & Banho', 'cama-mesa-banho', 3),
('a46be072-c0df-641b-109a-65d8c07912bd', 'Decoração & Organização', 'decoracao-organizacao', 4),
('b57cf183-d1ef-752c-210b-76e9d18a23ce', 'Lazer, Bar & Churrasco', 'lazer-bar-churrasco', 5),
('c68de294-e2ff-863d-321c-87fae29b34df', 'Eletrônicos & Tecnologia', 'eletronicos-tecnologia', 6),
('da9ef305-f30a-974e-432d-980bf30c45e0', 'Móveis', 'moveis', 7),
('eb0af416-041b-085f-543e-091c041d56f1', 'Viagem, Cotas & Lua de Mel', 'viagem-lua-mel', 8)
ON CONFLICT (slug) DO NOTHING;

-- 3.2 Inserção de 20 Itens Globais Mestre SaaS
INSERT INTO public.presentes_base (nome, preco, descricao, imagem_url, categoria_id, parceiro_nome, link_varejo_padrao) VALUES
-- Cozinha & Utensílios
('Jogo de Panelas Tramontina 5 Peças', 450.00, 'Revestimento interno antiaderente Starflon Max, cabos antitérmicos e tampa de vidro temperado.', 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=800&auto=format&fit=crop', 'd13fb749-f7ad-41e8-876d-32a5f74689ea', 'Amazon Brasil', 'https://www.amazon.com.br'),
('Aparelho de Jantar Oxford 30 Peças', 320.00, 'Porcelana de alta qualidade, ideal para refeições do dia a dia ou ocasiões formais.', 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=800&auto=format&fit=crop', 'd13fb749-f7ad-41e8-876d-32a5f74689ea', 'Magalu', 'https://www.magazineluiza.com.br'),
('Conjunto de Talheres Inox 24 Peças', 150.00, 'Aço inoxidável polido com estojo de luxo. Altíssima durabilidade e elegância.', 'https://images.unsplash.com/photo-1576506542790-51244b48640b?q=80&w=800&auto=format&fit=crop', 'd13fb749-f7ad-41e8-876d-32a5f74689ea', 'Amazon Brasil', 'https://www.amazon.com.br'),

-- Eletrodomésticos
('Batedeira KitchenAid Artisan 4.8L', 2899.00, 'Movimento planetário exclusivo com 59 pontos de contato. Corpo robusto todo em metal.', 'https://images.unsplash.com/photo-1594385208974-2e75f9d8ad48?q=80&w=800&auto=format&fit=crop', 'e24fc850-a8be-42f9-987e-43b6a85790fb', 'Amazon Brasil', 'https://www.amazon.com.br'),
('Airfryer Oster Oven Digital 12L', 899.90, '3 em 1: Frita sem óleo, assa e desidrata. Painel digital touch intuitivo.', 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?q=80&w=800&auto=format&fit=crop', 'e24fc850-a8be-42f9-987e-43b6a85790fb', 'Mercado Livre', 'https://www.mercadolivre.com.br'),
('Adega Climatizada Brastemp 12 Garrafas', 1450.00, 'Controle eletrônico Touch Sensor com display de temperatura em LED.', 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=800&auto=format&fit=crop', 'e24fc850-a8be-42f9-987e-43b6a85790fb', 'Fast Shop', 'https://www.fastshop.com.br'),
('Máquina de Café Nespresso Vertuo', 980.00, 'Extração inteligente por leitura de código de barras na cápsula, espuma incomparável.', 'https://images.unsplash.com/photo-1517914285631-79c98070797f?q=80&w=800&auto=format&fit=crop', 'e24fc850-a8be-42f9-987e-43b6a85790fb', 'Nespresso Store', 'https://www.nespresso.com.br'),

-- Cama, Mesa & Banho
('Jogo de Cama Trussardi 300 Fios Cetim', 750.00, 'Algodão egípcio fio penteado de toque acetinado supremo e toque de seda.', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=800&auto=format&fit=crop', 'f35ad961-b9cf-530a-098f-54c7b96801ac', 'Amazon Brasil', 'https://www.amazon.com.br'),
('Jogo de Toalhas Buddemeyer Gigante', 350.00, '100% algodão de fibra longa, acabamento sofisticado e altíssima absorção.', 'https://images.unsplash.com/photo-1616627547584-bf28cee262db?q=80&w=800&auto=format&fit=crop', 'f35ad961-b9cf-530a-098f-54c7b96801ac', 'Riachuelo Home', 'https://www.riachuelo.com.br'),
('Edredom Plumas de Ganso Queen', 1100.00, 'Super macio e isolante térmico luxuoso para noites confortáveis em todas as estações.', 'https://images.unsplash.com/photo-1582582621959-48d27397dc69?q=80&w=800&auto=format&fit=crop', 'f35ad961-b9cf-530a-098f-54c7b96801ac', 'Mmartan', 'https://www.mmartan.com.br'),

-- Decoração & Organização
('Conjunto 3 Vasos de Cristal Murano', 890.00, 'Cristais artesanais com pó de ouro 24k. Sofisticação única para a sala.', 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?q=80&w=800&auto=format&fit=crop', 'a46be072-c0df-641b-109a-65d8c07912bd', 'Westwing', 'https://www.westwing.com.br'),
('Organizador Giratório em Acrílico', 180.00, 'Organizador 360 graus para perfumes e maquiagens, otimizando espaço na penteadeira.', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop', 'a46be072-c0df-641b-109a-65d8c07912bd', 'Amazon Brasil', 'https://www.amazon.com.br'),

-- Lazer, Bar & Churrasco
('Churrasqueira Weber Smokey Joe', 790.00, 'Churrasqueira portátil a carvão Weber, perfeita para piqueniques e sacadas.', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop', 'b57cf183-d1ef-752c-210b-76e9d18a23ce', 'Carrefour', 'https://www.carrefour.com.br'),
('Kit Barman Inox com Dosador e Coqueteleira', 199.90, 'Estojo completo em bambu para preparo de caipirinhas e drinks internacionais.', 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800&auto=format&fit=crop', 'b57cf183-d1ef-752c-210b-76e9d18a23ce', 'Amazon Brasil', 'https://www.amazon.com.br'),

-- Eletrônicos & Tecnologia
('Smart TV LG OLED Evo C3 55"', 6400.00, 'Painel OLED com brilho incrível, processador AI Alpha 9 Gen6 e 120Hz nativo.', 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=800&auto=format&fit=crop', 'c68de294-e2ff-863d-321c-87fae29b34df', 'Fast Shop', 'https://www.fastshop.com.br'),
('Caixa de Som Bluetooth JBL Charge 5', 950.00, 'Som potente JBL Original Pro Sound, bateria de até 20h e à prova d''água IP67.', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=800&auto=format&fit=crop', 'c68de294-e2ff-863d-321c-87fae29b34df', 'Amazon Brasil', 'https://www.amazon.com.br'),

-- Móveis
('Poltrona Charles Eames Couro Natural', 3900.00, 'Ícone do design mundial, confeccionada em multilaminado de madeira e couro legítimo.', 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=800&auto=format&fit=crop', 'da9ef305-f30a-974e-432d-980bf30c45e0', 'Tok&Stok', 'https://www.tokstok.com.br'),
('Mesa de Cabeceira Retrô Estilizada', 250.00, 'Madeira maciça reflorestada, gavetas com corrediça metálica.', 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?q=80&w=800&auto=format&fit=crop', 'da9ef305-f30a-974e-432d-980bf30c45e0', 'MadeiraMadeira', 'https://www.madeiramadeira.com.br'),

-- Viagem & Cotas (Lua de Mel)
('Cota Lua de Mel: Jantar Romântico em Paris', 500.00, 'Ajude os noivos a desfrutar de um jantar especial aos pés da Torre Eiffel.', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop', 'eb0af416-041b-085f-543e-091c041d56f1', 'InviteEvent Gateway', '#'),
('Cota Lua de Mel: Passeio de Gondola em Veneza', 300.00, 'Um romântico passeio pelos canais mais famosos da Itália.', 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=800&auto=format&fit=crop', 'eb0af416-041b-085f-543e-091c041d56f1', 'InviteEvent Gateway', '#')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 4. VIEW DO MOTOR DE RANKING DINÂMICO
-- ==========================================
CREATE OR REPLACE VIEW public.view_presentes_categoria_ranking AS
WITH clicks_stats AS (
  SELECT 
    evento_id, 
    (metadata->>'categoria_id')::UUID as cat_id, 
    COUNT(*) as click_count
  FROM public.analytics_events
  WHERE categoria = 'gift' AND evento_tipo = 'click_categoria'
  GROUP BY evento_id, (metadata->>'categoria_id')::UUID
),
received_stats AS (
  SELECT 
    evento_id, 
    categoria_id, 
    COUNT(*) as count_recebidos
  FROM public.presentes
  WHERE status IN ('reservado')
  GROUP BY evento_id, categoria_id
)
SELECT 
  c.id AS categoria_id,
  c.nome,
  c.slug,
  e.id AS evento_id,
  -- Fórmula de Score: (Cliques * 0.4) + (Presentes Recebidos * 0.6)
  (COALESCE(cl.click_count, 0) * 0.4) + (COALESCE(rec.count_recebidos, 0) * 0.6) AS ranking_score
FROM public.eventos e
CROSS JOIN public.presentes_categorias c
LEFT JOIN clicks_stats cl ON cl.evento_id = e.id AND cl.cat_id = c.id
LEFT JOIN received_stats rec ON rec.evento_id = e.id AND rec.categoria_id = c.id
ORDER BY ranking_score DESC, c.ordem_padrao ASC;

