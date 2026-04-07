# STORY-010-GUEST-CRUD: Gerenciamento de Unidades de Convite

## Descrição
Como organizador, desejo cadastrar convites (Individual, Casal, Família), definir o limite de pessoas e editar essas informações, para que eu possa enviar os links aos convidados.

## Critérios de Aceitação
1. **Formulário de Cadastro:** Nome Principal, Tipo de Convite, Limite de Pessoas.
2. **Geração Automática de Slug:** O slug deve ser criado a partir do Nome Principal (ex: "Família Souza" -> "familia-souza").
3. **Listagem Admin:** Tabela exibindo todos os convites cadastrados (não apenas os que já responderam).
4. **Edição/Exclusão:** Possibilidade de corrigir nomes ou remover convites.

## Detalhes Técnicos
- Refatorar a listagem atual para mostrar a tabela `convites` completa.
- Implementar lógica de `slugify` no frontend ou backend.

## Status: DONE 🏆
