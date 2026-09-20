-- Seed de fixtures para desenvolvimento local e E2E (Playwright).
-- Nunca é aplicado em produção (o Supabase CLI só roda isto contra o
-- banco local, via `supabase start`/`db reset`; `db push` nunca lê este
-- arquivo). Adicionado em 20/09/2026 porque tests/stress/stress.setup.ts
-- e tests/stress/concurrency_reserva.spec.ts (teste de concorrência do
-- lock atômico de presentes, PRD-018) dependiam de um convite/presente
-- específico que nunca existia em banco nenhum — o arquivo nem existia
-- (`supabase start` avisava "no files matched pattern: supabase/seed.sql"),
-- então o teste de estresse nunca rodava em lugar nenhum, nem localmente
-- nem no CI.

INSERT INTO public.eventos (id, nome, slug, is_active)
VALUES ('00000000-0000-0000-0000-0000000e2e01', 'Evento de Testes E2E', 'evento-e2e-stress', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.convites (id, evento_id, nome_principal, slug, limite_pessoas)
VALUES ('00000000-0000-0000-0000-0000000e2e02', '00000000-0000-0000-0000-0000000e2e01', 'Visitante de Estresse', 'visitante-stress', 5)
ON CONFLICT (id) DO NOTHING;

-- Item único, sem fracionamento (permite_cotas=false), status='disponivel'
-- por padrão — é exatamente o caminho de reservar_cotas_presente_v2 que o
-- teste de concorrência (15 browsers simultâneos) exercita.
INSERT INTO public.presentes (id, evento_id, nome, preco, status)
VALUES ('00000000-0000-0000-0000-0000000e2e03', '00000000-0000-0000-0000-0000000e2e01', 'ITEM STRESS ÚNICO', 199.90, 'disponivel')
ON CONFLICT (id) DO NOTHING;
