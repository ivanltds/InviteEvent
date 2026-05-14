# PRD-012-D: Smart Gift List — Central de Operações Globais (Cockpit de Gestão & Cura)
> **Fase:** DESCOBERTA (Escopo Consolidado - Bloco D)  
> **Autor:** @ba & @maestro  
> **Status:** ABERTO PARA UX  
> **Objetivo:** Empoderar o Operador com controle total sobre o inventário global de presentes, oferecendo ferramentas visuais de manipulação direta (CRUD) e gatilhos manuais para a automação de auto-cura (Self-Healing) da IA.

---

## 1. Visão Geral do Bloco D
Esta fase expande a interface do Administrador (Manager) para entregar governança total sobre o catálogo de presentes que circula em todo o ecossistema do InviteEventAI. O operador terá uma visão consolidada, saindo do modelo focado em um único evento e partindo para uma gestão em nível de infraestrutura. Além de criar, editar e excluir qualquer item, o operador poderá forçar o reprocessamento inteligente da IA (Daemon de Cura) tanto para itens isolados quanto para o catálogo inteiro sob demanda.

---

## 2. Requisitos Funcionais Detalhados

### RF01 - Nova Aba "Gestão de Presentes" no Painel Manager
*   A interface administrativa principal deve ganhar uma nova Tab/Menu intitulada **"Gestão de Presentes"**.
*   A aba deve ter um layout focado em produtividade (tabela densa com filtros, paginação rápida e botões de ação rápida).

### RF02 - Grid/Tabela de Inventário Global
*   Exibição unificada de todos os presentes cadastrados na base, seguindo os padrões estruturais da tabela de presentes do organizador (espaçamentos, tipografia e fluxo).
*   **Alternância de Visualização:** O módulo deve prover botões de **View Toggle** permitindo ao operador chavear instantaneamente entre a **Visualização de Tabela (List)** e a **Visualização em Cards (Grid)** do app.
*   **Colunas Críticas:** Foto (miniatura), Nome do Produto, Loja de Origem, Preço Atual, Status de Integração e a métrica operacional **"Casamentos Ativos"** (número de listas ativas em que este presente está vinculado atualmente).
*   Filtros de busca dinâmica por nome, ASIN/SKU ou Loja.

### RF03 - CRUD e Ações Operacionais (Padrão de Iconografia)
Cada linha da tabela (e card) deve dispor dos seguintes botões de ação padrão, com iconografia limpa e sem emojis (Feather Icons):
1.  **👁️ Ver Detalhes:** Raio-x completo do item no SaaS, listando dados contábeis e métricas de engajamento.
2.  **✏️ Editar:** Permite corrigir nomes, links, e fotos no banco global.
3.  **⏸️ Pausar:** Oculta temporariamente o presente de todas as vitrines ativas sem apagá-lo da base.
4.  **🗑️ Excluir Global (Regra de Segurança):** Remoção do item do catálogo base. 
    *   **🔒 Regra de Integridade:** O sistema deve impedir a deleção física que corrompa dados contábeis. Ao excluir, o item é removido de vitrines futuras, mas o histórico de presentes **já presenteados/comprados** (recebidos) nos casamentos anteriores **DEVE ser preservado intacto** para fins contábeis e financeiros dos noivos.

### RF04 - Gatilho Individual "Colocar na Fila de Cura"
*   Integrado como o quinto botão de ação nas linhas: `🔧 Cura IA`.
*   **Ação Técnica:** Ao clicar, o sistema cria uma entrada imediata na tabela de controle operacional (`public.fila_ajuste_links`), sinalizando ao Daemon Inteligente que aquele item necessita de auditoria SerpWow e auto-healing imediato.

### RF05 - Botão Global "Refresh de Cura" (Forçamento em Massa)
*   Um botão em posição de destaque no cabeçalho: `⚡ Refresh Curation Queue`.
*   **Mecânica:** Dispara confirmação em lote e insere na fila operacional todos os itens ativos para varredura massiva.

---

## 3. Fluxo de Negócio / UX
1.  O Administrador acessa o Cockpit Manager.
2.  Navega até a aba "Gestão de Presentes".
3.  Observa que um presente da Amazon está sem preço ou com imagem quebrada.
4.  Clica no botão de ação rápida "Enviar para Cura".
5.  O sistema exibe notificação (Toast) de sucesso: "Item enfileirado para o Daemon Inteligente!".
6.  O Daemon processa a fila, busca na SerpWow e atualiza o item no background.

---

## 4. Critérios de Aceite (Milestone D)
1. [ ] Aba "Gestão de Presentes" carregando dados reais de forma global no painel administrativo.
2. [ ] Possibilidade de Criar, Editar e Excluir presentes através da UI sem erros de console.
3. [ ] Ação de "Enviar para Cura" cria com sucesso o registro de correção e dispara logs no console.
4. [ ] Botão "Refresh" de cabeçalho aciona atualização massiva em lote após confirmação amigável.
