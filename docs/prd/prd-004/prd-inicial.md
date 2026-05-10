# PRD-004 — Refatoração UX/UI, Mobile Defense e Centralização de Gestão 🚀
> Versão: 1.0 | Data: 2026-05-10 | Status: CONCLUÍDO (Póstumo)

## 1. Visão Geral do Produto
Após a implementação das fases de negócio, identificou-se a necessidade de um ciclo agressivo de refinamento de interface (UI), experiência do usuário (UX) focada em dispositivos móveis, e simplificação da arquitetura da informação. O PRD-004 consolida as modificações feitas para garantir que a plataforma seja 100% funcional em emuladores mobiles (Previews), livre de conflitos de UI overlapping e estruturalmente mais leve com a fusão de rotas redundantes.

## 2. Alterações Implementadas (Executadas)

### 2.1. Engine de Container Queries no Simulador
- **Problema**: Unidades `vw` causavam distorção no visualizador embutido de 380px do Dashboard, pois liam o tamanho da janela física do monitor.
- **Solução**: Mudança global para `cqw` (Container Queries) nas seções `Historia` e `OsNoivos`.
- **Impacto**: As fontes e elementos escalam perfeitamente dentro da moldura de preview do celular sem estourar limites.

### 2.2. Mobile Defense & High Z-Index Coverage
- **Problema**: Elementos flutuantes (Widget Chat, Vercel Analytics) passavam "por cima" da barra de navegação do celular. O menu cortava em telas curtas (iPhone SE).
- **Solução**:
  - Elevação do `z-index` da Sidebar Wrapper e Overlay para `99999`.
  - Habilitação de `overflow-y: auto` e `-webkit-overflow-scrolling: touch`.
  - Adoção da unidade de altura dinâmica `100dvh` (Dynamic Viewport Height).

### 2.3. Omni-Channel Chat Responsivo
- **Problema**: O chat admin Master ficava invisível em telas mobile devido a grid de colunas fixas.
- **Solução**:
  - **View do Admin**: Padrão "Messenger Style" (Lista -> Chat único) com botão de navegação "← Voltar" exclusivo para mobile.
  - **View do Cliente**: Widget flutuante transformado em "Slide-up Sheet" no celular, cobrindo 85% da tela para melhor ergonomia de digitação.

### 2.4. Centralização e Segurança Operacional (RBAC)
- **Problema**: As rotas `Meus Casamentos` e `Gestão de Eventos` eram redundantes, confundindo o fluxo de navegação.
- **Solução**:
  - Fusão completa na tela `/admin/dashboard` (Plataforma Mode).
  - Deleção física do diretório legado `/admin/eventos`.
  - Adicionado controle de cargo por card: `Staff` apenas visualiza; `Owner` e `Master` possuem controles dinâmicos de Edição e Exclusão.

---

## 3. Fase de Blindagem: Matriz de Testes e Cenários de Riscos

A complexidade das mudanças, embora benéficas, introduz novos pontos únicos de falha que precisam de monitoramento preventivo.

### 🔥 Cenários de Teste Críticos (Atenção Redobrada)
1. **Double Token Racing**: Garantir que o `EventContext` não dispare loops de atualização de token ao usar login social ou recarregar a página com o console aberto.
2. **ViewPort Shift em iOS**: Verificar se o Teclado Nativo do iOS empurra o input do chat widget para cima corretamente, sem esconder a caixa de mensagem.
3. **Propagação de Clique em Card**: Assegurar que clicar em `🗑️ Excluir` dentro do card do casamento **não execute** o `setCurrentEvent` que mudaria a tela do painel.

---

## 4. E2E Test Registry (Roteiro Playwright Recomendado)

Para blindar essa arquitetura contra regressões futuras, o time de QA deve implementar os seguintes cenários de automação:

### 🧪 Bloco A: Responsividade & Renderização
- `TEST-004-01`: **Renderização Contida do Convite**:
  - *Ação*: Carregar o painel de Configurações.
  - *Validação*: Verificar via `computedStyle` se o tamanho da fonte da seção de história no Frame é menor ou igual a uma porcentagem fixa do `clientWidth` do container do simulador, e nunca da `window`.
- `TEST-004-02`: **Acessibilidade Visual Sidebar (iPhone SE Emulator)**:
  - *Ação*: Simular dispositivo iPhone SE (375x667), abrir menu lateral.
  - *Validação*: Validar que o botão "Sair da Conta" é visível e acessível através de scroll (`isIntersectingViewport` após scroll).

### 🧪 Bloco B: Segurança de Acesso e Fluxos RBAC
- `TEST-004-03`: **Proteção Staff no Dashboard Centralizado**:
  - *Ação*: Logar como usuário com role `organizador` (Staff).
  - *Validação*: O botão "⚙️ Editar" e "🗑️ Excluir" **NÃO DEVEM** existir no DOM do card do evento.
- `TEST-004-04`: **Poder Master Universal**:
  - *Ação*: Logar como Master Admin.
  - *Validação*: Confirmar presença dos botões gerenciais em **todos** os cards listados no Dashboard.

### 🧪 Bloco C: UX de Suporte Mobile
- `TEST-004-05`: **Fluxo Alternado Chat Master**:
  - *Ação*: Em tela de 375px no `/admin/suporte`, clicar em um chamado ativo.
  - *Validação*: A lista de chamados (`.sidebar`) deve receber `display: none` e a área de chat deve estar visível, contendo o botão "Voltar". Clicar em voltar e verificar inversão.

---
*Nota de Homologação: Documento validado pelo Maestro AI e arquivado para referências de conformidade.*
