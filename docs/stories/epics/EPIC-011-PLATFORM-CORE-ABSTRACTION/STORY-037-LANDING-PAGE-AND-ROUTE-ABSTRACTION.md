# STORY-037: Landing Page de Vendas e Abstração de Rotas

## Descrição
Como proprietário da plataforma, desejo que a rota raiz (`/`) apresente uma landing page profissional vendendo o InviteEventAI para novos casais, enquanto a experiência do convite privado deve ser movida para rotas dinâmicas, iniciando a transição para um modelo SaaS.

## Critérios de Aceitação
1. **Landing Page na Raiz:** A rota `/` deve exibir uma página de marketing com Pitch de Vendas, Features (RSVP, Presentes, Customização) e CTAs.
2. **Abstração do Convite:** A experiência completa do convite (Hero, História, Noivos, RSVP) deve ser movida para `/inv/[slug]`.
3. **Persistência de Contexto:** Ao acessar um convite, o sistema deve carregar as configurações do evento e o convidado específico baseado no slug.
4. **Isolamento de Marca:** A landing page não deve expor dados de casamentos individuais.

## Status: ✅ DONE

## Notas de Implementação
- Criada nova `page.tsx` na raiz com design focado em conversão.
- Criada estrutura de pastas `app/(public)/inv/[slug]/page.tsx` para o convite.
- Mantido suporte ao parâmetro `?invite=slug` na lista de presentes para garantir fluxo de reserva.
