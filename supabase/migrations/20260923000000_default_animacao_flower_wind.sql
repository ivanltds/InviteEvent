-- Pedido do usuário em 23/09/2026: "no onboarding quero que use a
-- animação pétalas ao vento". Todo evento novo (via /criar → claimPendingInvite,
-- ou via Dashboard "+ Criar Novo" → eventService.createEvent) cria a linha em
-- `configuracoes` sem especificar `animacao_tipo` — o valor real vem do
-- DEFAULT da coluna. Trocando aqui cobre os dois caminhos de criação de
-- evento com uma única mudança, sem precisar tocar em cada insert.
--
-- Eventos já existentes (que já têm animacao_tipo = 'padrao' explícito na
-- linha) não são afetados — DEFAULT só vale pra INSERTs futuros que omitem
-- a coluna.

ALTER TABLE public.configuracoes
  ALTER COLUMN animacao_tipo SET DEFAULT 'flower_wind';
