-- Migration: 20260921000000_fix_perfis_revoke_is_master_table_level
-- A migration 20260920100000 tentou `REVOKE UPDATE (is_master) ON
-- public.perfis FROM authenticated, anon` mas isso não teve efeito
-- nenhum: `authenticated` e `anon` já tinham GRANT UPDATE de TABELA
-- INTEIRA (não por coluna) em perfis — e um grant de tabela inteira
-- cobre implicitamente qualquer coluna, mesmo com um REVOKE column-level
-- por cima. Confirmado ao vivo via has_column_privilege() continuando
-- true depois da migration anterior já aplicada.
--
-- Correção: revoga o UPDATE de tabela inteira e reconcede explicitamente
-- só nas colunas que o próprio usuário pode legitimamente editar no seu
-- perfil (email, nome, cpf, telefone) — nunca `id` (chave primária) nem
-- `is_master`. anon não precisa de grant nenhum aqui: a policy "Perfis:
-- Update" exige id = auth.uid(), que anon nunca satisfaz.

REVOKE UPDATE ON public.perfis FROM authenticated, anon;
GRANT UPDATE (email, nome, cpf, telefone) ON public.perfis TO authenticated;
