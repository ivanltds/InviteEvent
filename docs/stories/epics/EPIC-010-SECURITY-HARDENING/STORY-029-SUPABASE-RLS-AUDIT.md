# STORY-029: Auditoria e Refinamento de RLS (Supabase)

## Descrição
Revisar todas as políticas de Row Level Security (RLS) no Supabase para garantir que usuários anônimos só possam ler e escrever o mínimo necessário.

## Critérios de Aceitação
1. **Bloqueio de Leitura Global:** Garantir que a tabela `rsvp` e `comprovantes` não permita `SELECT` público sem filtro de ID específico.
2. **Políticas de Insert:** Restringir inserts apenas para chaves válidas.
3. **Configurações Sensíveis:** Impedir que a chave PIX e outros dados admin sejam lidos via cliente Supabase anônimo fora das views permitidas.

## Status: ✅ DONE 🏆

## Notas de Implementação
- 23 SQL migrations aplicadas incluindo `finalize_multi_tenant_rls.sql`
- RLS aplicado em todas as tabelas: `convites`, `rsvp`, `presentes`, `comprovantes`, `configuracoes`, `eventos`, `evento_organizadores`
- Isolamento por `evento_id` vinculado ao `owner_id` via `evento_organizadores`
- Políticas de leitura pública restritas ao mínimo necessário
