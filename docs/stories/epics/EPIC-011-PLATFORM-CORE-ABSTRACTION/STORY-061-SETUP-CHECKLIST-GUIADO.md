# STORY-061: Checklist de Setup Guiado

## Descrição
Como organizador recém-cadastrado, desejo um checklist persistente no Dashboard que me mostre exatamente o que falta configurar no meu convite — incluindo as features mais recentes (modelo de cartão, fonte premium, animação de envelope, agenda, Link Único, FAQ) — para que eu não dependa de descobrir sozinho onde cada coisa fica em Configurações.

## Contexto / Motivação
Os dois fluxos de onboarding existentes tinham problemas reais:
- `/criar` (pré-cadastro): o passo de upload de foto de capa nunca persistia de verdade (`window.pendingCoverMedia` não era lido em lugar nenhum) e a data do casamento era hardcoded (`'2027-10-10'`).
- `OnboardingWizard.tsx` (pós-login): `handleFinish` só marcava `eventos.onboarding_completed = true` — nunca salvava nome/cores preenchidos pelo organizador. Era decorativo.
- Nenhum dos dois cobria as features mais recentes do produto (7 modelos de cartão, FontPicker premium, animação de envelope, Link Único, FAQ).
- O único indicador pós-cadastro era um banner estático genérico ("Vá em Configurações...") sem checklist nem progresso.

## O que foi feito
1. **`src/lib/constants/configDefaults.ts`**: `DEFAULT_CONFIG` extraído de `configuracoes/page.tsx` pra ser a fonte única de "valores-placeholder", compartilhada com o cálculo do checklist.
2. **`src/lib/utils/setupProgress.ts`**: progresso 100% derivado dos dados reais (`configuracoes`, `eventos_agenda`, `faq`, `presentes`) — sem tabela nova de estado. Compara a data do casamento contra `created_at + 180 dias` (o valor que `eventService.createEvent` grava automaticamente), não contra uma string fixa.
3. **`src/components/admin/SetupChecklist.tsx`**: substitui o banner estático no Dashboard. 7 itens com checkbox (nomes, data, local, agenda, capa, contribuição, FAQ) + 4 sugestões sempre visíveis (cartão, fonte, animação, Link Único), cada um linkando para `/admin/configuracoes#<âncora>`.
4. Âncoras (`id`) adicionadas em todas as ~14 seções de `configuracoes/page.tsx` (o mecanismo de scroll-to-hash já existia, só faltavam os ids).
5. **`OnboardingWizard.tsx` removido** (era decorativo) — dashboard agora monta só `<SetupChecklist />`.
6. **`/criar` corrigido**: passo de upload de foto removido (não tinha caminho de persistência real); campo de data do casamento agora é real e obrigatório. Fica com 3 passos em vez de 4.
7. **`claimPendingInvite` (login/page.tsx) corrigido**: removido o `update({ fotos: [...] })` — `fotos` não existe mais como coluna de `configuracoes` (virou `hero_images`/`galeria_fotos`); removido o fallback de data fictícia.

## Critérios de Aceitação (QA)
- [x] Dashboard mostra o checklist com % de progresso real, calculado a partir dos dados do evento.
- [x] Cada item do checklist linka para a seção certa de Configurações e o scroll funciona.
- [x] Checklist some sozinho quando o progresso chega a 100% (sem flag manual).
- [x] `/criar` não oferece mais um upload de foto que não persiste; data do casamento é obrigatória.
- [x] Nenhuma referência residual a `OnboardingWizard` no código.

## Status: ✅ DONE

## File List
- `src/lib/constants/configDefaults.ts` (novo)
- `src/lib/utils/setupProgress.ts` (novo) + `__tests__/setupProgress.test.ts`
- `src/components/admin/SetupChecklist.tsx` (novo) + `.module.css` + `__tests__/SetupChecklist.test.tsx`
- `src/app/(admin)/admin/dashboard/page.tsx` (modificado)
- `src/app/(admin)/admin/configuracoes/page.tsx` (modificado — ids de âncora)
- `src/app/(public)/criar/page.tsx` (modificado) + teste atualizado
- `src/app/(admin)/admin/login/page.tsx` (modificado)
- `src/components/admin/OnboardingWizard.tsx`, `.module.css`, teste (removidos)

## Notas de Implementação
- Ver STORY-046 (substituída por esta story).
- `eventos.onboarding_completed` mantida no banco por compatibilidade, mas não é mais usada pra gatear UI.
