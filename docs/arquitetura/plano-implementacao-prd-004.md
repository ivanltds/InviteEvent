# Plano de Implementação: Blindagem de Testes (PRD-004) 🛡️
> Foco: Qualidade Assegurada e Prevenção de Regressão UX/UI

Este documento define as diretrizes técnicas para a automação da fase final do PRD-004. Ele serve como o contrato imutável de comportamento esperado da aplicação. 

> **🚨 REGRA DE OURO**: Se houver discrepância entre o teste automatizado e o comportamento da aplicação, **o teste NÃO DEVE ser afrouxado**. O código da aplicação DEVE ser corrigido para obedecer ao critério de aceitação definido neste plano.

---

## 1. Mapa de Impacto de Alterações (Áreas de Monitoramento)

As implementações feitas introduziram as seguintes mutações que exigem monitoramento E2E rígido:

| Funcionalidade | Mutação Técnica | Risco Potencial de Regressão |
| :--- | :--- | :--- |
| **Preview Simulador** | Troca de Media Query por Container Query (`cqw`) | Alterações no CSS pai podem corromper a renderização de fontes no preview. |
| **Dashboard Cards** | Centralização com `stopPropagation()` nas ações do Card | Clicar no ícone de "Lixeira" pode acionar a navegação indesejada para o evento. |
| **Suporte Mobile** | Toggle condicional de `display: none/flex` via CSS `.layout.hasSelection` | Perda da classe reativa quebra a alternância entre Lista e Chat. |
| **Sidebar iOS** | Altura baseada em `100dvh` e Z-Index `99999` | Plugins futuros de terceiros podem sobrescrever e esconder botões vitais. |

---

## 2. Detalhamento Técnico dos Cenários de Teste (Playwright Suite)

### 🧪 CENÁRIO 1: Integridade do Container Query (Escalonamento Isolado)
Garantir que a fonte do simulador responda ao container pai, NÃO à viewport total.
- **Setup**: Acessar `/admin/configuracoes` em viewport Desktop (1280x720).
- **Ações**:
  1. Localizar o iframe/container de preview `.phonePreview`.
  2. Ler o tamanho da fonte renderizado em `.historiaTitle`.
- **Critério de Aceitação (Assert)**: 
  - A fonte deve estar entre 16px e 32px (ou equivalente clamp calculada pelo bounding box do container de 380px). 
  - **Falha Imediata**: Se a fonte ultrapassar 40px (indicando que está lendo a largura do monitor de 1280px).

### 🧪 CENÁRIO 2: Blindagem de Z-Index & Scroll no iPhone SE
Garantir visibilidade 100% da Sidebar mesmo com widgets flutuantes ativos.
- **Setup**: Usar `devices['iPhone SE']` (375x667) no Playwright config.
- **Ações**:
  1. Abrir Menu Hambúrguer.
  2. Rolar o menu lateral até o final via `scrollIntoViewIfNeeded()`.
  3. Clicar no botão `Sair da Conta`.
- **Critério de Aceitação (Assert)**:
  - O botão "Sair da Conta" deve receber o evento `click()` sem interceptação visual (`toBeVisible()`).
  - O elemento `.sidebarWrapper` deve possuir estilo computado `z-index` igual a `99999`.

### 🧪 CENÁRIO 3: RBAC Check (Owner vs Staff no Dashboard)
Validar o bloqueio visual baseado em papéis na tela unificada.
- **Setup**: Injeção de estados mock no Supabase (`role: organizador` e `role: owner`).
- **Caso A (Staff)**:
  - **Ações**: Listar cards no dashboard.
  - **Assert**: O elemento seletor `.miniDeleteBtn` e `.miniEditBtn` devem retornar contagem ZERO (`toHaveCount(0)`).
- **Caso B (Owner/Master)**:
  - **Ações**: Listar cards no dashboard.
  - **Assert**: Os seletores de gestão DEVEM estar presentes e clicáveis.

### 🧪 CENÁRIO 4: Isolamento de Eventos (Botão Excluir)
Garantir que `stopPropagation` não foi removido acidentalmente.
- **Setup**: Estar na plataforma (/admin/dashboard) sem evento selecionado.
- **Ações**: 
  1. Clicar no botão `🗑️` do card.
  2. Playwright deve interceptar e CANCELAR o `dialog.dismiss()` nativo de confirmação.
- **Critério de Aceitação (Assert)**:
  - A URL deve PERMANECER em `/admin/dashboard`.
  - O `EventContext` não deve ter disparado e mudado o título do painel. A navegação para dentro do evento NÃO PODE ocorrer se o foco for a lixeira.

### 🧪 CENÁRIO 5: Fluxo Bidirecional de Chat Mobile
Testar a transição da "single-column logic" do Painel de Suporte.
- **Setup**: Viewport móvel (< 768px), logado como Master, acessar `/admin/suporte`.
- **Fase 1 (Listagem)**:
  - **Assert**: Lista de chamados `.sidebar` visível; Painel de chat `.chatPanel` invisível (`toBeHidden`).
- **Fase 2 (Chat)**:
  - **Ação**: Clicar no primeiro chamado da lista.
  - **Assert**: Lista `.sidebar` invisível (`toBeHidden`); Painel de chat visível; Botão `.backButton` visível e operante.
- **Fase 3 (Retorno)**:
  - **Ação**: Clicar no botão `.backButton`.
  - **Assert**: Retorno imediato ao estado da Fase 1.

---

## 3. Estratégia de Execução e CI/CD

A Blindagem do PRD-004 deve ser implantada criando um novo arquivo de especificação física na árvore de testes do projeto:

1. **Local do Arquivo**: `tests/e2e/admin/prd-004-shielding.spec.ts`
2. **Gatilho de Execução**: Pre-Commit ou CI Pipeline automatizado.
3. **Geração de Evidências**: Habilitar captura automática de vídeo e screenshot apenas para FALHAS, permitindo análise visual de quebra de layout instantânea.

---
*Elaborado por: Antigravity (Arquitetura e QA) | Aprovado para Implantação.*
