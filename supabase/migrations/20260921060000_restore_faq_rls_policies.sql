-- Migration: 20260921060000_restore_faq_rls_policies
-- Bug reportado pelo usuário: "quando eu edito a faq ela não esta
-- mudando no casamento atual" — a tabela public.faq tem RLS ativado
-- (ALTER TABLE faq ENABLE ROW LEVEL SECURITY, migration
-- 20260407020000) mas NENHUMA policy está cadastrada em produção hoje
-- (removidas, junto com a antiga policy insegura "Admin full access
-- faq ... USING (true)" que abria escrita pra qualquer um, autenticado
-- ou não, numa limpeza de segurança anterior — sem repor o
-- substituto). Resultado: toda consulta via cliente browser (admin OU
-- convite público) retorna vazio, então o FAQ.tsx público sempre caía
-- no fallback DEFAULT_FAQS, nunca refletindo as edições reais.
--
-- Repõe as 2 policies no mesmo padrão já usado em eventos_agenda e
-- presentes: leitura pública (qualquer um vê o FAQ do convite) +
-- gestão restrita a organizadores do evento (check_is_organizer),
-- substituindo a antiga "USING (true)" pra todos os comandos.
-- Idempotente.

DROP POLICY IF EXISTS "Leitura pública de faq" ON public.faq;
DROP POLICY IF EXISTS "Admin full access faq" ON public.faq;
DROP POLICY IF EXISTS "FAQ: Leitura Pública" ON public.faq;
DROP POLICY IF EXISTS "FAQ: Gestão" ON public.faq;

CREATE POLICY "FAQ: Leitura Pública" ON public.faq
  FOR SELECT TO public
  USING (true);

CREATE POLICY "FAQ: Gestão" ON public.faq
  FOR ALL TO public
  USING (check_is_organizer(evento_id));
