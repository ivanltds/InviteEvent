# STORY-005-DATA-PERSISTENCE: Modelagem e Persistência de Dados (Supabase)

## Descrição
Implementação da camada de dados persistente para suportar o RSVP e a Lista de Presentes. Substituição dos Mocks por integração real com o Supabase.

## Critérios de Aceitação
1. **Configuração do Cliente:** Criação de `src/lib/supabase.ts` com variáveis de ambiente.
2. **Schema - Convites:** Tabela `convites` (id, nome_principal, tipo, limite_pessoas, slug).
3. **Schema - RSVP:** Tabela `rsvp` (id, convite_id, confirmados, restricoes, mensagem, created_at).
4. **Schema - Presentes:** Tabela `presentes` (id, nome, preco, descricao, imagem_url, status).
5. **Integração:** Refatoração de `RSVP.tsx` e `PresentesPage` para consumir dados assíncronos.
6. **Segurança:** Configuração básica de RLS (Row Level Security) para acesso público de leitura e escrita restrita.

## Detalhes Técnicos (Data Engineer)
- **Convites:** 
  - `id` (uuid)
  - `slug` (text, unique) - Usado para busca rápida no RSVP.
- **RSVP:** 
  - `convite_id` (foreign key -> convites.id).

## QA Scenarios
- [ ] Validar salvamento de RSVP no Supabase.
- [ ] Validar busca de convite real por slug.
- [ ] Validar listagem de presentes via banco de dados.

## Status: DONE 🏆
