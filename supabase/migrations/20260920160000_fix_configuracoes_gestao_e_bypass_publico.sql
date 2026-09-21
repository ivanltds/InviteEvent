-- Migration: 20260920160000_fix_configuracoes_gestao_e_bypass_publico
-- Corrige dois problemas em public.configuracoes encontrados ao vivo em
-- produção (upsert de configurações do evento falhando com "new row
-- violates row-level security policy for table configuracoes"):
--
-- 1) BUG: "Config: Gestão" usava check_is_owner() (só quem tem literalmente
--    role='owner' em evento_organizadores) — diferente de TODAS as outras
--    tabelas de gestão do evento (convites, agenda, presentes, mural,
--    rsvp, eventos, galeria...), que usam check_is_organizer() (qualquer
--    organizador do evento, e também contas master). Isso bloqueava
--    co-organizadores e masters de salvar configurações, mesmo podendo
--    editar tudo o resto do evento sem problema. Como configuracoes.upsert
--    usa on_conflict (INSERT ... ON CONFLICT DO UPDATE), o Postgres exige
--    que a policy de INSERT passe mesmo quando o resultado prático é um
--    UPDATE — e só "Config: Gestão" cobria INSERT nesta tabela.
--
-- 2) VULNERABILIDADE CRÍTICA (SEG-04, mesma classe já corrigida em
--    20260920100000 para rsvp/convites/comprovantes, mas deixada de fora
--    daquela migration de propósito para revisão humana): a policy
--    "Admin update configs" era `USING (true) TO public` — ou seja,
--    QUALQUER PESSOA DA INTERNET, SEM LOGIN, podia alterar a
--    configuracoes de QUALQUER evento (chave PIX, template de WhatsApp,
--    textos, etc.), bastando saber o evento_id (um UUID público, não
--    secreto). Removida agora.

DROP POLICY IF EXISTS "Config: Gestão" ON public.configuracoes;
CREATE POLICY "Config: Gestão" ON public.configuracoes
  FOR ALL TO authenticated
  USING (public.check_is_organizer(evento_id))
  WITH CHECK (public.check_is_organizer(evento_id));

DROP POLICY IF EXISTS "Admin update configs" ON public.configuracoes;

-- Duplicata exata de "Config: Leitura Pública" (mesma condição true,
-- mesmo efeito) — remove só por limpeza, não é vulnerabilidade.
DROP POLICY IF EXISTS "Leitura pública de configs" ON public.configuracoes;
