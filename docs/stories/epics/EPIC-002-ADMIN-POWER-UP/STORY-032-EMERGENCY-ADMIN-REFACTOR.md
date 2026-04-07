# STORY-032: Refatoração de Acesso Administrativo e UX

## Descrição
Como organizador, desejo uma porta de entrada clara para a administração na Home, com uma tela de login dedicada e uma interface responsiva sem emojis, utilizando ícones profissionais para uma experiência sofisticada.

## Critérios de Aceitação
1. **Acesso na Navbar:** Adicionar link "ADM" na Navbar principal.
2. **Tela de Login Dedicada:** Criar `/admin` como uma tela de login exclusiva (bloqueando o acesso ao dashboard).
3. **Segurança de Backend:** Garantir que rotas `/admin/*` não renderizem conteúdo sem o cookie de autenticação (Middleware/Server-side check).
4. **Remoção de Emojis:** Substituir todos os emojis por ícones (SVGs ou Lucide/Heroicons) em todo o projeto.
5. **Admin Responsivo:** Ajustar layouts de tabelas e formulários para 100% de responsividade.
6. **UX Refinada:** Aplicar visão da Uma (@ux-design-expert) para ícones e espaçamentos.

## Status: In Progress 🛠️
