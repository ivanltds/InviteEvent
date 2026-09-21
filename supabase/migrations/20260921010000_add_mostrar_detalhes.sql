-- Migration: 20260921010000_add_mostrar_detalhes
-- A seção "Detalhes do Evento" (A Cerimônia/A Recepção, com
-- local_cerimonia/endereco_cerimonia) acabou de ser restaurada no
-- convite (estava com import morto, nunca renderizava — ver commit
-- "fix(convite): restaura a secao de endereco da cerimonia"). Pedido de
-- acompanhamento do usuário: essa seção também precisa aparecer nos
-- controles de Módulos do Convite (Visibilidade) e na Ordem das Seções,
-- igual história/noivos/faq/mural. Idempotente, não altera nada existente.

ALTER TABLE public.configuracoes
  ADD COLUMN IF NOT EXISTS mostrar_detalhes boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.configuracoes.mostrar_detalhes IS
  'Seção "O Evento" (A Cerimônia/A Recepção) no convite. Controla a mesma seção que sec_ordem chave "detalhes".';

-- Atualiza o default de secoes_ordem para incluir "detalhes" como
-- primeira seção reordenável (logo após o hero). Não altera nenhuma
-- linha existente — só o valor usado em INSERTs futuros sem o campo
-- explícito; configs já salvas continuam com seu array antigo, e
-- resolveSecoesOrdem() no código já lida com chaves ausentes,
-- acrescentando "detalhes" ao final automaticamente nesse caso.
ALTER TABLE public.configuracoes
  ALTER COLUMN secoes_ordem SET DEFAULT '["detalhes","historia","noivos","agenda","rsvp","faq"]'::jsonb;
