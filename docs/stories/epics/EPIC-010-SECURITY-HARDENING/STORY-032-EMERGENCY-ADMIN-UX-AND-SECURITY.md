# STORY-032: Admin UX & Security Emergency Refinement

## Descrição
Refinamento da experiência do administrador e segurança de acesso. Inclui a criação de uma tela de login dedicada, proteção de rotas admin no servidor, responsividade do painel administrativo e substituição de emojis por ícones.

## Critérios de Aceitação
1. Botão "ADM" visível e funcional no Navbar da página inicial.
2. Tela de login dedicada em `/admin` (apenas formulário).
3. Dashboard administrativo movido para `/admin/dashboard`.
4. Middleware protege `/admin/*` (exceto `/admin` login) redirecionando para login se não autenticado.
5. Todo o painel administrativo (Layout, Sidebar, Dashboard, Convidados, Presentes, Configurações) é 100% responsivo.
6. Todos os emojis removidos e substituídos por ícones (SVGs) conforme visão UX.
7. Implementação seguindo TDD com testes unitários para os novos componentes e lógica de autenticação.

## Status: DONE 🏆
