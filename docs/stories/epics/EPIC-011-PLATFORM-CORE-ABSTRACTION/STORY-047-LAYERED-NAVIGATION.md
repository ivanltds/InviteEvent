# STORY-047: Navegação em Camadas (Refined)

## Descrição
Como organizador, desejo uma interface que separe claramente as responsabilidades de gestão de conta (Plataforma) das tarefas do dia a dia do casamento (Evento).

## Requisitos Detalhados
1. **Sidebar - Nível 1 (Plataforma):**
   - Itens: "Meus Casamentos", "Assinatura & Faturamento".
   - Acesso: Apenas Owners e Masters.
2. **Sidebar - Nível 2 (Evento):**
   - Contexto: Habilitado apenas quando um evento está selecionado.
   - Itens: Dashboard, Convidados, Presentes, Galeria, Visual do Site, Equipe.
3. **Context Switcher:**
   - Dropdown no topo da Sidebar mostrando Nome do Evento Atual + Ícone de Troca.
   - Ao trocar, atualizar o `currentEvent` no `EventContext` global.
4. **Resiliência:** Salvar o último evento acessado no `localStorage` para carregamento automático no login.

## Critérios de Aceitação (QA)
- [ ] GIVEN um usuário Organizador (sem ser dono) WHEN logar THEN ele NÃO deve ver o menu "Assinatura".
- [ ] GIVEN a troca de evento THEN todas as páginas (Convidados, etc) devem refletir os dados do novo evento IMEDIATAMENTE.
- [ ] GIVEN a Sidebar THEN ela deve ser colapsável em telas menores.

## Status: ✅ DONE 🏆

## Notas de Implementação
- `Sidebar.tsx` (7.5KB) com navegação em camadas: Plataforma (Meus Casamentos) + Evento (Convidados, Presentes, etc.)
- Context Switcher no topo da Sidebar com dropdown do evento atual
- Mobile responsive com hamburger menu + overlay
- `AdminLayout.module.css` + `Sidebar.module.css` com collapse responsivo
