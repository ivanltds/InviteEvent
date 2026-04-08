# STORY-036: Restrição de Acesso ao RSVP (Privacy First)

## Descrição
Como organizador, desejo que apenas convidados com o link direto possam acessar o formulário de confirmação, removendo a ferramenta de busca pública, para garantir a privacidade dos dados do evento e evitar confirmações não autorizadas.

## Critérios de Aceitação
1. **Remoção da Busca:** O campo de busca por nome/slug na seção RSVP deve ser completamente removido.
2. **Acesso via Link Único:** O formulário de RSVP só deve ser carregado se um parâmetro `?invite=slug` (ou rota `/inv/[slug]`) estiver presente e for válido.
3. **Estado de Bloqueio:** Se um usuário acessar o RSVP sem o parâmetro, deve ser exibida uma mensagem de "Acesso Restrito" instruindo-o a utilizar o link individual.
4. **Segurança de Dados:** Nomes e limites de pessoas não devem ser expostos até que um token válido seja validado.

## Status: ✅ DONE

## Notas de Implementação
- Removido componente de busca em `RSVP.tsx`.
- Implementado estado `noInviteFound` para controle de UI.
- Integrado com o sistema de slugs ofuscados da STORY-028.
