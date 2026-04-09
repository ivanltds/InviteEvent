# Story: ADMIN-10 - Gestão Nominal de Membros (Família)

## Status: Done ✅

### Story
Como noivo/admin do sistema,
Quero cadastrar os nomes individuais dos membros de cada convite,
Para que o RSVP possa ser feito nominalmente e eu tenha uma lista de presença precisa.

### Critérios de Aceite
1. **Interface de Cadastro:** Adicionar campos dinâmicos no formulário de convite.
2. **Persistência:** Salvar na tabela `convidados_membros`.
3. **Edição:** Permitir adicionar/remover membros de um convite existente.
4. **Sincronização:** Os membros cadastrados devem aparecer automaticamente na tela de RSVP do convidado.

### Dev Notes
- Implementado via `upsert` no `inviteService`.
- UI dinâmica usando estado local para a lista de nomes.
